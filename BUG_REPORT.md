# Comprehensive Bug & Vulnerability Report

## Executive Summary
This document provides a detailed report on bugs, security vulnerabilities, architectural flaws, and test failures identified across the full-stack repository (Node.js/Express backend and Angular frontend).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets & Database Credentials
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`, `backend/index.js`
* **Issue:**
  * JWT tokens are signed and verified using a hardcoded string literal `"secret"` instead of loading `process.env.jwtsecret`.
  * The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded directly in `backend/index.js`.
* **Impact:** High. Secret keys exposed in source code compromise token signing security across environments.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Issue:** Several critical administrative endpoints lack authentication/authorization checks:
  * `GET /api/admin/users`
  * `POST /api/admin/deleteUser/:id`
  * `POST /api/admin/editDetails/:id`
  * `POST /api/admin/editUser`
  * `POST /api/admin/createuser`
* **Impact:** Critical. Unauthenticated users can perform administrative operations (view users, edit user info, delete users, or create new users) without valid JWT authentication or admin privileges.

### 1.3 Sensitive Data Exposure in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Issue:** The `User.find({})` call retrieves full user records—including hashed passwords—and returns them directly to the client without stripping sensitive fields.
* **Impact:** High. User password hashes are exposed over network responses.

### 1.4 Admin Session Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Issue:** When an administrator creates a new user, the server generates a JWT for the newly created user and attaches it as `res.cookie("jwt", token)`.
* **Impact:** High. Creating a new user immediately logs out the administrator and replaces their session cookie with the new user's session.

---

## 2. Backend Logic Errors & Data Schema Issues

### 2.1 Inconsistent Schema Type for `is_admin`
* **Location:** `backend/models/user.js`
* **Issue:** `is_admin` is defined as `type: String` with a default value of `false` (boolean):
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
* **Impact:** Medium. Leads to type inconsistencies and potential query errors when querying for admin users (`is_admin: true`).

### 2.2 Potential Crash on File Uploads (`req.file` Access)
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Issue:** `req.file.filename` is accessed directly without verifying whether `req.file` exists.
* **Impact:** Medium. Submitting a request without an attached file triggers an uncaught `TypeError: Cannot read properties of undefined (reading 'filename')`.

### 2.3 Exception Suppression & Empty Catch Blocks
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Issue:** Multiple routes contain empty `catch (error) {}` blocks or log errors without returning an HTTP error response (e.g. 500 Internal Server Error) to the client.
* **Impact:** Medium. Clients experience hanging requests or uninformative failures when exceptions occur server-side.

---

## 3. Frontend Bugs & UI Issues

### 3.1 Misplaced Options Parameter in `HttpClient.post` Calls
* **Location:**
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  * `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Issue:** Options object `{ withCredentials: true }` is passed as the second argument (`body`) instead of the third argument (`options`):
  ```typescript
  // Incorrect: passes options as request body
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
  ```
* **Impact:** High. Requests fail to pass authentication cookies (`withCredentials`) to the backend and send unwanted request bodies.

### 3.2 Non-Functional User Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Issue:** The search input `<input type="text" placeholder="Search" class="input">` is static HTML and lacks event handling, `ngModel` bindings, or integration with NgRx store selectors.
* **Impact:** Low/Medium. Search functionality is unresponsive for end users.

### 3.3 Root Directory Naming Typo
* **Location:** Root directory structure
* **Issue:** Frontend directory is named `frondend` instead of `frontend`.
* **Impact:** Low (codebase organization).

---

## 4. Testing & Test Environment Issues

### 4.1 Angular Unit Test Failures
* **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
* **Issue:** 12 out of 14 Angular component unit tests fail with dependency injection errors (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx Store providers).
* **Impact:** Medium. Automated frontend test suite fails to run cleanly.

### 4.2 Missing Backend Test Suite
* **Location:** `backend/package.json`
* **Issue:** No test framework or test scripts are configured for the backend application.
* **Impact:** Medium. Lack of automated regression testing for API endpoints.

---

## Recommendations for Remediation
1. **Security:** Implement a centralized authorization middleware (`requireAuth`, `requireAdmin`) for all admin routes, replace hardcoded JWT secrets with `process.env.jwtsecret`, and exclude `password` from `User` query projections.
2. **Backend:** Correct `is_admin` schema type to `Boolean`, validate `req.file` presence prior to processing file uploads, and handle exceptions with standard HTTP error responses.
3. **Frontend:** Correct `http.post` call parameter ordering (`http.post(url, body, options)`), connect the search input to NgRx state selectors, and update component test specs with necessary test bed imports (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
