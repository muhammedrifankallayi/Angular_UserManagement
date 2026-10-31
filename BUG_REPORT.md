# Comprehensive Bug Report

This document outlines the bugs, vulnerabilities, test failures, and architectural issues identified across the backend and frontend components of the application.

---

## Table of Contents
1. [Security Vulnerabilities](#1-security-vulnerabilities)
2. [Backend Logic & Error Handling Defects](#2-backend-logic--error-handling-defects)
3. [Frontend Logic & API Defects](#3-frontend-logic--api-defects)
4. [Test Suite Deficiencies & Unit Test Failures](#4-test-suite-deficiencies--unit-test-failures)
5. [Configuration & Architectural Issues](#5-configuration--architectural-issues)
6. [Summary & Recommendations Matrix](#6-summary--recommendations-matrix)

---

## 1. Security Vulnerabilities

### SEC-01: Hardcoded JWT Secret Key
- **Severity:** Critical
- **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** JWT signing (`jwt.sign`) and token verification (`jwt.verify`) use a hardcoded plaintext secret string `"secret"` rather than retrieving the secret from environment variables (`process.env.jwtsecret`).
- **Impact:** Anyone with access to the source code or anyone guessing the default secret can forge authentication tokens for any user or admin account, completely bypassing authentication.
- **Remediation:** Reference `process.env.jwtsecret` (or `process.env.JWT_SECRET`) consistently across all route files and ensure a secure secret is loaded from environment configuration.

---

### SEC-02: Missing Authentication and Authorization on Administrative Endpoints
- **Severity:** Critical
- **Affected Files:** `backend/routes/adminroute.js`
- **Description:** Several administrative endpoints lack JWT authentication middleware and admin authorization checks:
  - `GET /api/admin/users`: Accessible without authentication.
  - `POST /api/admin/deleteUser/:id`: Allows unauthenticated deletion of any user by ID.
  - `POST /api/admin/editDetails/:id`: Allows unauthenticated querying of sensitive user details.
  - `POST /api/admin/editUser`: Allows unauthenticated modification of user information.
  - `POST /api/admin/createuser`: Allows unauthenticated creation of users.
- **Impact:** Malicious actors can access sensitive user records, modify accounts, create users, or delete arbitrary user accounts without credentials.
- **Remediation:** Introduce an authentication and admin authorization middleware (verifying JWT and checking `claims._id` / `is_admin === true`) and apply it across all `/api/admin/*` management routes.

---

### SEC-03: Plaintext Password Hash Exposure in Admin User List
- **Severity:** High
- **Affected Files:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
- **Description:** The `GET /users` endpoint performs `User.find({})` and directly returns the user documents via `res.send(user)` without sanitizing or projecting out the `password` field. The code attempting to exclude password hashes was commented out.
- **Impact:** Bcrypt password hashes for every registered user in the database are transmitted over the network in API responses, exposing them to credential cracking attacks.
- **Remediation:** Use projection `User.find({}, '-password')` or map over users to remove `password` before returning response data.

---

### SEC-04: Lack of CSRF Protection on Cookie-Authenticated Endpoints
- **Severity:** Medium
- **Affected Files:** `backend/index.js`
- **Description:** Authentication relies on an `httpOnly` session cookie (`jwt`) sent with cross-origin requests (`cors` with `credentials: true`), but there is no CSRF token validation or `SameSite` cookie policy configured.
- **Impact:** Users authenticated in their browser could be susceptible to cross-site request forgery attacks where third-party sites initiate state-changing requests (such as profile uploads, deletions, or edits).
- **Remediation:** Configure `SameSite: 'Lax'` or `'Strict'` on authentication cookies and implement CSRF protection tokens for state-altering requests.

---

### SEC-05: Insecure File Upload Handling
- **Severity:** Medium
- **Affected Files:** `backend/routes/routes.js` (`POST /api/profile-upload-single`)
- **Description:** The multer upload configuration (`multer({ dest: './file' })`) does not enforce file extension/MIME-type filtering or file size constraints.
- **Impact:** Authenticated users can upload arbitrary files of any size or type, potentially leading to denial of service (disk exhaustion) or stored malicious payloads.
- **Remediation:** Add file size limits (e.g., `limits: { fileSize: 2 * 1024 * 1024 }`) and a file filter validating permissible image MIME types (JPEG, PNG).

---

## 2. Backend Logic & Error Handling Defects

### BE-01: Admin Session Overwritten Upon User Creation
- **Severity:** High
- **Affected Files:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
- **Description:** When an administrator creates a new user via `/api/admin/createuser`, the backend signs a JWT token for the newly created user and sets it as the `jwt` cookie in `res.cookie("jwt", token, ...)`.
- **Impact:** The administrator's current session cookie is overwritten with the newly created regular user's token, immediately downgrading the administrator's session and revoking their administrative access.
- **Remediation:** Remove the `res.cookie` call from `createuser`. Only registration and login endpoints should issue cookies to the requesting client.

---

### BE-02: User Model `is_admin` Field Type Inconsistency
- **Severity:** Medium
- **Affected Files:** `backend/models/user.js`
- **Description:** In the Mongoose schema for `User`, `is_admin` is defined with type `String` but with a boolean default:
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
- **Impact:** In queries such as `User.findOne({ email: req.body.email, is_admin: true })`, query matching against string values can produce inconsistent or unexpected results depending on Mongoose type casting.
- **Remediation:** Change `type: String` to `type: Boolean` in `backend/models/user.js`.

---

### BE-03: Null Pointer / Unhandled Exception on Profile Upload Without File
- **Severity:** Medium
- **Affected Files:** `backend/routes/routes.js` (`POST /api/profile-upload-single`)
- **Description:** The endpoint executes:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
  If a client submits the request without an attached file or with an incorrect form field name, `req.file` is `undefined`, causing a `TypeError: Cannot read properties of undefined (reading 'filename')`.
- **Impact:** The unhandled exception is caught by an empty catch block, leaving the client request hanging without a response until timeout.
- **Remediation:** Validate that `req.file` exists before accessing `req.file.filename`. Return HTTP 400 if missing.

---

### BE-04: Empty Catch Blocks and Hanging HTTP Connections
- **Severity:** Medium
- **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** Multiple routes feature empty catch blocks or catch blocks that log errors to `console.log` without sending an HTTP response:
  - `routes.js`: `/profile-upload-single`, `/profile`
  - `adminroute.js`: `/login`, `/logout`, `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`
- **Impact:** When an exception occurs (e.g. database disconnect, malformed request, invalid ObjectID), the server fails to respond, leaving the HTTP client hung indefinitely and exhausting server connection sockets.
- **Remediation:** Implement standard `return res.status(500).json({ message: error.message || 'Internal Server Error' })` in catch blocks.

---

### BE-05: Double Response Execution ("Cannot set headers after they are sent")
- **Severity:** Low
- **Affected Files:** `backend/routes/adminroute.js` (`/deleteUser/:id`, `/editDetails/:id`)
- **Description:** In `adminrouter.post('/deleteUser/:id')`:
  ```javascript
  if (!deleteUser) {
      res.send({ message: "Deletion went wrong" });
  }
  res.send(deleteUser);
  ```
  In `adminrouter.post('/editDetails/:id')`:
  ```javascript
  if (!userData) {
      res.send({ message: "Something went wrong" });
  }
  res.send(data);
  ```
  Neither `if` block returns early with `return res.send(...)`.
- **Impact:** Node.js attempts to send two HTTP responses for the same request, triggering `ERR_HTTP_HEADERS_SENT` in the runtime logs.
- **Remediation:** Add `return` prior to `res.send()` or `res.status(...).json(...)` when handling the failure branch.

---

## 3. Frontend Logic & API Defects

### FE-01: Incorrect `HttpClient.post` Argument Placement (Missing Auth Credentials)
- **Severity:** High
- **Affected Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (line 42)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (line 74)
- **Description:** Angular `HttpClient.post()` signature is `post(url: string, body: any, options?: {...})`.
  In `AdminUserlistComponent`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
  In `AdminUsereditComponent`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  })
  ```
  The options object `{ withCredentials: true }` is passed as the 2nd argument (`body`) rather than the 3rd argument (`options`).
- **Impact:** The HTTP requests are sent without cookies/credentials and send `{ withCredentials: true }` as the request payload. In an authenticated environment, these calls fail with 401 Unauthorized.
- **Remediation:** Pass `{}` or `null` as the 2nd argument: `this.http.post(url, {}, { withCredentials: true })`.

---

### FE-02: Non-Functional Search Bar in Admin User List
- **Severity:** Medium
- **Affected Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Description:** The search input `<input type="text" placeholder="Search" class="input">` in `AdminUserlistComponent` has no two-way data binding (`[(ngModel)]`), form control, or event listener.
- **Impact:** Typing into the search field has no effect on the displayed user list; user filtering is completely non-operational.
- **Remediation:** Bind the input to a search query model/event and implement filtering logic either in the component or via an NgRx selector.

---

### FE-03: Client-Side Crash on Profile Upload Without File Selection
- **Severity:** Low
- **Affected Files:** `frondend/jwtapp/src/app/components/profile/profile.component.ts` (`onSubmit()`)
- **Description:** In `ProfileComponent.onSubmit()`:
  ```typescript
  formData.append('image', this.selectedFile, this.selectedFile.name);
  ```
  If the user clicks "Submit" before selecting a file, `this.selectedFile` is `null`.
- **Impact:** Clicking submit causes an uncaught JavaScript error: `TypeError: Cannot read properties of null (reading 'name')`, breaking page interaction.
- **Remediation:** Check `if (!this.selectedFile) { Swal.fire('Error', 'Please select an image', 'error'); return; }` before constructing FormData.

---

## 4. Test Suite Deficiencies & Unit Test Failures

### TEST-01: 12 Out of 14 Angular Unit Tests Failing Due to Missing Providers
- **Severity:** High
- **Affected Files:**
  - `frondend/jwtapp/src/app/components/home/home.component.spec.ts`
  - `frondend/jwtapp/src/app/components/admin-login/admin-login.component.spec.ts`
  - `frondend/jwtapp/src/app/components/dashboard/dashboard.component.spec.ts`
  - `frondend/jwtapp/src/app/components/nav/nav.component.spec.ts`
  - `frondend/jwtapp/src/app/components/profile/profile.component.spec.ts`
  - `frondend/jwtapp/src/app/components/admin-createuser/admin-createuser.component.spec.ts`
  - `frondend/jwtapp/src/app/components/register/register.component.spec.ts`
  - `frondend/jwtapp/src/app/components/login/login.component.spec.ts`
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.spec.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.spec.ts`
  - `frondend/jwtapp/src/app/components/admin-nav/admin-nav.component.spec.ts`
  - `frondend/jwtapp/src/app/app.component.spec.ts`
- **Description:** Running `ng test` results in 12 failures:
  - 11 component specs fail with `NullInjectorError: No provider for HttpClient!` and `No provider for Router!` because `TestBed.configureTestingModule` does not import `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, or `provideMockStore`.
  - `AppComponent` spec fails (`Expected undefined to contain 'jwtapp app is running!'`) because the template only contains `<router-outlet></router-outlet>`.
- **Impact:** Automated CI/CD pipelines cannot validate frontend build health, masking actual regressions.
- **Remediation:** Update component spec files with proper testing mocks (`HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and `provideMockStore`).

---

### TEST-02: Absence of Backend Automated Testing
- **Severity:** Medium
- **Affected Files:** `backend/package.json`
- **Description:** The backend has `"test": "echo \"Error: no test specified\" && exit 1"`. There are no unit or integration tests for authentication, JWT validation, or CRUD routes.
- **Impact:** Route modifications cannot be verified automatically, leading to unnoticed regressions in API behavior.
- **Remediation:** Introduce a testing framework (e.g. Jest or Mocha/Supertest) with tests covering authentication, route authorization, and data validation.

---

## 5. Configuration & Architectural Issues

### ARCH-01: Hardcoded Database Connection String and Server Port
- **Severity:** Medium
- **Affected Files:** `backend/index.js`
- **Description:** The MongoDB connection string (`mongodb://127.0.0.1:27017/jwtproject`) and port (`5000`) are hardcoded in `index.js` rather than being read from environment variables (`process.env.MONGO_URI`, `process.env.PORT`).
- **Impact:** Deploying to containerized or cloud environments (staging, production) requires modifying source code.
- **Remediation:** Read database configuration and port from environment variables with fallbacks.

---

### ARCH-02: Misspelled Directory Name (`frondend/`)
- **Severity:** Low
- **Affected Files:** Repository root structure (`frondend/jwtapp/`)
- **Description:** The frontend directory is named `frondend` rather than `frontend`.
- **Impact:** Inconsistent project naming conventions and potential confusion for developers or CI scripts.
- **Remediation:** Rename `frondend` to `frontend` and update references in build scripts or documentation.

---

## 6. Summary & Recommendations Matrix

| Bug ID | Component | Title | Severity | Recommended Fix |
|---|---|---|---|---|
| **SEC-01** | Backend | Hardcoded JWT Secret Key | Critical | Use `process.env.jwtsecret` in all JWT sign/verify calls. |
| **SEC-02** | Backend | Missing Auth & Authz on Admin Endpoints | Critical | Implement JWT and admin role verification middleware on `/api/admin/*`. |
| **SEC-03** | Backend | Password Hash Leaked in Admin User Query | High | Exclude `password` field from `User.find()` query results. |
| **SEC-04** | Backend | Lack of CSRF Protection | Medium | Set `SameSite` cookie flags and CSRF verification tokens. |
| **SEC-05** | Backend | Unrestricted File Upload | Medium | Enforce MIME-type checks and file size limits in multer configuration. |
| **BE-01** | Backend | Admin Session Overwritten on User Creation | High | Do not set `res.cookie` in `/api/admin/createuser`. |
| **BE-02** | Backend | Mongoose Schema `is_admin` Type Inconsistency | Medium | Define `is_admin: { type: Boolean, default: false }`. |
| **BE-03** | Backend | Unhandled Exception on Empty File Upload | Medium | Validate `req.file` presence before reading properties. |
| **BE-04** | Backend | Empty Catch Blocks & Hanging Requests | Medium | Send proper HTTP 500 error responses in catch blocks. |
| **BE-05** | Backend | Multiple HTTP Responses Sent in Admin Routes | Low | Add `return` before sending early error responses. |
| **FE-01** | Frontend | `HttpClient.post` Options Passed as Body | High | Pass `options` as the 3rd parameter in `post()` calls. |
| **FE-02** | Frontend | Non-functional Admin User Search Bar | Medium | Bind input to component state and implement filtering. |
| **FE-03** | Frontend | Crash on Profile Save Without File | Low | Add null check on `selectedFile` before upload. |
| **TEST-01**| Frontend | 12 of 14 Angular Unit Tests Failing | High | Add `HttpClientTestingModule`, `RouterTestingModule`, `MockStore`. |
| **TEST-02**| Backend | No Backend Test Suite | Medium | Set up Mocha/Supertest or Jest test suites for API routes. |
| **ARCH-01**| Backend | Hardcoded DB URI & Port | Medium | Extract MongoDB connection URI and port to `.env`. |
| **ARCH-02**| Repo Root | Misspelled `frondend/` Directory | Low | Rename `frondend` to `frontend`. |
