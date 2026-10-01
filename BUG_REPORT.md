# Bug Report & System Vulnerability Analysis

## Executive Summary

This bug report provides a comprehensive analysis of security vulnerabilities, logic errors, architectural flaws, UI defects, and test suite issues identified across the application repository.

---

## 1. Security & Authentication Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Severity:** Critical
* **Description:** Both backend route files hardcode `"secret"` as the key for signing and verifying JWT tokens (`jwt.sign({...}, "secret")` and `jwt.verify(cookie, "secret")`), despite a `.env` file containing `jwtsecret="secret"`.
* **Impact:** Hardcoded secrets in source code allow anyone with code access to forge valid JWT tokens and bypass authentication completely.
* **Remediation:** Replace hardcoded strings with `process.env.jwtsecret`.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Severity:** Critical
* **Description:** Most administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication checks and admin role verification middleware.
* **Impact:** Unauthenticated or non-admin users can directly call these API endpoints to list, create, edit, or delete user accounts without valid session cookies.
* **Remediation:** Implement an authentication and admin role verification middleware (e.g. checking `req.cookies["jwt"]` and `user.is_admin`) and attach it to all protected admin endpoints.

### 1.3 Exposure of Sensitive Data (Password Hashes) in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /users`)
* **Severity:** High
* **Description:** The `GET /users` endpoint returns raw MongoDB user documents directly using `User.find({})` without stripping out the `password` field.
* **Impact:** Hashed user passwords are exposed via the API response to any consumer of the `/api/admin/users` endpoint.
* **Remediation:** Project out password fields in Mongoose query (e.g. `User.find({}, { password: 0 })`) or omit `password` prior to sending response.

### 1.4 Missing CSRF Protection
* **Location:** `backend/index.js`
* **Severity:** Medium
* **Description:** The application relies on HTTP-only cookies (`jwt`) with `cors({ credentials: true, origin: ['http://localhost:4200'] })` but lacks CSRF token validation.
* **Impact:** Cross-Site Request Forgery attacks can execute unauthorized actions on behalf of authenticated users.
* **Remediation:** Implement CSRF protection middleware or anti-CSRF token headers for state-changing requests.

---

## 2. Backend Logic Errors & Schema Issues

### 2.1 Mismatched Data Type for `is_admin` Field
* **Location:** `backend/models/user.js`
* **Severity:** Medium
* **Description:** In `userSchema`, `is_admin` is defined as `type: String` with `default: false` (a boolean).
* **Impact:** Mixing string types with boolean defaults causes inconsistent queries and type comparison issues (e.g., querying `{ is_admin: true }` in `adminroute.js`).
* **Remediation:** Update `userSchema` to set `type: Boolean, default: false`.

### 2.2 Admin Session Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
* **Severity:** High
* **Description:** When an admin creates a new user via `/api/admin/createuser`, the endpoint signs a new JWT token for the *newly created user* and overwrites the active `jwt` response cookie (`res.cookie("jwt", token, ...)`).
* **Impact:** An administrator creating a user is immediately logged out and re-authenticated as the newly created standard user.
* **Remediation:** Remove cookie setting logic from user creation endpoints intended for admin usage.

### 2.3 Unhandled Null Check on Profile Image Upload
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Severity:** Medium
* **Description:** The route accesses `req.file.filename` directly without checking if `req.file` exists.
* **Impact:** Uploading requests without a valid file attachment crash or throw uncaught exceptions (`TypeError: Cannot read properties of undefined`).
* **Remediation:** Verify `req.file` exists before accessing its properties and return a `400 Bad Request` if missing.

### 2.4 Silent Exception Suppression & Missing Error Responses
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Severity:** Medium
* **Description:** Multiple routes use empty `catch (error) {}` blocks or log `console.log(error.message)` without returning an HTTP response to the client.
* **Impact:** Requests hang until client timeout occurs when an exception is thrown in the backend.
* **Remediation:** Return proper status codes (e.g. `500 Internal Server Error`) and JSON error messages in all catch blocks.

---

## 3. Frontend Bugs & Architectural Defects

### 3.1 Misspelled Frontend Directory Name
* **Location:** Repository Root (`frondend/` instead of `frontend/`)
* **Severity:** Low
* **Description:** The frontend application directory is named `frondend`.
* **Impact:** Non-standard folder naming increases friction for developer navigation and build tooling scripts.
* **Remediation:** Rename `frondend` to `frontend`.

### 3.2 Incorrect `HttpClient` Options Parameter Positioning
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/` and `admin-useredit/`
* **Severity:** High
* **Description:** Angular `HttpClient.post()` calls pass request options as the 2nd argument (request body position) instead of the 3rd argument for requests without a body.
* **Impact:** Network requests fail or send `{ withCredentials: true }` as the request payload.
* **Remediation:** Pass options as the 3rd parameter or pass an empty body `{}` as the 2nd parameter when options are needed.

### 3.3 Non-Functional Search Input in User List UI
* **Location:** `AdminUserlistComponent` (`frondend/jwtapp/src/app/components/admin-userlist/`)
* **Severity:** Medium
* **Description:** The user search input element in the admin dashboard template is static HTML and lacks event binding, component logic, and NgRx selector filtering.
* **Impact:** Admin users cannot filter or search the user list.
* **Remediation:** Implement search state management or component pipe filtering tied to the search input `ngModel` or `input` event.

---

## 4. Test Suite & Dependency Findings

### 4.1 Missing Backend Test Suite
* **Location:** `backend/package.json`
* **Severity:** Low
* **Description:** Backend has no test framework or test scripts defined.
* **Remediation:** Add Supertest and Jest/Mocha suite to test backend API endpoints.

### 4.2 Frontend Unit Test Failures
* **Location:** `frondend/jwtapp/src/app/`
* **Severity:** Medium
* **Description:** Frontend unit tests fail due to missing module providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
* **Remediation:** Configure `TestBed` imports and mock providers across unit test spec files.
