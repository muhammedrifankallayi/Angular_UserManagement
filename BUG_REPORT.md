# Comprehensive Bug & Security Report

## Executive Summary
This document provides a detailed breakdown of identified security vulnerabilities, backend logic errors, frontend issues, schema inconsistencies, and test failures in the application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Issue:** `jwt.sign()` and `jwt.verify()` use a hardcoded fallback string `"secret"` instead of reading from `process.env.jwtsecret`.
* **Impact:** Any attacker who inspects or guesses the source code can forge valid JWT tokens for any user or administrator.
* **Remediation:** Replace hardcoded `"secret"` with `process.env.jwtsecret` and ensure `dotenv.config()` is loaded properly.

### 1.2 Missing Authentication & Authorization Middleware on Admin Endpoints
* **Location:** `backend/routes/adminroute.js`
* **Issue:** Administrative endpoints such as `/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/editDetails/:id`, `/api/admin/editUser`, and `/api/admin/createuser` do not perform session verification or `is_admin` authorization checks.
* **Impact:** Unauthenticated or non-admin users can access, modify, delete, or create user records.
* **Remediation:** Add authentication and admin authorization middleware to all admin routes.

### 1.3 Sensitive Data Exposure (User Password Hashes)
* **Location:** `backend/routes/adminroute.js` (`adminrouter.get('/users')`)
* **Issue:** The `/api/admin/users` endpoint returns raw Mongoose user documents without stripping out the `password` field.
* **Impact:** Exposes user password hashes over the network.
* **Remediation:** Strip or exclude `password` fields before returning user objects (e.g., `.select('-password')` or mapping objects to omit `password`).

### 1.4 Unprotected File Upload Endpoint
* **Location:** `backend/routes/routes.js` (`/profile-upload-single`)
* **Issue:** The file upload endpoint lacks validation for `req.file` existence, file extensions, MIME types, or file size limits.
* **Impact:** Sending a request without a file payload throws an unhandled `TypeError` crashing the request context. Uploading arbitrary file types could lead to remote code execution or storage exhaustion.
* **Remediation:** Validate `req.file` exists, restrict file extensions and MIME types in multer configuration, and enforce maximum file size limits.

### 1.5 Missing CSRF Protection
* **Location:** `backend/index.js`
* **Issue:** CORS configuration enables credentials (`withCredentials: true`) for `http://localhost:4200` without implementing anti-CSRF tokens or `SameSite` cookie policies.
* **Impact:** Vulnerable to Cross-Site Request Forgery attacks.
* **Remediation:** Implement CSRF mitigation (e.g. `SameSite=Lax` or `SameSite=Strict` cookies or CSRF token middleware).

---

## 2. Backend Logic, Schema & Configuration Errors

### 2.1 Inconsistent `is_admin` Field Schema
* **Location:** `backend/models/user.js`
* **Issue:** `is_admin` is defined as `type: String` with `default: false` (a boolean default).
* **Impact:** Queries checking `is_admin: true` in `adminroute.js` can lead to type inconsistencies or unexpected boolean/string comparisons.
* **Remediation:** Update the Mongoose schema definition for `is_admin` to `type: Boolean, default: false`.

### 2.2 Admin User Creation Overwrites Admin Session Cookie
* **Location:** `backend/routes/adminroute.js` (`adminrouter.post('/createuser')`)
* **Issue:** When an admin creates a user via `/api/admin/createuser`, the route issues a new JWT cookie for the *newly created user* and attaches it to `res.cookie("jwt", token)`.
* **Impact:** The administrator's active session cookie is overwritten by the new user's session token, logging the administrator out or converting their session context.
* **Remediation:** Remove cookie generation from the admin user creation endpoint. Return a success status without modifying response cookies.

### 2.3 Unhandled Errors and Missing HTTP Responses
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Issue:** Several `catch(error)` blocks (e.g. `/profile-upload-single`, `/logout`, `/deleteUser/:id`) are either empty or only log errors without returning an HTTP response to the client.
* **Impact:** Requests encountering exceptions hang indefinitely until timing out, degrading user experience and server performance.
* **Remediation:** Implement robust error handling middleware and ensure all catch blocks return appropriate HTTP status codes (e.g., 500 Internal Server Error) with error messages.

### 2.4 Hardcoded Database Connection String & Missing Start Scripts
* **Location:** `backend/index.js` and `backend/package.json`
* **Issue:** The MongoDB URI is hardcoded to `mongodb://127.0.0.1:27017/jwtproject`. Furthermore, `backend/package.json` lacks standard `start` and `test` scripts.
* **Impact:** Difficulties in deploying across different environments (staging/production) and automated workflows.
* **Remediation:** Use `process.env.MONGODB_URI` and add `"start": "node index.js"` to `backend/package.json`.

---

## 3. Frontend Bugs & Architectural Findings

### 3.1 Misplaced Options in `HttpClient.post()` Calls
* **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Issue:** Code calls `this.http.post(url, { withCredentials: true })`, passing the `{ withCredentials: true }` config as the second argument (`body`) instead of the third argument (`options`).
* **Impact:** The options object is sent in the HTTP POST request payload instead of configuring request headers and credentials, causing credentials not to be sent and backend payload parsing issues.
* **Remediation:** Correct signature to `this.http.post(url, {}, { withCredentials: true })`.

### 3.2 Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Issue:** The search input `<input type="text" placeholder="Search" class="input">` is static HTML without `[(ngModel)]`, event listeners, or NgRx filtering logic.
* **Impact:** Users cannot search or filter the user list.
* **Remediation:** Bind input value to a component property/search action and update NgRx selectors or component state to filter users by search term.

### 3.3 Typo in Frontend Root Directory Name
* **Location:** Root repository directory structure
* **Issue:** The directory is named `frondend` instead of `frontend`.
* **Impact:** Causes path confusion in scripts, documentation, and CI/CD setups.
* **Remediation:** Rename `frondend/` directory to `frontend/` and update references.

---

## 4. Test Failures & Environment State

### 4.1 Frontend Angular Unit Test Failures
* **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
* **Issue:** 12 out of 14 Angular component test suites fail with `NullInjectorError` (`No provider for HttpClient!`, `No provider for Router!`, missing NgRx Store dependencies).
* **Impact:** Automated test suites fail during CI/CD execution.
* **Remediation:** Update `TestBed.configureTestingModule` in test spec files to include `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()`.
