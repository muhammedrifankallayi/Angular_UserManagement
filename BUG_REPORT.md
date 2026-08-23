# Bug Report and Vulnerability Audit

## 1. Executive Summary
This document provides a comprehensive report of security vulnerabilities, logic errors, frontend bugs, model inconsistencies, and architectural deficiencies identified across the application codebase (Node.js/Express backend and Angular frontend).

---

## 2. Security Vulnerabilities

### 2.1 Missing Authentication & Authorization Middleware on Admin Routes
* **File:** `backend/routes/adminroute.js`
* **Description:** Administrative endpoints (such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware.
* **Impact:** Any unauthenticated user or guest can trigger administrative operations (e.g. deleting users, modifying user accounts, listing all registered users).
* **Recommendation:** Implement authentication middleware verifying the JWT cookie and checking `is_admin` status before executing any admin action.

### 2.2 Hardcoded JWT Secret Key
* **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** The JWT token signing and verification methods use a hardcoded fallback string (`"secret"`) instead of reading from environment variables (`process.env.jwtsecret`).
* **Impact:** Anyone with access to the codebase can forge valid JWT tokens, bypassing session security.
* **Recommendation:** Update all `jwt.sign()` and `jwt.verify()` calls to rely on `process.env.jwtsecret`.

### 2.3 Password Hash Exposure in User Management Endpoint
* **File:** `backend/routes/adminroute.js`
* **Description:** The `GET /api/admin/users` endpoint executes `User.find({})` and directly returns user documents without omitting or stripping the `password` field.
* **Impact:** Password hashes of all system users are exposed to any client calling this endpoint.
* **Recommendation:** Exclude the `password` field from query results (e.g., `User.find({}, { password: 0 })`) or strip it before sending the HTTP response.

### 2.4 Lack of CSRF Protection
* **File:** `backend/index.js`
* **Description:** CORS is configured to support credentials (`credentials: true`), but the server lacks anti-CSRF token verification or strict SameSite cookie configuration.
* **Impact:** Cross-Site Request Forgery (CSRF) attacks could be performed against authenticated users.
* **Recommendation:** Introduce CSRF protection middleware and set secure cookie attributes (`SameSite`, `HttpOnly`, `Secure`).

---

## 3. Backend Logic & Reliability Bugs

### 3.1 Admin `createuser` Endpoint Overwrites Admin JWT Cookie
* **File:** `backend/routes/adminroute.js`
* **Description:** When an admin creates a new user via `/api/admin/createuser`, the backend generates a JWT for the newly created user and sets it in `res.cookie("jwt", token)`.
* **Impact:** Creating a new user logs out the admin and logs them in as the newly created user.
* **Recommendation:** Remove `res.cookie()` calls from administrative user creation logic.

### 3.2 Unhandled Exceptions and Empty Catch Blocks
* **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Several route handlers contain empty `catch (error) {}` blocks or log errors without returning an HTTP response to the client.
* **Impact:** Unhandled runtime exceptions leave HTTP requests hanging indefinitely without sending error status codes (e.g., 500 Internal Server Error).
* **Recommendation:** Implement robust error handling middleware and ensure every catch block sends appropriate HTTP status responses.

### 3.3 File Upload Null Pointer Exception
* **File:** `backend/routes/routes.js`
* **Description:** In `/profile-upload-single`, `req.file.filename` is accessed directly without verifying whether `req.file` exists.
* **Impact:** Submitting a request without an attached file causes a server runtime exception.
* **Recommendation:** Add validation checking `if (!req.file)` before reading properties.

### 3.4 Model Schema Inconsistency (`is_admin`)
* **File:** `backend/models/user.js`
* **Description:** The `is_admin` schema property is defined with `type: String` while defaulting to boolean `false`.
* **Impact:** Type inconsistency across database queries (e.g. querying with boolean vs string values).
* **Recommendation:** Change `is_admin` type to `Boolean` with `default: false`.

---

## 4. Frontend Bugs & Deficiencies

### 4.1 Incorrect Angular `HttpClient.post()` Parameter Structure
* **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Description:** HTTP POST calls for `deleteUser` and `editDetails` pass options `{ withCredentials: true }` as the second argument (request body) instead of the third argument (options).
* **Impact:** Requests fail or send options object as the HTTP payload instead of HTTP headers/options.
* **Recommendation:** Supply an empty body `{}` as the second argument when sending POST requests with options.

### 4.2 Non-functional Search Input in User List
* **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input `<input type="text" placeholder="Search" class="input">` is non-functional static HTML and is not bound to component logic or state selectors.
* **Impact:** Users cannot filter the user list using the search bar.
* **Recommendation:** Bind the search input to a search term control/state and filter users dynamically.

### 4.3 Unit Test Setup Failures (`NullInjectorError`)
* **Files:** Angular spec files in `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:** Unit test specifications fail due to missing providers (`HttpClient`, `Router`, `Store`).
* **Impact:** Test suite fails when running `ng test`.
* **Recommendation:** Add `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore` to `TestBed.configureTestingModule()`.

---

## 5. Architectural & Workspace Issues

### 5.1 Misspelled Frontend Directory
* **Location:** Repository Root
* **Description:** The directory name for the frontend application is misspelled as `frondend` instead of `frontend`.
* **Impact:** Workspace naming inconsistency.
* **Recommendation:** Rename `frondend` to `frontend` or update configuration scripts accordingly.

### 5.2 Missing Backend Test Suite & Script
* **File:** `backend/package.json`
* **Description:** The backend `package.json` lacks automated test suites and a `start` script.
* **Impact:** Developer friction and inability to verify backend logic via standard npm commands.
* **Recommendation:** Add test frameworks (e.g., Jest/Supertest) and define `start` / `test` scripts.
