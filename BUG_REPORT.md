# Bug Report & System Architecture Audit

## Executive Summary
This document provides a comprehensive report on security vulnerabilities, backend logic errors, data modeling issues, frontend defects, and test failures identified across the application repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** JWT signing and verification rely on a hardcoded string (`"secret"`) rather than reading the environment variable (`process.env.jwtsecret`).
- **Impact:** Exposes token signing mechanism; attackers with access to source code can forge valid JWT tokens.
- **Recommendation:** Update all `jwt.sign` and `jwt.verify` calls to reference `process.env.jwtsecret`.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Administrative endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication or admin role checking middleware.
- **Impact:** Any unauthenticated user or client can call administrative APIs directly to delete, modify, or list users.
- **Recommendation:** Implement and apply authentication and admin authorization middleware across all sensitive admin routes.

### 1.3 Sensitive Data Exposure (User Passwords in API Response)
- **Location:** `backend/routes/adminroute.js` (`/users` route)
- **Issue:** `User.find({})` returns raw database objects including hashed passwords directly to the client.
- **Impact:** Leaks password hashes of all registered users.
- **Recommendation:** Exclude password fields from query projections (e.g., `User.find({}, { password: 0 })`) or strip sensitive properties before sending responses.

---

## 2. Backend Logic & Data Modeling Issues

### 2.1 User Schema `is_admin` Field Type Inconsistency
- **Location:** `backend/models/user.js`
- **Issue:** `is_admin` is defined with `type: String`, but has `default: false` (a boolean).
- **Impact:** Creates inconsistent data types in MongoDB records and potential logical flaws when performing queries like `{ is_admin: true }`.
- **Recommendation:** Change `is_admin` type definition in Mongoose schema to `Boolean`.

### 2.2 Admin Session Overwriting Bug on User Creation
- **Location:** `backend/routes/adminroute.js` (`/createuser` route)
- **Issue:** Upon successful creation of a user, `/createuser` generates a JWT token for the newly created user and sets it in the client's `jwt` cookie.
- **Impact:** Overwrites the administrator's active session cookie, effectively logging out the admin and authenticating them as the newly created user.
- **Recommendation:** Remove token generation and cookie setting from the admin `/createuser` handler.

### 2.3 Unhandled File Upload Exception
- **Location:** `backend/routes/routes.js` (`/profile-upload-single` route)
- **Issue:** Accesses `req.file.filename` without checking if `req.file` exists.
- **Impact:** Requests submitted without a file payload crash the endpoint handler with a `TypeError`.
- **Recommendation:** Add validation to ensure `req.file` exists before processing the upload.

### 2.4 Poor Error Handling & Silent Catch Blocks
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** Multiple try-catch blocks are empty or log errors without returning HTTP response status codes.
- **Impact:** Clients receive hanging requests or generic errors without meaningful feedback.
- **Recommendation:** Implement consistent error handling that returns appropriate HTTP status codes (e.g., 500 Internal Server Error) and error messages.

---

## 3. Frontend & Architecture Issues

### 3.1 Repository Directory Naming Misspelling
- **Location:** `frondend/`
- **Issue:** Directory name is misspelled as `frondend` instead of `frontend`.
- **Impact:** Causes confusion and breaks non-standard script or CI/CD paths expecting standard naming conventions.

### 3.2 Incorrect Angular HttpClient Argument Ordering
- **Location:** `AdminUserlistComponent`, `AdminUsereditComponent`
- **Issue:** Angular `HttpClient.post` calls pass options objects (e.g. `{ withCredentials: true }`) as the second argument (request body) instead of the third argument (options).
- **Impact:** Requests fail to send required cookies or send invalid request bodies.
- **Recommendation:** Ensure POST calls pass body as second parameter and options object as third parameter.

### 3.3 Non-Functional Admin Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue:** Admin user list search bar consists of static HTML elements without data binding, event listeners, or component filter logic.
- **Impact:** Search feature is non-functional for end users.

---

## 4. Testing & Quality Assurance

### 4.1 Frontend Unit Test Failures
- **Status:** 12 of 14 unit tests fail in `frondend/jwtapp/`.
- **Root Cause:** Spec files miss required Angular TestBed providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Error:** `NullInjectorError: No provider for HttpClient!`, `NullInjectorError: No provider for Router!`, etc.
- **Recommendation:** Import and provide required mock modules and store providers in all component spec files.
