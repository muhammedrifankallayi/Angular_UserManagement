# Comprehensive Bug Report

## Executive Summary
This document outlines the bugs, security vulnerabilities, logical flaws, architectural defects, and test failures identified in the application codebase. The repository consists of a Node.js/Express backend (`backend/`) and an Angular 16 frontend (`frondend/jwtapp/`).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** JWT signing and verification calls use a hardcoded string literal `"secret"` (e.g., `jwt.sign({_id: ...}, "secret")` and `jwt.verify(cookie, "secret")`) instead of loading from the environment variable `process.env.jwtsecret`.
- **Impact:** Any attacker with knowledge of the codebase can forge valid JWT tokens and bypass authentication entirely.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Sensitive administrative endpoints (such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, `POST /api/admin/editUser`, and `POST /api/admin/createuser`) do not check for authentication tokens or verify administrative privileges before executing operations.
- **Impact:** Unauthenticated users or non-admin clients can view, edit, or delete any user account in the system.

### 1.3 Exposure of Password Hashes in API Responses
- **Location:** `backend/routes/adminroute.js` (`GET /users`)
- **Issue:** The `GET /api/admin/users` route retrieves all user documents with `User.find({})` and directly returns them without stripping out the `password` field.
- **Impact:** User password hashes (bcrypt hashes) are leaked in plain JSON to client requests.

### 1.4 Admin Session Cookie Overwritten During User Creation
- **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
- **Issue:** When an administrator creates a new user via `POST /api/admin/createuser`, the route generates a new JWT token for the created user and sets it as the `jwt` cookie in the HTTP response (`res.cookie("jwt", token, ...)`).
- **Impact:** Creating a user causes the admin's active session cookie to be overwritten with the new user's identity, logging the admin out or hijacking their session.

### 1.5 Missing CSRF Protection & Hardcoded CORS Configuration
- **Location:** `backend/index.js`
- **Issue:** The backend enables `cors` with `credentials: true` for `http://localhost:4200`, but lacks anti-CSRF token verification for state-modifying requests (POST/DELETE).
- **Impact:** Cross-Site Request Forgery risks when users visit malicious sites while authenticated.

---

## 2. Backend Logic Errors & Schema Inconsistencies

### 2.1 Mongoose User Schema Type Mismatch for `is_admin`
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field in the user schema is defined as `type: String` with `default: false` (a boolean default). In `adminroute.js`, queries check `is_admin: true` (a boolean check).
- **Impact:** Type inconsistency in MongoDB queries can lead to unexpected behavior or failure to match records.

### 2.2 Missing File Existence Check in Profile Upload Route
- **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Issue:** The route accesses `req.file.filename` assuming a file was uploaded, without validating if `req.file` exists.
- **Impact:** If a request is submitted without a file payload, the server throws an unhandled `TypeError: Cannot read property 'filename' of undefined`.

### 2.3 Silent Exception Suppression and Empty Catch Blocks
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** Several route handlers (e.g., `/profile-upload-single`, `/logout`, `/deleteUser/:id`) contain empty `catch (error) {}` blocks or fail to send an HTTP response in the error branch.
- **Impact:** Errors fail silently, causing HTTP requests to hang indefinitely until client timeout.

---

## 3. Frontend Bugs & Architectural Defects

### 3.1 Misuse of `HttpClient.post` Options Argument
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Issue:** Angular's `HttpClient.post(url, body, options)` expects the request body as the 2nd argument and request options as the 3rd argument. In these components, `{ withCredentials: true }` is passed as the 2nd argument (the request body).
- **Impact:** The request options (like sending HTTP cookies) are ignored, and `{ withCredentials: true }` is sent as payload to the backend server.

### 3.2 Non-Functional Search Filter Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input element `<input type="text" placeholder="Search" class="input">` is static HTML and is not bound via `ngModel` or reactive forms to any component logic or NgRx selectors.
- **Impact:** Users cannot filter or search the user list in the UI.

### 3.3 Misspelled Directory Name
- **Location:** Root repository directory (`frondend/`)
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Inconsistent project layout and potential build/script path misconfigurations.

---

## 4. Frontend Unit Test Failures

### 4.1 Missing Angular Test Bed Providers
- **Location:** Component spec files in `frondend/jwtapp/src/app/components/`
- **Issue:** 12 out of 14 Angular component unit tests fail with `NullInjectorError: No provider for HttpClient!` or `No provider for Router!` or missing NgRx Store dependencies.
- **Root Cause:** Spec files do not import `HttpClientTestingModule`, `RouterTestingModule`, or `provideMockStore()`.
