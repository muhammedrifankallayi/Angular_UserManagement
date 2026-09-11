# Comprehensive Bug Report

This document outlines the security vulnerabilities, logical bugs, data modeling defects, frontend issues, unit test failures, and repository/structural anomalies identified across the backend and frontend applications.

---

## 1. Security Vulnerabilities & Authentication Issues

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` (lines 38, 59, 70, 107, 126) & `backend/routes/adminroute.js` (lines 20, 41)
- **Description:** JWT tokens are signed and verified using the string literal `"secret"` rather than utilizing `process.env.jwtsecret` defined in `backend/.env`.
- **Impact:** Hardcoded secrets in source code allow attackers to forge valid JWT tokens and gain unauthorized access.
- **Remediation:** Replace `"secret"` with `process.env.jwtsecret` across all JWT operations.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Location:** `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
- **Description:** Admin endpoints lack authentication and role verification middleware. Only `/active` checks the JWT cookie.
- **Impact:** Unauthenticated users can view all registered users, delete accounts, modify user profiles, or create arbitrary accounts without logging in as an administrator.
- **Remediation:** Implement administrative middleware to verify the JWT cookie and ensure `is_admin` is `true` for all protected `/api/admin/*` routes.

### 1.3 Sensitive Data Exposure in User Listing Endpoint
- **Location:** `backend/routes/adminroute.js` (`/users` route)
- **Description:** The `User.find({})` query returns complete user documents, including hashed `password` fields, directly in the HTTP response.
- **Impact:** Exposes user password hashes to anyone querying the `/users` API endpoint.
- **Remediation:** Exclude the `password` field from response payloads (e.g., using `select('-password')` or mapping objects to strip sensitive properties).

### 1.4 Admin Session Overwritten on User Creation
- **Location:** `backend/routes/adminroute.js` (`/createuser` route)
- **Description:** When an admin creates a user via `/api/admin/createuser`, the route generates a new JWT token for the newly created user and sets `res.cookie("jwt", token, ...)`.
- **Impact:** Overwrites the logged-in administrator's active JWT cookie with the newly created user's token, effectively hijacking or terminating the admin session.
- **Remediation:** Remove the token generation and `res.cookie` setting logic from the user creation endpoint.

### 1.5 Missing CSRF & SameSite Protections
- **Location:** `backend/index.js`
- **Description:** `cors` allows credentials for `http://localhost:4200`, and JWT cookies are stored with `httpOnly: true` but without CSRF tokens or `sameSite` configuration.
- **Impact:** Makes the application vulnerable to Cross-Site Request Forgery (CSRF) attacks.
- **Remediation:** Implement CSRF token verification middleware or configure appropriate `sameSite` cookie attributes (e.g., `sameSite: 'strict'` or `'lax'`).

### 1.6 Insecure File Upload Handling
- **Location:** `backend/routes/routes.js` (`/profile-upload-single` route)
- **Description:** The route accesses `req.file.filename` directly without verifying whether `req.file` exists. Additionally, file extensions/types and upload sizes are unvalidated.
- **Impact:** Submitting a request without an attached file causes an unhandled Null Pointer TypeError and crashes/errors the route. Unvalidated uploads allow potential malicious file uploads.
- **Remediation:** Add checks for `req.file` existence and implement file type filtering / size constraints in Multer configuration.

---

## 2. Database Schema & Configuration Defects

### 2.1 Inconsistent `is_admin` Field Data Type
- **Location:** `backend/models/user.js`
- **Description:** `is_admin` is defined as `type: String` with `default: false` (a boolean default for a string field). However, queries in `backend/routes/adminroute.js` perform boolean queries (`User.findOne({ email: req.body.email, is_admin: true })`).
- **Impact:** Type mismatches cause queries filtering by `is_admin: true` to fail or behave unexpectedly.
- **Remediation:** Change `is_admin` schema type to `Boolean` with `default: false`.

### 2.2 Hardcoded MongoDB Connection String
- **Location:** `backend/index.js`
- **Description:** Database connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact:** Prevents dynamic database configuration across different environments (e.g., production, staging, testing).
- **Remediation:** Move the database connection string into `backend/.env` (e.g., `MONGODB_URI`).

---

## 3. Error Handling & Backend Logic Bugs

### 3.1 Empty Catch Blocks & Swallowed Exceptions
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Multiple routes (e.g., `/profile-upload-single`, `/logout`, `/deleteUser/:id`) contain empty `catch (error) {}` blocks or log errors without returning an HTTP response to the client.
- **Impact:** Requests hang until client timeout when exceptions occur, providing no feedback or error status code to client applications.
- **Remediation:** Add proper error logging and return explicit HTTP error status codes (e.g., `500 Internal Server Error`) in catch blocks.

---

## 4. Frontend Application Bugs

### 4.1 Incorrect `HttpClient.post` Options Argument Signatures
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser` method)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers` method)
- **Description:** Calls to `this.http.post(...)` pass `{ withCredentials: true }` as the second argument (the request body) rather than the third argument (options). For example:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
  ```
- **Impact:** Credentials (cookies) are not sent with these requests, and `{ withCredentials: true }` is serialized as the request payload body.
- **Remediation:** Pass `{}` as the second argument (body) and `{ withCredentials: true }` as the third argument (options):
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, { withCredentials: true })
  ```

### 4.2 Non-Functional Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input in the admin user list template is static HTML lacking `[(ngModel)]` binding or integration with NgRx store selectors/actions.
- **Impact:** Users cannot search or filter user records in the admin dashboard interface.
- **Remediation:** Implement two-way binding or form control logic and connect it to state selectors for filtering.

---

## 5. Unit Testing Failures

### 5.1 Missing Spec Providers in Angular Component Unit Tests
- **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description:** 12 out of 14 Angular component unit tests fail with `NullInjectorError: No provider for HttpClient!` and `NullInjectorError: No provider for Router!`.
- **Impact:** Automated test suite fails to execute or pass.
- **Remediation:** Import `HttpClientTestingModule`, `RouterTestingModule`, and provide mock NgRx stores (`provideMockStore()`) in component test `TestBed` configurations.

---

## 6. Repository & Structural Issues

### 6.1 Misspelled Frontend Directory
- **Location:** Root repository directory (`frondend/` instead of `frontend/`)
- **Description:** The frontend project folder is named `frondend`.
- **Impact:** Non-standard folder naming causing potential confusion or broken script assumptions.

### 6.2 Missing NPM Start Script in Backend
- **Location:** `backend/package.json`
- **Description:** No `"start"` script is defined in `scripts`.
- **Impact:** Standard commands like `npm start` fail in the backend directory.
- **Remediation:** Add `"start": "node index.js"` to `backend/package.json`.
