# Comprehensive Bug Report

This document details identified bugs, vulnerabilities, logic errors, and structural issues discovered across the backend (Node.js/Express) and frontend (Angular) applications.

---

## Table of Contents
1. [Backend Security Vulnerabilities](#1-backend-security-vulnerabilities)
   - [1.1 Hardcoded JWT Secret](#11-hardcoded-jwt-secret)
   - [1.2 Missing Authentication & Authorization Middleware on Admin Endpoints](#12-missing-authentication--authorization-middleware-on-admin-endpoints)
   - [1.3 Password Hash Exposure in Admin User List](#13-password-hash-exposure-in-admin-user-list)
2. [Backend Logic and Runtime Flaws](#2-backend-logic-and-runtime-flaws)
   - [2.1 Administrator Session Hijacked/Overwritten on User Creation](#21-administrator-session-hijackedoverwritten-on-user-creation)
   - [2.2 Unhandled Exception in File Upload Endpoint (Missing `req.file` Check)](#22-unhandled-exception-in-file-upload-endpoint-missing-reqfile-check)
   - [2.3 User Schema Data Type Inconsistency (`is_admin`)](#23-user-schema-data-type-inconsistency-is_admin)
   - [2.4 Empty Catch Blocks and Hanging HTTP Requests](#24-empty-catch-blocks-and-hanging-http-requests)
3. [Frontend Logic and Implementation Issues](#3-frontend-logic-and-implementation-issues)
   - [3.1 Incorrect `HttpClient.post()` Argument Ordering](#31-incorrect-httpclientpost-argument-ordering)
   - [3.2 Non-Functional User Search Input](#32-non-functional-user-search-input)
   - [3.3 Misspelled Directory Name (`frondend`)](#33-misspelled-directory-name-frondend)
4. [Testing and Development Infrastructure Issues](#4-testing-and-development-infrastructure-issues)
   - [4.1 Broken Angular Unit Tests (Missing Testing Providers)](#41-broken-angular-unit-tests-missing-testing-providers)
   - [4.2 Missing Backend Test Suite and Scripts](#42-missing-backend-test-suite-and-scripts)

---

## 1. Backend Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Severity**: Critical
- **Location**: `backend/routes/routes.js` (lines 35, 59, 74, 98, 120), `backend/routes/adminroute.js` (lines 23, 40, 142)
- **Description**: The JWT signing and verification calls hardcode the string `"secret"` rather than retrieving the environment variable `process.env.jwtsecret` (which is configured in `backend/.env`).
- **Impact**: Any attacker who reads the source code or guesses the default secret can forge arbitrary authentication tokens with admin or user IDs and gain unauthorized access to any account.
- **Remediation**: Use `process.env.jwtsecret` consistently across all `jwt.sign` and `jwt.verify` calls, and ensure fallback/validation is implemented if the environment variable is not defined.

---

### 1.2 Missing Authentication & Authorization Middleware on Admin Endpoints
- **Severity**: Critical
- **Location**: `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
- **Description**: While `GET /api/admin/active` checks for a JWT cookie, administrative management endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`) perform no authentication check or administrator verification.
- **Impact**: Unauthenticated remote attackers can query all user records, delete any user, modify any user's profile, and create accounts without logging in or possessing admin privileges.
- **Remediation**: Implement a centralized authentication and authorization middleware (e.g., `verifyAdmin`) that extracts the JWT cookie, verifies the claims, confirms the user exists and has `is_admin === true`, and attach this middleware to all `/api/admin/*` routes.

---

### 1.3 Password Hash Exposure in Admin User List
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (lines 58-67 in `GET /api/admin/users`)
- **Description**: `GET /api/admin/users` queries all users via `User.find({})` and returns the resulting documents directly via `res.send(user)` without projecting out or stripping the `password` field (note the commented-out projection line: `// const {password, ...data} = await user.toJSON();`).
- **Impact**: Password hashes (bcrypt strings) for all registered users and administrators are exposed to any client requesting this endpoint, enabling offline brute-force cracking.
- **Remediation**: Exclude sensitive fields from the query projection, e.g., `User.find({}, { password: 0 })` or `User.find({}).select('-password')`.

---

## 2. Backend Logic and Runtime Flaws

### 2.1 Administrator Session Hijacked/Overwritten on User Creation
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (lines 142-149 in `POST /api/admin/createuser`)
- **Description**: When an admin creates a new user via `POST /api/admin/createuser`, the route signs a token for the newly created user's ID (`jwt.sign({ _id: _id }, "secret")`) and sets it as the response cookie (`res.cookie("jwt", token, ...)`).
- **Impact**: The administrator's session cookie is overwritten in their browser with the credentials of the newly created account. As a result, the admin is involuntarily switched to the newly created user and loses administrator access on subsequent requests.
- **Remediation**: Do not set or overwrite the `jwt` cookie in `POST /api/admin/createuser`. Simply return a success response with user details (excluding password).

---

### 2.2 Unhandled Exception in File Upload Endpoint (Missing `req.file` Check)
- **Severity**: Medium
- **Location**: `backend/routes/routes.js` (lines 95-115 in `POST /profile-upload-single`)
- **Description**: The endpoint accesses `req.file.filename` directly (`$set: { image: req.file.filename }`) without verifying whether `req.file` is defined.
- **Impact**: If a client sends a request without a file or an invalid form field name, `req.file` is `undefined`, causing a runtime `TypeError: Cannot read properties of undefined (reading 'filename')`.
- **Remediation**: Add a validation check:
  ```javascript
  if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
  }
  ```

---

### 2.3 User Schema Data Type Inconsistency (`is_admin`)
- **Severity**: Medium
- **Location**: `backend/models/user.js` (lines 16-19)
- **Description**: The `is_admin` schema property is typed as `String`, but given a default boolean value:
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
  Meanwhile, route queries query it with boolean literals, e.g. `User.findOne({ email: req.body.email, is_admin: true })` in `backend/routes/adminroute.js`.
- **Impact**: Type casting inconsistencies can cause queries to fail or return unexpected results depending on how the document was saved.
- **Remediation**: Define `is_admin` as `{ type: Boolean, default: false }`.

---

### 2.4 Empty Catch Blocks and Hanging HTTP Requests
- **Severity**: Medium
- **Location**: `backend/routes/adminroute.js` (e.g. `/logout`, `/deleteUser/:id`, `/editUser`, `/createuser`), `backend/routes/routes.js` (e.g. `/profile-upload-single`, `/profile`)
- **Description**: Multiple route handlers contain empty `catch (error) {}` blocks or blocks that log to console without sending any HTTP error response to the client (`res.status(500)...`).
- **Impact**: When unhandled errors or database exceptions occur, the client connection is left hanging until socket timeout, causing degraded UX and resource exhaustion.
- **Remediation**: Ensure every catch block sends an appropriate HTTP error status and response payload (e.g., `res.status(500).json({ message: 'Internal server error' })`).

---

## 3. Frontend Logic and Implementation Issues

### 3.1 Incorrect `HttpClient.post()` Argument Ordering
- **Severity**: High
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser` method)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers` method)
- **Description**: In Angular's `HttpClient.post(url, body, options)`, options such as `{ withCredentials: true }` must be the third argument. In both locations, options are passed as the second argument:
  ```typescript
  // Incorrect (admin-userlist.component.ts):
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })

  // Incorrect (admin-useredit.component.ts):
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  })
  ```
- **Impact**: The `{ withCredentials: true }` object is sent as the request body rather than configuring HTTP request options. Authentication cookies are therefore not sent, causing requests to fail or receive 401 unauthenticated errors.
- **Remediation**: Supply an empty body `{}` as the second argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true });
  ```

---

### 3.2 Non-Functional User Search Input
- **Severity**: Low / Usability
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Description**: The template includes a search input (`<input type="text" placeholder="Search" class="input">`), but it lacks data binding (`[(ngModel)]` or `formControl`), event handlers (`(input)`), and filtering logic in `AdminUserlistComponent` or state selectors.
- **Impact**: Users attempting to filter or search for specific users experience an entirely non-responsive UI element.
- **Remediation**: Bind the input to a component property/subject and filter `userdata$` either locally or via an NgRx selector.

---

### 3.3 Misspelled Directory Name (`frondend`)
- **Severity**: Low / Code Quality
- **Location**: Root directory: `frondend/`
- **Description**: The frontend project folder is named `frondend` instead of `frontend`.
- **Impact**: Confuses developers, breaks conventional tooling/CI scripts expecting `frontend/`, and increases onboarding friction.
- **Remediation**: Rename directory to `frontend/` and update any repository references accordingly.

---

## 4. Testing and Development Infrastructure Issues

### 4.1 Broken Angular Unit Tests (Missing Testing Providers)
- **Severity**: Medium
- **Location**: `frondend/jwtapp/src/app/**/*.spec.ts`
- **Description**: Almost all frontend component unit tests fail with `NullInjectorError: No provider for HttpClient!`, `NullInjectorError: No provider for Router!`, or missing NgRx store providers because the test bed configurations do not import `HttpClientTestingModule`, `RouterTestingModule`, or provide mock stores (`provideMockStore`).
- **Impact**: Frontend unit tests cannot run or pass, breaking CI/CD pipelines and preventing automated regression detection.
- **Remediation**: Update test specs to configure `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore(...)` in `TestBed.configureTestingModule`.

---

### 4.2 Missing Backend Test Suite and Scripts
- **Severity**: Low / Code Quality
- **Location**: `backend/package.json`
- **Description**: The backend `package.json` does not contain a test suite, testing frameworks (such as Jest, Mocha, or Supertest), or npm test scripts.
- **Impact**: Backend endpoints cannot be verified automatically for regressions or security vulnerabilities.
- **Remediation**: Add a testing framework like Jest with Supertest and implement integration tests for authentication and administrative endpoints.
