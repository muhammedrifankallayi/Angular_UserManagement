# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, and environmental issues identified in the project.

## 1. Security Vulnerabilities

### 1.1 Password Hash Leakage
- **File:** `backend/routes/adminroute.js`
- **Issue:** The `/users` endpoint returns the entire user object, including the hashed password. The code to exclude the password is currently commented out.
- **Impact:** Exposure of user password hashes to any authenticated (or even unauthenticated, see 1.3) user accessing the endpoint.

### 1.2 Hardcoded JWT Secret
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`
- **Issue:** The secret key used for signing and verifying JSON Web Tokens is hardcoded as `"secret"`.
- **Impact:** If an attacker knows the secret, they can forge valid JWTs and gain unauthorized access to any account.

### 1.3 Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`
- **Issue:** Many administrative endpoints (e.g., `/users`, `/deleteUser/:id`) do not have middleware to verify if the requester is actually an authenticated administrator.
- **Impact:** Any user or even an unauthenticated attacker could potentially delete users or view sensitive user lists.

### 1.4 Session Overwrite during User Creation
- **File:** `backend/routes/adminroute.js`
- **Issue:** The `/createuser` endpoint issues a new JWT and sets it in the `jwt` cookie upon successful creation of a user.
- **Impact:** When an administrator creates a new user, their own administrative session cookie is overwritten by the new user's token, effectively logging them out of their admin session.

### 1.5 Missing CSRF Protection
- **File:** `backend/index.js`
- **Issue:** The backend uses cookies for authentication (`credentials: true` in CORS) but does not implement any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Authenticated users are vulnerable to CSRF attacks where malicious websites can perform actions on their behalf.

## 2. Logic Errors

### 2.1 Non-functional Search Filter
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field is present in the template but is not bound to any property or event in the component logic.
- **Impact:** Users cannot filter the user list, making it difficult to manage a large number of users.

### 2.2 Incorrect HttpClient Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** `this.http.post` is called with the options object (containing `withCredentials: true`) as the second argument. In Angular's `HttpClient`, the second argument is the request body, and the options should be the third argument.
- **Impact:** The `withCredentials` option is ignored, and a body containing the options object is sent instead. This causes authentication to fail for these requests as cookies are not sent.

### 2.3 Model Type Inconsistency
- **File:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** Potential data integrity issues and unexpected behavior when querying or updating the `is_admin` status.

## 3. Infrastructure & Environment Issues

### 3.1 Misspelled Directory Name
- **Issue:** The main frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusing project structure and potential path issues in deployment scripts.

### 3.2 Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** There is no `"start"` script defined in `package.json`.
- **Impact:** Standard commands like `npm start` fail to start the backend server.

### 3.3 Failing Unit Tests
- **Issue:** Running Angular unit tests results in 12 out of 14 failures.
- **Root Cause:** `NullInjectorError` due to missing providers (`HttpClient`, `Router`, `Store`, etc.) in the test suites' `TestBed` configuration.
- **Impact:** Lack of reliable automated testing for the frontend components.
