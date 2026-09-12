# Comprehensive Bug Report

## Executive Summary
This document provides a detailed bug report for the project codebase. The codebase consists of a Node.js/Express backend (`backend/`) and an Angular 16 frontend (`frondend/jwtapp/`). During code analysis and inspection, multiple critical security vulnerabilities, data model inconsistencies, backend logic and error handling defects, and frontend bugs were identified.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Severity**: Critical
- **Location**: `backend/routes/routes.js` (lines 35, 59, 72, 108, 128), `backend/routes/adminroute.js` (lines 20, 48, 142)
- **Description**: The JWT signing and verification code uses a hardcoded string `"secret"` instead of reading from environment variables (such as `process.env.jwtsecret` configured in `backend/.env`).
- **Impact**: Anyone with knowledge of the hardcoded secret string can forge valid JWT tokens for arbitrary user accounts, completely bypassing authentication.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Severity**: Critical
- **Location**: `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
- **Description**: Administrative endpoints lack JWT authentication middleware and role verification checks (`is_admin`). Any unauthenticated request sent directly to these endpoints will be processed.
- **Impact**: Unauthenticated users can retrieve user lists, edit details, create accounts, or delete arbitrary user records.

### 1.3 Sensitive Data Leakage (Passwords in API Response)
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (`/users` route, line 63)
- **Description**: The `/users` endpoint fetches user documents using `User.find({})` and returns the complete user array directly to the client without stripping or omitting the hashed `password` field.
- **Impact**: Exposes hashed user passwords to callers of the `/users` endpoint.

### 1.4 Admin Session Overwrite / Hijacking on User Creation
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (`/createuser` route, lines 144-147)
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the endpoint signs a new JWT token for the newly created user ID and sets it in the response cookie (`res.cookie("jwt", token)`).
- **Impact**: The logged-in administrator's cookie is overwritten with the new user's session token, inadvertently logging out the admin and authenticating them as the new user.

### 1.5 Hardcoded Database Connection String
- **Severity**: Medium
- **Location**: `backend/index.js` (line 19)
- **Description**: The MongoDB connection URL `mongodb://127.0.0.1:27017/jwtproject` is hardcoded into `index.js` rather than being configurable via environment variables.

### 1.6 CSRF Exposure & Cookie Security
- **Severity**: Medium
- **Location**: `backend/index.js`, `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: CORS is configured with `credentials: true` for `http://localhost:4200`, and JWT tokens are stored in `httpOnly` cookies without CSRF protection tokens or `SameSite` attribute specifications.

---

## 2. Data Model & Schema Defects

### 2.1 Mongoose Schema Type Mismatch for `is_admin`
- **Severity**: Medium
- **Location**: `backend/models/user.js` (lines 16-19)
- **Description**: The `is_admin` property in the User schema is defined with `type: String` but given a boolean default `default: false`.
- **Impact**: Storing boolean values into a String-typed field can lead to unexpected truthiness evaluation and querying bugs (e.g., `"false"` evaluated as truthy in JavaScript).

---

## 3. Backend Logic & Error Handling Defects

### 3.1 Unhandled `req.file` Null/Undefined Exception in Single Profile Upload
- **Severity**: High
- **Location**: `backend/routes/routes.js` (`/profile-upload-single` route, line 114)
- **Description**: Accesses `req.file.filename` without verifying if `req.file` exists (which happens if a request is sent without an image file payload).
- **Impact**: Throws a `TypeError: Cannot read property 'filename' of undefined`, triggering the catch block.

### 3.2 Silent Catch Blocks & Unhandled HTTP Requests (Hanging Requests)
- **Severity**: High
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Several routes (`/profile-upload-single`, `/profile`, `/logout`, `/deleteUser/:id`, `/editUser`, `/createuser`) feature empty or logging-only catch blocks (`catch (error) {}`) without returning an HTTP status code or error payload to the client (`res.status(500)...`).
- **Impact**: If an exception occurs, the server never sends a response, causing client HTTP connections to hang until timeout.

---

## 4. Frontend Architecture & Implementation Defects

### 4.1 Misspelled Directory Name
- **Severity**: Low
- **Location**: Root directory (`frondend/` instead of `frontend/`)
- **Description**: The frontend repository folder is misspelled as `frondend`.

### 4.2 Incorrect `HttpClient.post` Options Argument Signature
- **Severity**: High
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (line 42)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (line 74)
- **Description**: Angular's `HttpClient.post` signature is `post(url, body, options)`. The component code passes `{ withCredentials: true }` as the 2nd argument (`body`) instead of passing `null` or `{}` as `body` and options as 3rd parameter (e.g., `this.http.post(url, {}, { withCredentials: true })`).
- **Impact**: Requests send `{ withCredentials: true }` as JSON payload in the request body while failing to send HTTP credentials/cookies with the request.

### 4.3 Non-Functional UI Search Input
- **Severity**: Low
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Description**: The search input element `<input type="text" placeholder="Search" class="input">` is static HTML without `[(ngModel)]`, event bindings, or filtering logic implemented in the component or NgRx selectors.

### 4.4 Frontend Unit Test Suite Failures
- **Severity**: Medium
- **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Description**: Multiple Angular component spec files fail during `ng test` execution due to missing test module providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
