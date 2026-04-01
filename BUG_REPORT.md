# Bug Report

This report documents the security vulnerabilities, logic errors, environment issues, and test failures identified in the application.

## 1. Security Vulnerabilities

### 1.1 Password Leak in Admin Users Endpoint
- **File:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/users` GET endpoint returns all user data, including hashed passwords. The logic to exclude passwords is currently commented out.
- **Impact:** Administrative access can expose all users' hashed passwords, which can be cracked.

### 1.2 Administrative Session Overwrite
- **File:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/createuser` endpoint issues a new JWT cookie for the newly created user, overwriting the administrator's own session cookie.
- **Impact:** Administrators are logged out every time they create a new user.

### 1.3 Hardcoded JWT Secret
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The secret key `"secret"` used for signing and verifying JWTs is hardcoded in multiple files instead of being pulled from environment variables (`process.env.JWT_SECRET`).
- **Impact:** Compromises the security of the entire authentication system if the source code is leaked.

### 1.4 Missing Middleware and CSRF Protection
- **Files:** `backend/index.js`, `backend/routes/adminroute.js`
- **Issue:** Administrative endpoints are currently unprotected. The `backend/middleware/auth.js` file mentioned in documentation is missing, and there is no CSRF protection implemented for state-changing requests.
- **Impact:** Unauthorized access to administrative functions and susceptibility to CSRF attacks.

## 2. Logic Errors

### 2.1 Broken User Search
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field in the admin user list is a plain HTML input and is not bound to any component logic (e.g., via `ngModel` or Reactive Forms).
- **Impact:** The search functionality does not work; users cannot filter the user list.

### 2.2 Incorrect HttpClient Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** In several `http.post` calls, the `options` object (containing `withCredentials: true`) is passed as the second argument instead of the third.
- **Impact:** For POST requests, the second argument is interpreted as the request body. Consequently, authentication cookies are not sent, leading to unauthorized errors.

### 2.3 Model Type Inconsistency
- **File:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a default value of `false` (Boolean).
- **Impact:** Potential data corruption or unexpected behavior during queries and type checks.

## 3. Environment and Project Structure

### 3.1 Directory Misspelling
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Inconsistency and potential confusion for developers or automated scripts expecting standard naming conventions.

### 3.2 Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** The `package.json` file lacks a `start` script.
- **Impact:** Users must manually run `node index.js` instead of the standard `npm start`.

## 4. Test Failures

### 4.1 Frontend Unit Tests
- **Result:** 12 out of 14 tests failed.
- **Root Cause:** `NullInjectorError` due to missing providers (`HttpClient`, `Store`, etc.) in the `TestBed` configuration of `.spec.ts` files.
- **Impact:** Reliable automated testing is currently impossible.

### 4.2 Backend Tests
- **Result:** Fails with `Error: no test specified`.
- **Root Cause:** No test suite or framework has been configured for the backend.
