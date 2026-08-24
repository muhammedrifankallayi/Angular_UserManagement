# Bug Report and Vulnerability Assessment

## Overview
This document provides a comprehensive report of identified security vulnerabilities, logic errors, architectural/code quality issues, and failing tests across the backend and frontend components of the application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** JWT signing and verification use a hardcoded string `"secret"` instead of referencing the environment variable `process.env.jwtsecret` (defined in `backend/.env`).
- **Impact:** Anyone with knowledge of the repository or source code can forge valid JWT tokens for any user or admin ID.

### 1.2 Missing Authentication and Authorization Middleware on Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Administrative endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication/authorization checks.
- **Impact:** Any unauthenticated remote user can list, edit, create, or delete arbitrary user accounts by sending HTTP requests to these endpoints.

### 1.3 Sensitive Password Hashes Exposed in API Responses
- **Location:** `backend/routes/adminroute.js` (e.g., `adminrouter.get('/users')`)
- **Issue:** The `/users` route returns raw Mongoose user documents directly without removing or omitting the `password` field.
- **Impact:** Hashes of user passwords are leaked to anyone accessing the API.

### 1.4 Admin Session Overwritten Upon Creating User
- **Location:** `backend/routes/adminroute.js` (`/createuser`)
- **Issue:** When an admin creates a user via `/createuser`, the route generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP-only cookie.
- **Impact:** The administrator's active session cookie is immediately overwritten, logging out the administrator and impersonating the newly created user.

---

## 2. Backend Logic and Quality Issues

### 2.1 Unhandled `req.file` Null Pointer Exception on Profile Upload
- **Location:** `backend/routes/routes.js` (`/profile-upload-single`)
- **Issue:** The handler accesses `req.file.filename` directly without checking if `req.file` is defined.
- **Impact:** If an upload request is sent without a file attachment, the server throws an unhandled error (`TypeError: Cannot read property 'filename' of undefined`), potentially crashing or hanging the request.

### 2.2 Type Inconsistency in Mongoose User Model Schema
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as `type: String` with `default: false` (a boolean).
- **Impact:** Mongoose stores string `"false"` or boolean `false` inconsistently, leading to unexpected evaluation results in logic checks like `is_admin: true`.

### 2.3 Suppressed Errors and Empty Catch Blocks
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** Several try/catch blocks either log errors without returning an HTTP response or are completely empty (e.g., in `/profile-upload-single` and `/deleteUser/:id`).
- **Impact:** Client requests hang indefinitely when errors occur, and server logs fail to capture useful diagnostic information.

### 2.4 Hardcoded Database Connection String
- **Location:** `backend/index.js`
- **Issue:** `mongodb://127.0.0.1:27017/jwtproject` is hardcoded directly in the source code.
- **Impact:** Inflexible database configuration across development, staging, and production environments.

---

## 3. Frontend Bugs and Structural Issues

### 3.1 Angular `HttpClient.post` Options Parameter Order Error
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/` and `admin-useredit/`
- **Issue:** In `HttpClient.post()` calls, request options (e.g. `{ withCredentials: true }`) are passed as the second argument (request body) instead of the third argument.
- **Impact:** Post payloads are malformed or lost, and required request options (like cookie credentials) are ignored.

### 3.2 Non-Functional Static Search Input
- **Location:** `AdminUserlistComponent`
- **Issue:** The search input in the admin user list template is static HTML with no backing event bindings, component properties, or NgRx selector filtering.
- **Impact:** Searching in the admin panel does not perform any filtering.

### 3.3 Misspelled Directory Name
- **Location:** Root repository directory (`frondend/` instead of `frontend/`)
- **Issue:** Directory name contains a typo.

---

## 4. Test Suite and Coverage Issues

### 4.1 Frontend Unit Test Failures
- **Location:** `frondend/jwtapp/`
- **Issue:** 12 out of 14 Angular component spec tests fail on execution (`./node_modules/.bin/ng test`).
- **Root Cause:** Spec files lack appropriate test module imports in `TestBed` setup (missing `HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).

### 4.2 Missing Backend Test Suite
- **Location:** `backend/package.json`
- **Issue:** No automated test suite or test scripts are defined for backend routes and services.
