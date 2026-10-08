# System Bug Report & Vulnerability Audit

## Executive Summary

This report documents the security vulnerabilities, business logic errors, API defects, frontend bugs, and test failures discovered during a comprehensive audit of the application.

The repository consists of:
* **Backend**: Node.js / Express server (`backend/`) connecting to MongoDB at `mongodb://127.0.0.1:27017/jwtproject`.
* **Frontend**: Angular 16 client (`frondend/jwtapp/`) using NgRx for state management.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description**: JWT tokens are signed and verified using a hardcoded string `"secret"` (e.g., `jwt.sign({_id: ...}, "secret")` and `jwt.verify(cookie, "secret")`) rather than reading from environment variables (`process.env.jwtsecret`).
* **Impact**: Exposing or hardcoding JWT secrets allows attackers to forge valid JWT tokens and hijack user sessions.
* **Remediation**: Use `process.env.jwtsecret` across all routes and enforce strong secret generation in production.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location**: `backend/routes/adminroute.js`
* **Description**: Administrative endpoints—including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`—do not execute JWT verification or administrator role validation middleware before handling requests.
* **Impact**: Unauthenticated users or non-admin clients can manipulate user accounts, delete records, edit user details, and list all system users simply by sending HTTP requests to these endpoints.
* **Remediation**: Create and apply an authentication middleware that verifies the JWT cookie and confirms `user.is_admin === true` for all administrative routes.

### 1.3 Exposure of Sensitive Data (User Passwords)
* **Location**: `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Description**: The `/users` route executes `User.find({})` and returns the resulting database objects directly to the caller without stripping out password hashes.
* **Impact**: Password hashes are leaked over the network, exposing user credentials to risk.
* **Remediation**: Sanitize database output by excluding the `password` field (e.g., using `User.find({}).select('-password')`).

### 1.4 Hardcoded MongoDB Connection String
* **Location**: `backend/index.js`
* **Description**: The database connection string `'mongodb://127.0.0.1:27017/jwtproject'` is hardcoded in `backend/index.js`.
* **Impact**: Hardcoded credentials/URIs reduce flexibility and risk exposing internal database configurations in source control.
* **Remediation**: Move the database connection string to `process.env.MONGO_URI` or `.env`.

### 1.5 Missing CSRF Protection with Credentials Allowed
* **Location**: `backend/index.js`
* **Description**: The server configures CORS with `credentials: true` for `http://localhost:4200` and relies on HTTP-only cookies (`jwt`), but lacks Anti-CSRF token mechanisms.
* **Impact**: Potential vulnerability to Cross-Site Request Forgery attacks if state-changing requests are triggered via third-party sites.
* **Remediation**: Implement CSRF protection middleware or enforce strict `SameSite` cookie policies.

---

## 2. Backend Business Logic & Error Handling Bugs

### 2.1 Admin Session Overwrite on User Creation
* **Location**: `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Description**: When an administrator creates a new user account via `/api/admin/createuser`, the server signs a new JWT token for the newly created user and attaches it as a cookie (`res.cookie("jwt", token, ...)`).
* **Impact**: Creating a new user immediately overwrites the administrator's JWT cookie, logging out the administrator and switching their session to the newly created user.
* **Remediation**: Remove cookie setting logic from the admin `/createuser` endpoint; return a status message without modifying response cookies.

### 2.2 Inconsistent `is_admin` Schema Definition
* **Location**: `backend/models/user.js`
* **Description**: The `userSchema` defines `is_admin` as `type: String` with `default: false` (a boolean literal).
* **Impact**: Leads to type mismatches during queries and updates (e.g., comparing string `"true"` vs boolean `true`).
* **Remediation**: Change `is_admin` definition in `user.js` to `type: Boolean, default: false`.

### 2.3 Unhandled File Upload Exception (Null `req.file`)
* **Location**: `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description**: The route directly references `req.file.filename` without verifying if `req.file` is defined.
* **Impact**: Sending a request to `/profile-upload-single` without attaching an image payload triggers an unhandled `TypeError: Cannot read property 'filename' of undefined`, causing request failure or crashes.
* **Remediation**: Check if `req.file` exists before accessing its properties, returning HTTP 400 Bad Request if missing.

### 2.4 Silent Error Handling and Empty Catch Blocks
* **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description**: Multiple routes contain empty `catch (error) {}` blocks or log errors to `console.log` without returning HTTP error status codes (e.g., HTTP 500) or error messages to the client.
* **Impact**: Requests fail silently, leaving client calls hanging or receiving no feedback when errors occur.
* **Remediation**: Return structured JSON error responses with appropriate HTTP status codes (400, 401, 403, 500) inside catch blocks.

### 2.5 Missing NPM Scripts in Backend Configuration
* **Location**: `backend/package.json`
* **Description**: The backend `package.json` lacks a `"start"` script or automated test command.
* **Impact**: Developers and automated scripts cannot run standard `npm start` commands.
* **Remediation**: Add `"start": "node index.js"` to `backend/package.json`.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1 Misplaced HTTP Request Options in Angular Services
* **Location**:
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  * `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Description**: `HttpClient.post()` calls pass `{ withCredentials: true }` as the 2nd method argument (request body) instead of the 3rd argument (request options).
  * Example: `this.http.post(url, { withCredentials: true })`
* **Impact**: The `{ withCredentials: true }` object is sent as the JSON body payload rather than setting HTTP request options, causing authentication headers/cookies to be omitted and sending invalid payloads.
* **Remediation**: Correct parameter ordering: `this.http.post(url, bodyPayload, { withCredentials: true })`.

### 3.2 Non-Functional Admin Search Input
* **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description**: The user list template renders a search input element, but the input is un-bound and lacks component logic or NgRx state selectors for filtering user records.
* **Impact**: Typing into the search bar has no effect on displayed users.
* **Remediation**: Connect the search input via `[(ngModel)]` or `ReactiveForms` and filter user state in `AdminUserlistComponent` / NgRx selectors.

### 3.3 Spelling Error in Frontend Directory Name
* **Location**: `frondend/`
* **Description**: The root directory for the Angular frontend is named `frondend` instead of `frontend`.
* **Impact**: Inconsistent directory naming across environment configurations and developer scripts.
* **Remediation**: Rename directory `frondend` to `frontend` or update configuration references accordingly.

---

## 4. Test Suite Failure Analysis

### 4.1 Angular Frontend Unit Test Failures
* **Location**: `frondend/jwtapp/src/app/**/*.spec.ts`
* **Description**: 12 out of 14 Angular component unit tests fail execution due to missing providers in `TestBed` configurations (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx Store mock).
* **Impact**: Automated continuous integration and test verification fail.
* **Remediation**: Import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore({})` in `TestBed.configureTestingModule` for all failing spec files.

### 4.2 Lack of Backend Unit / Integration Tests
* **Location**: `backend/`
* **Description**: No backend automated tests are configured.
* **Impact**: Regressions in API routes or authentication logic cannot be caught automatically.
* **Remediation**: Implement Jest or Supertest tests covering backend endpoints and authentication workflows.

---

## Summary Table of Issues

| ID | Category | Component | Vulnerability / Bug Description | Severity |
|---|---|---|---|---|
| SEC-1 | Security | Backend | Hardcoded JWT Secret (`"secret"`) | Critical |
| SEC-2 | Security | Backend | Missing Auth Middleware on Admin Endpoints | Critical |
| SEC-3 | Security | Backend | Password Leaked in Admin `/users` Response | High |
| SEC-4 | Security | Backend | Hardcoded MongoDB URI in `index.js` | Medium |
| SEC-5 | Security | Backend | Missing Anti-CSRF Protection | Medium |
| LOG-1 | Logic Bug | Backend | Admin Session Overwritten on User Creation | High |
| LOG-2 | Schema Bug | Backend | `is_admin` Schema Type Mismatch (`String` vs `Boolean`) | Medium |
| LOG-3 | Error Handling | Backend | Null Pointer on `req.file` in Profile Upload | Medium |
| LOG-4 | Error Handling | Backend | Silent Catch Blocks & Missing Error Responses | Medium |
| FE-1 | Frontend Bug | Angular | Incorrect `http.post` Parameter Order in Admin Services | High |
| FE-2 | Frontend Feature | Angular | Non-functional Static Search Bar in Admin User List | Low |
| FE-3 | Naming Bug | Workspace | Directory Typo (`frondend` vs `frontend`) | Low |
| TST-1 | Unit Tests | Angular | 12 Frontend Unit Tests Failing Due to Missing Providers | High |
