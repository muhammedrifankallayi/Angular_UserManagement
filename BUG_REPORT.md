# Bug Report & Audit Summary

This document provides a comprehensive report of bugs, security vulnerabilities, logic errors, and testing issues discovered in the codebase.

---

## 1. Backend Issues & Vulnerabilities (`backend/`)

### 1.1 Security Vulnerabilities
* **Hardcoded Secret Key for JWT Signing**:
  * **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
  * **Description**: `jwt.sign(...)` and `jwt.verify(...)` use the hardcoded string `"secret"` rather than reading from environment variables (e.g. `process.env.jwtsecret` from `.env`).
  * **Impact**: Exposes secret key in source code, making JWT tokens easy to forge if source is compromised.

* **Missing Authentication & Authorization Middleware on Admin Endpoints**:
  * **Location**: `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
  * **Description**: Admin CRUD routes lack cookie verification or admin status checks (`is_admin: true`). Unauthenticated users can access or modify user data if they know the endpoints.
  * **Impact**: Unauthenticated parameter tampering and unauthorized administrative access.

* **Sensitive Field Exposure (Hashed Passwords)**:
  * **Location**: `backend/routes/adminroute.js` (`GET /api/admin/users`)
  * **Description**: The `/users` route returns raw Mongoose user documents without stripping out the `password` field.
  * **Impact**: Exposes user password hashes to client responses.

* **Admin Session Overwrite on User Creation**:
  * **Location**: `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
  * **Description**: Creating a user sets a new `jwt` cookie with the newly created user's ID, which overwrites the logged-in administrator's JWT cookie.
  * **Impact**: Logs out the admin user or changes their active session context upon creating a user.

* **Lack of CSRF Protection**:
  * **Location**: `backend/index.js`
  * **Description**: CORS is configured with `credentials: true` for `http://localhost:4200`, but no CSRF token protection or SameSite cookie restrictions are enforced.

---

### 1.2 Schema & Logic Issues
* **Schema Field Type Inconsistency (`is_admin`)**:
  * **Location**: `backend/models/user.js`
  * **Description**: `is_admin` is typed as `String`, but has a default value of boolean `false`. Mongoose converts `false` to `"false"` (a truthy string in JS).
  * **Impact**: Inconsistent comparison checks across endpoints when validating admin permissions.

* **Suppressed Exceptions & Empty Catch Blocks**:
  * **Location**: `backend/routes/adminroute.js` and `backend/routes/routes.js`
  * **Description**: Multiple routes (`/logout`, `/deleteUser/:id`, `/profile-upload-single`, etc.) have empty `catch` blocks or fail to return response status codes on errors.
  * **Impact**: Requests hang or fail silently without sending HTTP error responses to the client.

* **Hardcoded Database Connection String**:
  * **Location**: `backend/index.js`
  * **Description**: MongoDB URL `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of configured via environment variables.

---

## 2. Frontend Issues (`frondend/jwtapp/`)

### 2.1 Logic & API Bugs
* **Incorrect HttpClient `POST` Parameter Signatures**:
  * **Location**: `AdminUserlistComponent` (`deleteUser`) and `AdminUsereditComponent` (`getusers`)
  * **Description**: `http.post(url, { withCredentials: true })` passes options as the 2nd argument (request body) instead of the 3rd argument.
  * **Impact**: Sends `{ withCredentials: true }` as request payload with default options, causing authentication cookie sending to fail if CORS settings require options.

* **Static / Non-functional Search Filter**:
  * **Location**: `AdminUserlistComponent` (`admin-userlist.component.html`)
  * **Description**: The search input field `<input type="text" placeholder="Search" class="input">` is non-functional and lacks data binding or filter logic in the component.

* **Missing File Input Validation**:
  * **Location**: `ProfileComponent` (`profile.component.ts`)
  * **Description**: `onSubmit()` accesses `this.selectedFile.name` without checking if `selectedFile` is null.
  * **Impact**: Calling submit without selecting a file throws a runtime TypeError.

---

## 3. Architecture & Testing Issues

* **Frontend Unit Test Failures**:
  * **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
  * **Description**: 12 of 14 unit test specs fail due to missing module imports (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).

* **Misspelled Directory Name**:
  * **Location**: Repository root directory
  * **Description**: The frontend directory is named `frondend` instead of `frontend`.
