# Comprehensive Bug and Security Audit Report

## Executive Summary
An in-depth security and quality audit of the full-stack web application (Express backend and Angular frontend) revealed multiple **critical security vulnerabilities**, **backend logic errors**, **frontend defects**, and **testing suite failures**.

Key risks include unauthenticated administrative API endpoints, exposure of sensitive password hashes, hardcoded cryptographic secrets, session hijacking/overwriting bugs during user creation, incorrect Angular HTTP request parameter positioning, and broken frontend unit tests.

---

## Table of Contents
1. [Critical & Security Vulnerabilities](#1-critical--security-vulnerabilities)
2. [Backend Logic & Error Handling Defects](#2-backend-logic--error-handling-defects)
3. [Database Schema Inconsistencies](#3-database-schema-inconsistencies)
4. [Frontend Component & Integration Defects](#4-frontend-component--integration-defects)
5. [Testing & Build Deficiencies](#5-testing--build-deficiencies)
6. [Remediation Roadmap](#6-remediation-roadmap)

---

## 1. Critical & Security Vulnerabilities

### 1.1 Unprotected Administrative API Endpoints
- **Severity**: Critical
- **Location**: `backend/routes/adminroute.js`
- **Description**: Several administrative endpoints lack authentication checks (`jwt.verify`) and administrator role checks (`is_admin`). Any unauthenticated request sent directly to these endpoints can view or manipulate system data.
- **Affected Endpoints**:
  - `GET /api/admin/users`: Fetches all user accounts without authentication.
  - `POST /api/admin/deleteUser/:id`: Deletes user records without checking for admin status or valid JWT.
  - `POST /api/admin/editDetails/:id`: Returns user details without authentication.
  - `POST /api/admin/editUser`: Updates user names without authentication.
  - `POST /api/admin/createuser`: Creates new users without admin authentication checks.

### 1.2 Exposure of Sensitive User Credentials (Password Hashes)
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` -> `GET /api/admin/users`
- **Description**: The endpoint queries `User.find({})` and directly returns the full user document objects (`res.send(user)`). This leaks bcrypt password hashes to any caller.
- **Impact**: Attacker can obtain user password hashes and perform offline brute-force or dictionary attacks.

### 1.3 Hardcoded Cryptographic Secrets & Configuration
- **Severity**: High
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: JWT signing and verification calls hardcode the secret string `"secret"` (e.g., `jwt.sign(..., "secret")`, `jwt.verify(cookie, "secret")`) instead of loading secret keys from environment variables (`process.env.jwtsecret`). Furthermore, `backend/index.js` hardcodes the MongoDB connection URI (`mongodb://127.0.0.1:27017/jwtproject`).

### 1.4 Admin Session Overwriting / Hijacking on User Creation
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` -> `POST /api/admin/createuser`
- **Description**: When an administrator creates a new user via the admin dashboard, the endpoint creates a JWT token for the *new user* and sets it as the `jwt` HTTP-only cookie on the response (`res.cookie("jwt", token)`).
- **Impact**: The administrator's active session cookie is immediately overwritten with the new user's token, logging out the administrator and changing their active identity to the newly created user.

### 1.5 Missing CSRF Mitigations
- **Severity**: Medium
- **Location**: `backend/index.js`, `backend/routes/routes.js`
- **Description**: Cross-Origin Resource Sharing (CORS) is configured with `credentials: true` for `http://localhost:4200`. However, the server relies solely on cookies for authentication without anti-CSRF tokens or SameSite strict attribute configuration, exposing state-changing endpoints (`/api/register`, `/api/profile-upload-single`, `/api/admin/*`) to Cross-Site Request Forgery.

---

## 2. Backend Logic & Error Handling Defects

### 2.1 Hung Requests Due to Empty Catch Blocks and Missing Responses
- **Severity**: Medium
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Multiple asynchronous route handlers feature empty or incomplete `catch` blocks that do not send an HTTP error response back to the client:
  - `POST /profile-upload-single`: Empty `catch` block (`catch (error) {}`). If an exception is thrown, no response is sent and the client request hangs until timeout.
  - `GET /profile`: Logs error message to console but fails to send HTTP response on error (`catch (error) { console.log(...) }`).
  - `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, `POST /api/admin/editUser`, `POST /api/admin/createuser`: Incomplete error handling that leaves client requests unresolved upon failure.

### 2.2 Unhandled Null Pointer Exception on Profile Upload
- **Severity**: Medium
- **Location**: `backend/routes/routes.js` -> `POST /profile-upload-single`
- **Description**: The endpoint accesses `req.file.filename` directly. If a client sends a request without attaching a file payload in the `image` field, `req.file` is `undefined`, causing a `TypeError` when reading `req.file.filename`. Because of the empty `catch` block, the exception is swallowed and the request hangs indefinitely.

---

## 3. Database Schema Inconsistencies

### 3.1 Field Type Mismatch for `is_admin`
- **Severity**: Low
- **Location**: `backend/models/user.js`
- **Description**: The `userSchema` defines `is_admin` with `type: String` and `default: false` (a boolean literal).
```js
is_admin: {
    type: String,
    default: false
}
```
Queries in `adminroute.js` search using boolean filters (`{ email: req.body.email, is_admin: true }`). Storing boolean defaults in a String schema creates inconsistent type handling and indexing behavior in MongoDB.

---

## 4. Frontend Component & Integration Defects

### 4.1 Incorrect Angular HttpClient Argument Positioning
- **Severity**: High
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: The Angular `HttpClient.post` method signature is `post(url, body, options)`. In both components, options `{ withCredentials: true }` are mistakenly passed as the **second** argument (`body`) rather than the **third** argument (`options`):
```typescript
// Incorrect: passing options object as HTTP request body
this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
  withCredentials: true
})
```
- **Impact**: `withCredentials: true` is not applied to the request configuration, causing credentials/cookies to be omitted. Additionally, an unintended request body `{ withCredentials: true }` is transmitted.

### 4.2 Non-Functional Search Input
- **Severity**: Low
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The user list search element `<input type="text" placeholder="Search" class="input">` is plain static HTML. It lacks Angular data binding (`[(ngModel)]` or `formControl`), event handlers, or integration with NgRx selectors/actions for filtering the user table.

### 4.3 Directory Naming Misspelling
- **Severity**: Low
- **Location**: Repository root
- **Description**: The Angular application directory is misspelled as `frondend` instead of `frontend`.

---

## 5. Testing & Build Deficiencies

### 5.1 Failing Frontend Unit Test Suite
- **Severity**: Medium
- **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description**: Angular unit tests fail due to unconfigured dependencies in component `TestBed` setups. Component spec files lack providers for `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()`, resulting in `NullInjectorError` failures (e.g., `No provider for HttpClient!`, `No provider for Router!`).

### 5.2 Missing Backend Test Suite
- **Severity**: Low
- **Location**: `backend/package.json`
- **Description**: The backend lacks automated integration or unit testing configurations (no test framework such as Jest, Mocha, or Supertest, and no `test` script defined in `package.json`).

---

## 6. Remediation Roadmap

1. **Secure Admin Routes**: Implement an authentication and authorization middleware (e.g., `verifyAdmin`) across all `/api/admin/*` endpoints to enforce JWT authentication and check for `is_admin: true`.
2. **Exclude Sensitive Data**: Update `adminrouter.get('/users')` to exclude password hashes (`User.find({}, '-password')` or map response objects to exclude `password`).
3. **Externalize Configuration**: Move secret keys and MongoDB connection parameters to environment variables (`.env`).
4. **Fix User Creation Session Bug**: Modify `POST /api/admin/createuser` so it does not overwrite the admin's `jwt` cookie upon user creation.
5. **Fix Error Handling & File Upload**: Add explicit error responses (`res.status(...).json(...)`) to all route `catch` blocks and validate `req.file` existence before reading file properties.
6. **Correct Angular HTTP Calls**: Update `HttpClient.post` calls in Angular components to correctly pass `{ withCredentials: true }` as the 3rd argument (options).
7. **Correct Database Schema**: Change `is_admin` type in `backend/models/user.js` to `type: Boolean, default: false`.
8. **Fix Frontend Test Configuration**: Update Angular component spec files to import necessary test modules (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
