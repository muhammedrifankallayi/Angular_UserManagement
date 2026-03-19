# BUG REPORT

This report documents the security leaks, logic errors, and environment issues identified in the JWT application.

## 1. Security Leaks

### 1.1. Password Leakage in Admin User List
*   **File:** `backend/routes/adminroute.js`
*   **Endpoint:** `GET /api/admin/users`
*   **Issue:** The endpoint returns the entire user object, including hashed passwords. The logic to exclude the password is currently commented out.
*   **Impact:** Attackers could gain access to hashed passwords if they compromise an admin account or if the endpoint is accessed without authorization.

### 1.2. Unprotected Administrative Endpoints
*   **File:** `backend/routes/adminroute.js`
*   **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware.
*   **Impact:** Any user (or even unauthenticated users) can perform administrative actions if they know the endpoint URLs.

### 1.3. Administrator Session Overwrite during User Creation
*   **File:** `backend/routes/adminroute.js`
*   **Endpoint:** `POST /api/admin/createuser`
*   **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, effectively overwriting the administrator's session.
*   **Impact:** The administrator is logged out and replaced by the newly created user session.

### 1.4. Hardcoded JWT Secret
*   **File:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
*   **Issue:** The JWT secret is hardcoded as `"secret"` in multiple places instead of using an environment variable.
*   **Impact:** If the source code is compromised, the JWT secret is exposed, allowing attackers to forge tokens.

## 2. Logic and Type Errors

### 2.1. Type Inconsistency for `is_admin` Field
*   **File:** `backend/models/user.js`
*   **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean).
*   **Impact:** This can lead to unexpected behavior during database queries and type checks.

### 2.2. Non-functional Search Filter in Admin User List
*   **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
*   **Issue:** The search input in the admin user list template is not connected to any component logic (no `ngModel` or event binding).
*   **Impact:** Users cannot filter the list of users as expected.

### 2.3. Incorrect `HttpClient.post` Call Usage
*   **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
*   **Issue:** `HttpClient.post` calls are passing the `withCredentials` option as the second argument (the `body`) instead of the third argument (the `options`).
*   **Impact:** Authentication cookies are not sent with these requests, and the backend receives the options object as the request body.

## 3. Environment and Configuration Issues

### 3.1. Misspelled Frontend Directory
*   **Issue:** The frontend directory is named `frondend` instead of `frontend`.
*   **Impact:** Inconsistent naming and potential confusion for developers.

### 3.2. Missing `start` Script in Backend
*   **File:** `backend/package.json`
*   **Issue:** There is no `start` script defined in the backend's `package.json`.
*   **Impact:** Standard deployment and development workflows (like `npm start`) will fail.

## 4. Test Failures

### 4.1. Angular Unit Test Failures
*   **Issue:** 12 out of 14 Angular unit tests fail.
*   **Cause:** Most failures are `NullInjectorError: No provider for HttpClient!`. The test suites are missing the `HttpClientTestingModule` or equivalent providers.
*   **Impact:** Lack of reliable automated testing for frontend components.
