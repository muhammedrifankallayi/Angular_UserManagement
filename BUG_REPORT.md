# Comprehensive Bug Report & System Assessment

## Overview
This report documents security vulnerabilities, backend logic errors, frontend implementation defects, test failures, and architectural issues discovered across the full stack application (Express backend and Angular frontend).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** JWT signing (`jwt.sign`) and verification (`jwt.verify`) operations use the literal string `"secret"` as the secret key instead of referencing `process.env.jwtsecret` from environment configuration.
* **Impact:** Attackers can easily forge JWT tokens and impersonate any user or administrator.

### 1.2 Unauthenticated & Unprotected Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware.
* **Impact:** Any unauthenticated remote user can list, edit, create, or delete users without logging in or presenting valid admin credentials.

### 1.3 Sensitive Data Leakage (Password Hash Exposure)
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Description:** The `GET /users` endpoint returns raw Mongoose query results (`User.find({})`) directly to the client without stripping password hashes.
* **Impact:** Exposes hashed passwords for all users in the system to any caller.

### 1.4 Admin Session Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Description:** When an administrator creates a new user, the backend generates a JWT token for the *newly created user* and sets it in `res.cookie("jwt", token, ...)` on the response.
* **Impact:** Overwrites the administrator's session cookie, demoting or hijacking the admin's active session upon user creation.

---

## 2. Backend Logic Errors & Quality Defects

### 2.1 Mongoose Schema Type Inconsistency
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field is defined with type `String` (`type: String`) while setting a boolean default (`default: false`).
* **Impact:** Schema type mismatch leads to unpredictable query filtering when querying `is_admin: true` or `is_admin: "true"`.

### 2.2 Unchecked Property Access on File Upload
* **Location:** `backend/routes/routes.js` (`POST /api/profile-upload-single`)
* **Description:** The endpoint accesses `req.file.filename` without verifying if `req.file` exists.
* **Impact:** Submitting a profile upload request without an attached file triggers an unhandled `TypeError: Cannot read property 'filename' of undefined`, causing server error responses.

### 2.3 Empty Catch Blocks and Hanging HTTP Requests
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Multiple route handlers contain empty or logging-only `catch` blocks without calling `res.status(...).send(...)`.
* **Impact:** When an uncaught exception occurs during request handling, the connection is left open and client requests time out.

### 2.4 Hardcoded MongoDB Connection String
* **Location:** `backend/index.js`
* **Description:** Database connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded in the server bootstrap file rather than read from environment variables.

---

## 3. Frontend Implementation & UI Defects

### 3.1 Incorrect `HttpClient.post` Call Signatures
* **Location:** `AdminUserlistComponent` (`deleteUser`) and `AdminUsereditComponent` (`getusers`)
* **Description:** The Angular `HttpClient.post` method expects `(url, body, options)`. In these components, `{ withCredentials: true }` is passed as the second argument (the request `body`) rather than the third argument (`options`).
* **Impact:** `withCredentials` is not set on request options, causing session cookies to be omitted from requests. The request body is also populated with irrelevant configuration options.

### 3.2 Non-Functional Search Input
* **Location:** `AdminUserlistComponent` (`admin-userlist.component.html`)
* **Description:** The search input element (`<input type="text" placeholder="Search" class="input">`) is purely static HTML with no `ngModel`, event listeners, or corresponding filtering logic in the component or NgRx selectors.
* **Impact:** Users cannot search or filter the user list.

### 3.3 Misspelled Directory Name
* **Location:** Root directory (`frondend/`)
* **Description:** The frontend directory is misspelled as `frondend` instead of `frontend`.

---

## 4. Test Suite & Dependency Failures

### 4.1 Missing Providers in Component Unit Tests
* **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
* **Description:** Angular spec files instantiate components injecting `HttpClient`, `Router`, `Store`, and custom services without providing `HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`, or service mocks in `TestBed`.
* **Impact:** Running `ng test` results in `NullInjectorError` across 12 component unit test suites.

### 4.2 Missing Backend Test Suite
* **Location:** `backend/package.json`
* **Description:** The backend repository lacks unit/integration tests and test runner configurations in `scripts`.

---

## 5. Remediation Recommendations

1. **Backend Security Fixes:**
   - Replace hardcoded `"secret"` with `process.env.jwtsecret`.
   - Implement an authentication and admin role verification middleware for all routes under `/api/admin/*`.
   - Explicitly exclude password fields (`User.find({}).select('-password')` or map response) in admin list responses.
   - Do not set user JWT cookies when an administrator creates a user via `/api/admin/createuser`.

2. **Backend Logic & Schema Fixes:**
   - Update `user.js` schema to `is_admin: { type: Boolean, default: false }`.
   - Add `if (!req.file) return res.status(400).send({ message: "No file uploaded" });` before accessing `req.file.filename`.
   - Ensure every `catch` block returns an appropriate HTTP error response (e.g. `res.status(500).json(...)`).
   - Move database URI to environment configuration.

3. **Frontend Fixes:**
   - Fix `HttpClient.post` calls to pass `null` or `{}` as body and options as the 3rd parameter: `http.post(url, {}, { withCredentials: true })`.
   - Bind search input in `AdminUserlistComponent` to component state and implement filtering logic or an NgRx selector.
   - Fix spec files by configuring `TestBed` with `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
