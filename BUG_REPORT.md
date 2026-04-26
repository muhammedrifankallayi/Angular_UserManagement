# Bug Report - JWT App

## Security Vulnerabilities

### 1. Password Leak in Admin Users Endpoint
- **File:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/users` endpoint returns the full user objects from the database, including hashed passwords. The logic to exclude the password is currently commented out.
- **Impact:** Exposure of hashed passwords for all users to anyone who can access this endpoint.

### 2. Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`
- **Description:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`) do not have any authentication or authorization middleware. Although some endpoints like `/active` check for a JWT, others perform sensitive actions without verifying if the requester is an authenticated admin.
- **Impact:** Unauthorized users can list, edit, or delete users if they know the API endpoints.

### 3. Hardcoded JWT Secrets
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The string `"secret"` is hardcoded as the JWT secret key for signing and verifying tokens, despite a `jwtsecret` being defined in the `.env` file.
- **Impact:** Extremely easy for an attacker to forge JWT tokens and gain unauthorized access.

### 4. Administrator Session Overwrite on User Creation
- **File:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/createuser` endpoint, intended for admins to create new users, issues a new JWT cookie for the *newly created user*.
- **Impact:** When an admin creates a user, their own admin session cookie is overwritten by the new user's session, effectively logging the admin out and into the new account.

### 5. Missing CSRF Protection
- **Description:** The backend uses cookies for authentication but lacks any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Users are vulnerable to CSRF attacks where malicious websites can make requests to the API on their behalf.

### 6. Type Inconsistency in User Model
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean).
- **Impact:** Potential for logic errors when checking the `is_admin` status due to type mismatch or unexpected string values (e.g., `"false"` being truthy in JavaScript).

---

## Logic Errors

### 1. Broken Search Functionality
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field is not bound to any component property or method.
- **Impact:** The search bar is purely cosmetic and does not filter the user list.

### 2. Incorrect HttpClient Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** In several `http.post` calls, the `options` object (containing `withCredentials: true`) is passed as the second argument. For POST requests, the second argument is the request body, and the options should be the third argument.
- **Impact:** Requests are sent without the intended options (like `withCredentials`), leading to authentication failures because cookies are not sent.

---

## Environment and Test Issues

### 1. Misspelled Frontend Directory
- **Path:** `frondend/`
- **Description:** The frontend directory is consistently misspelled as `frondend` instead of `frontend`.
- **Impact:** Confusing for developers and might cause issues with automated scripts or configurations expecting standard naming.

### 2. Failing Angular Unit Tests
- **Description:** 12 out of 14 Angular unit tests are failing.
- **Root Cause:** Most failures are `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` (or a proper `HttpClient` provider) is missing from the test configurations.
- **Impact:** The project lacks a reliable automated test suite to verify frontend logic.

### 3. Missing Backend Scripts
- **File:** `backend/package.json`
- **Description:** There is no `start` script defined, and `npm test` only echoes an error.
- **Impact:** Inconvenience for developers trying to run or test the backend using standard npm commands.
