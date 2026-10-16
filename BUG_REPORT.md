# Comprehensive Bug Report

## Overview
This document details the security vulnerabilities, software logic bugs, schema/type inconsistencies, frontend defects, and unit test suite failures identified across the backend and frontend codebase.

---

## 1. Backend Security & Authentication Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Routes
- **Severity**: Critical
- **Affected File**: `backend/routes/adminroute.js`
- **Description**: Administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not verify the user's JWT cookie or check if the requesting user possesses administrative privileges. Any unauthenticated client or standard user can invoke these actions directly.
- **Recommendation**: Implement authentication and authorization middleware to verify the JWT cookie and validate `user.is_admin === true` prior to executing admin route handlers.

### 1.2 Hardcoded Secrets in JWT Signing and Verification
- **Severity**: High
- **Affected Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: JWT signing and verification calls use a hardcoded secret string `"secret"` rather than reading from environment configuration (`process.env.jwtsecret`).
- **Recommendation**: Replace string literals with `process.env.jwtsecret` across all JWT signing and verification methods.

### 1.3 Sensitive Data Exposure in User List API
- **Severity**: High
- **Affected File**: `backend/routes/adminroute.js`
- **Description**: The `/api/admin/users` endpoint returns raw user documents from MongoDB, which includes hashed passwords (`password` field) in the HTTP response body.
- **Recommendation**: Exclude the `password` field from Mongoose queries or sanitize user objects before returning responses (`const { password, ...data } = user.toJSON()`).

### 1.4 Hardcoded Database Connection String
- **Severity**: Medium
- **Affected File**: `backend/index.js`
- **Description**: The MongoDB connection string (`mongodb://127.0.0.1:27017/jwtproject`) is hardcoded in application bootstrap code rather than being configurable via environment variables.
- **Recommendation**: Move database connection strings and parameters into `.env` files.

---

## 2. Backend Logic & Schema Issues

### 2.1 Admin Session Overwritten on User Creation
- **Severity**: High
- **Affected File**: `backend/routes/adminroute.js`
- **Description**: When an admin creates a new user via `/api/admin/createuser`, the handler issues a new JWT cookie for the newly created user, overwriting the logged-in administrator's session cookie.
- **Recommendation**: Remove `res.cookie("jwt", token, ...)` from the `/createuser` handler.

### 2.2 Uncaught Exception and Swallowed Errors in Profile Upload
- **Severity**: Medium
- **Affected File**: `backend/routes/routes.js`
- **Description**: The `/profile-upload-single` endpoint accesses `req.file.filename` directly without checking if `req.file` exists. Requests submitted without a file cause unhandled exceptions. Additionally, the `catch` block is empty, which causes HTTP requests to hang without returning a response.
- **Recommendation**: Validate `req.file` before accessing its attributes, and ensure error handlers return appropriate HTTP status codes (e.g., status 400/500).

### 2.3 `is_admin` Field Type Inconsistency
- **Severity**: Medium
- **Affected File**: `backend/models/user.js`
- **Description**: In the Mongoose schema, `is_admin` is typed as `String`, but has a boolean default `false`.
- **Recommendation**: Change the `is_admin` schema field type from `String` to `Boolean`.

### 2.4 Silent Catch Blocks / Swallowed Exceptions
- **Severity**: Medium
- **Affected Files**: `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description**: Multiple try/catch blocks log errors to console or swallow exceptions entirely without returning an HTTP response to the client.
- **Recommendation**: Send structured HTTP error responses (e.g., status 500 with error message) for all caught exceptions.

---

## 3. Frontend Defects & UI Issues

### 3.1 Incorrect `HttpClient.post` Parameter Signature
- **Severity**: High
- **Affected Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description**: `HttpClient.post` invocations pass `{ withCredentials: true }` as the second argument (body) instead of the third argument (`http.post(url, body, options)`). As a result, `{ withCredentials: true }` is transmitted as payload body while `withCredentials` header options are omitted.
- **Recommendation**: Pass body payload (or empty object `{}`) as second argument and options as third argument (`http.post(url, body, { withCredentials: true })`).

### 3.2 Non-Functional Search Input
- **Severity**: Low
- **Affected File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input field in `AdminUserlistComponent` is static HTML lacking `[(ngModel)]` binding, event listeners, or integration with state selectors for user filtering.
- **Recommendation**: Connect search input to component logic or NgRx selectors to implement live user search filtering.

### 3.3 Misspelled Frontend Directory Name
- **Severity**: Low
- **Affected Directory**: `frondend/`
- **Description**: Root frontend directory is named `frondend` instead of `frontend`.
- **Recommendation**: Rename directory or maintain consistent references in workspace configuration.

---

## 4. Test Suite Deficiencies

### 4.1 Missing Unit Test Bed Providers & Mocks
- **Severity**: Medium
- **Affected Files**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Description**: 12 out of 14 Angular unit tests fail with `NullInjectorError` errors for missing `HttpClient`, `Router`, and NgRx `Store` dependencies.
- **Recommendation**: Include `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore` in `TestBed.configureTestingModule` configurations across component test suites.
