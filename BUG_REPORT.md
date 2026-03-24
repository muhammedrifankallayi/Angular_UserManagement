# Bug Report - JWT Authentication Project

This report documents security vulnerabilities, logic errors, and testing issues identified in the project.

## 1. Security Vulnerabilities

### 1.1. Password Hash Leakage
- **File:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/users` endpoint returns all user data from the database. The logic to exclude the password field is currently commented out, causing hashed passwords to be sent in the API response.
- **Impact:** Critical. Exposure of password hashes facilitates offline brute-force attacks.

### 1.2. Unprotected Administrative Endpoints
- **File:** `backend/routes/adminroute.js`
- **Description:** Several administrative routes such as `/users`, `/deleteUser/:id`, `/editUser`, and `/createuser` lack authentication and authorization checks. There is no middleware to verify if the requester is a logged-in administrator.
- **Impact:** High. Any user or unauthenticated actor can list, create, edit, or delete users.

### 1.3. Hardcoded JWT Secrets
- **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** The application uses a hardcoded string `"secret"` for signing and verifying JSON Web Tokens (JWT), despite having a `jwtsecret` defined in the `.env` file.
- **Impact:** High. Hardcoded secrets are easily discovered, allowing attackers to forge valid authentication tokens.

### 1.4. Administrative Session Overwriting
- **File:** `backend/routes/adminroute.js`
- **Description:** In the `/createuser` endpoint, after successfully creating a new user, the backend generates a new JWT for that user and sets it in the `jwt` cookie.
- **Impact:** Medium. This overwrites the administrator's own session cookie with the new user's token, effectively logging the admin out and into the new user's account.

## 2. Logic Errors

### 2.1. Non-functional Search Filter
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field in the User List view is a plain HTML input and is not bound to any Angular logic (e.g., `ngModel` or Reactive Forms) or filtering pipe.
- **Impact:** Low/UI. Users cannot filter the user list as expected.

### 2.2. Type Inconsistency in User Model
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a default value of `false` (a Boolean).
- **Impact:** Low. This can lead to unexpected behavior during database queries and type-checking in the backend.

### 2.3. Incorrect Angular HttpClient Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `admin-useredit.component.ts`
- **Description:** `HttpClient.post` calls are passing the options object (containing `withCredentials: true`) as the second argument. For POST requests, the second argument is the request body, and options should be the third.
- **Impact:** Medium. Authentication cookies are not sent with these POST requests, which would cause them to fail once authentication middleware is properly implemented.

### 2.4. Misspelled Project Directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Low/Maintenance. Non-standard naming can lead to confusion for developers and issues with automated scripts.

## 3. Test Failures

### 3.1. Angular Unit Test Failures
- **Directory:** `frondend/jwtapp/`
- **Description:** 12 out of 14 unit tests are failing. The primary cause is `NullInjectorError`, indicating that the test environment (`TestBed`) is not correctly configured with required dependencies such as `HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, and `provideMockStore`.
- **Impact:** Medium. The lack of a working test suite prevents automated verification of new changes and increases the risk of regressions.
