# Bug Report - JWT App Project

This report documents several critical security vulnerabilities, logic errors, and environment issues identified in the project.

## 1. Security Vulnerabilities

### 1.1 Password Leak in Admin API
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `GET /api/admin/users`
- **Issue:** The code that excludes the password from the response is commented out. Consequently, the endpoint leaks hashed passwords for all users.
- **Impact:** High. Exposure of hashed passwords can lead to offline brute-force attacks.

### 1.2 Unprotected Administrative Endpoints
- **File:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/createuser`) lack any authentication or authorization middleware.
- **Impact:** Critical. Any user (or unauthenticated attacker) can list, edit, or delete users.

### 1.3 Hardcoded JWT Secret
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` in multiple places for both signing and verification, ignoring the value in the `.env` file.
- **Impact:** Critical. An attacker knowing the secret can forge valid JWTs and impersonate any user.

### 1.4 Session Overwrite during User Creation
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `POST /api/admin/createuser`
- **Issue:** When an admin creates a new user, the server issues a new JWT cookie for the newly created user, overwriting the administrator's own session cookie.
- **Impact:** Medium. Admins are logged out and logged in as the new user every time they create one.

### 1.5 Missing CSRF Protection
- **Issue:** The application uses cookies for authentication but does not implement CSRF protection.
- **Impact:** High. Users are vulnerable to Cross-Site Request Forgery attacks.

---

## 2. Logic and Functional Errors

### 2.1 Broken Admin Search
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field is not connected to any logic or data binding. Typing in it has no effect on the displayed user list.

### 2.2 Incorrect HttpClient.post Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** `HttpClient.post` calls incorrectly pass the `withCredentials` options as the second argument (the request body) instead of the third argument (the options object).
- **Impact:** High. Requests fail to send/receive cookies, breaking authenticated sessions for these specific actions.

### 2.3 Mongoose Schema Type Inconsistency
- **File:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean).

---

## 3. Environment and Maintenance Issues

### 3.1 Misspelled Directory Name
- **Issue:** The frontend directory is named `frondend` instead of `frontend`. This is inconsistent and prone to causing path errors.

### 3.2 Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** There is no `start` script defined, requiring manual execution via `node index.js`.

### 3.3 Failing Frontend Unit Tests
- **Issue:** 12 out of 14 Angular unit tests are failing with `NullInjectorError` because the test suites are missing required providers (e.g., `HttpClient`, `Router`, `Store`).

### 3.4 Missing Middleware Files
- **Issue:** References to authentication middleware are implied, but `backend/middleware/auth.js` does not exist.
