# Bug Report and Application Audit

## Executive Summary
This document provides a comprehensive bug report and technical audit of the application repository (composed of a Node.js/Express backend and an Angular frontend). The investigation identified multiple critical logic errors, security vulnerabilities, API misuse, missing error handling, and test infrastructure setup failures.

---

## 1. Repository & Directory Structure
- **Directory Misspelling**: The frontend directory is misspelled as `frondend` instead of `frontend`. This causes inconsistencies in path resolution, documentation, and scripts.

---

## 2. Backend Vulnerabilities, Logic Errors & Data Issues

### 2.1 Missing Authentication and Authorization Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Administrative endpoints such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, `POST /api/admin/editUser`, and `POST /api/admin/createuser` do not apply JWT verification or admin role validation middleware. Unauthenticated users can directly access or modify sensitive administrative resources by invoking these endpoints.
- **Impact**: Critical security vulnerability allowing unauthorized access, data exposure, and administrative manipulation.

### 2.2 Hardcoded Secrets and Configuration Parameters
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`, `backend/index.js`
- **Description**:
  - JWT signing and verification use a hardcoded fallback string (`"secret"`) instead of consuming `process.env.jwtsecret` from environment configuration.
  - The MongoDB connection string is hardcoded in `backend/index.js` (`mongodb://127.0.0.1:27017/jwtproject`).
- **Impact**: Hardcoded secrets present a major credential leak risk and prevent environment-specific configuration deployment.

### 2.3 Sensitive Data Exposure (Password Hashes Exposed in User List)
- **Location**: `backend/routes/adminroute.js` (`GET /api/admin/users`)
- **Description**: The `GET /api/admin/users` route fetches user documents (`User.find({})`) and returns the full JSON response without excluding or projecting out the `password` field (bcrypt hash).
- **Impact**: Exposes password hashes for all users in administrative responses.

### 2.4 Admin Session Overwrite Bug on User Creation
- **Location**: `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
- **Description**: When an administrator creates a new user account via `/api/admin/createuser`, the handler generates a JWT token for the *newly created user* and attaches it as a cookie (`res.cookie("jwt", token)`).
- **Impact**: Creating a user account immediately overwrites the logged-in administrator's JWT session cookie with the new user's identity, logging the admin out or demoting their context.

### 2.5 Unhandled Upload Requests & Crash Vulnerabilities
- **Location**: `backend/routes/routes.js` (`POST /api/profile-upload-single`)
- **Description**: The profile upload endpoint attempts to read `req.file.filename` without verifying if `req.file` exists. If a request is submitted without a file attachment, `req.file` is `undefined`, raising a `TypeError`. Because the surrounding `catch (error)` block is empty, the exception is swallowed without sending an HTTP response, causing client HTTP requests to hang indefinitely until timeout.
- **Impact**: Poor error visibility, potential server hangs, and poor client UX.

### 2.6 Suppressed Errors and Empty Catch Blocks
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Multiple route handlers contain empty or ineffective catch blocks (e.g., `catch (error) {}` or `catch (error) { console.log(error.message); }`) without returning appropriate HTTP error status codes (e.g., 500 Internal Server Error) to clients.
- **Impact**: Failed backend operations appear stuck or unhandled on the client side.

### 2.7 Mongoose Schema Field Type Mismatch
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field in the user model is defined as `type: String` with `default: false` (a boolean literal).
- **Impact**: Inconsistent typing between string representations and boolean checks can result in unexpected evaluation in MongoDB queries or JavaScript condition statements.

### 2.8 Missing Server Start Script
- **Location**: `backend/package.json`
- **Description**: The `scripts` object in `backend/package.json` lacks a standard `"start": "node index.js"` command.

---

## 3. Frontend Bugs, API Misuse & Unit Test Failures

### 3.1 Angular `HttpClient.post` Argument Misuse
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description**:
  - In `AdminUserlistComponent.deleteUser()`: `http.post(url, { withCredentials: true })` passes options as the second argument (`body`) instead of the third argument (`http.post(url, body, options)`).
  - In `AdminUsereditComponent.getusers()`: `http.post(url, { withCredentials: true })` similarly passes options in place of the request body.
- **Impact**: The backend receives `{ withCredentials: true }` as the request body payload while the browser sends the HTTP request without `withCredentials: true`, leading to cookie/session transmission issues.

### 3.2 Static / Unimplemented Search UI
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search bar `<input type="text" placeholder="Search" class="input">` is non-functional static HTML with no event handlers, `[(ngModel)]` binding, or NgRx filter action/selector implementation.
- **Impact**: Search filtering on the user list table does not function.

### 3.3 Angular Spec Unit Test Failures
- **Location**: Frontend component unit test files (`*.spec.ts`)
- **Description**: Unit tests fail during execution due to unprovided Angular dependencies in `TestBed.configureTestingModule` (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing Store providers).
- **Impact**: Test suite fails during automated testing runs.

---

## 4. Architectural & Security Best Practice Recommendations
1. **CSRF Protection**: Implement CSRF token validation on cookie-authenticated mutating endpoints.
2. **Environment Configuration**: Centralize environment variable loading (`process.env.jwtsecret`, `process.env.MONGODB_URI`) and remove all fallback hardcoded secret strings.
3. **Middleware Guards**: Implement `authMiddleware` and `adminMiddleware` wrappers across all administrative routes.
4. **API Parameter Corrections**: Ensure all frontend `HttpClient.post` calls supply an explicit body argument before options (e.g., `http.post(url, {}, { withCredentials: true })`).
5. **TestBed Setup**: Update Angular unit test specs to import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
