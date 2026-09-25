# Comprehensive Bug Report & Codebase Audit

## Executive Summary

This report provides a detailed audit of the repository, identifying security vulnerabilities, backend logic errors, frontend bugs, test failures, and architectural flaws. Address of these issues is critical to ensuring application security, reliability, maintainability, and proper test coverage.

---

## 1. Critical Security Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Endpoints
* **Severity:** Critical
* **Affected File:** `backend/routes/adminroute.js`
* **Affected Routes:** `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`
* **Description:**
  Only the `/active` route verifies the `jwt` cookie. All other administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization checks.
* **Impact:**
  Any unauthenticated actor or non-admin user can list, edit, create, or delete user records in the system by directly calling the admin API endpoints.
* **Recommendation:**
  Implement an authentication and admin role verification middleware (e.g. `verifyAdminToken`) and apply it to all administrative routes in `adminroute.js`.

---

### 1.2 Sensitive Data Exposure: Password Hashes Returned in API
* **Severity:** High
* **Affected File:** `backend/routes/adminroute.js`
* **Affected Route:** `GET /api/admin/users`
* **Description:**
  In the `GET /users` endpoint, the logic to omit the `password` field is commented out (`// const {password, ...data} = await user.toJSON();`). As a result, the full Mongoose user objects including password hashes (`password`) are serialized and returned in the HTTP response body.
* **Impact:**
  Exposes user password hashes to any client querying the user list endpoint.
* **Recommendation:**
  Uncomment or refactor the user serialization logic (or use `.select('-password')` in the Mongoose query) to ensure passwords are excluded from API responses.

---

### 1.3 Hardcoded JWT Secret
* **Severity:** Medium
* **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:**
  Although `process.env` is configured via `dotenv.config()`, all JWT signing and verification calls explicitly use the hardcoded string `"secret"` (e.g., `jwt.sign({_id:...}, "secret")` and `jwt.verify(cookie, "secret")`) instead of `process.env.jwtsecret`.
* **Impact:**
  Attainable secret via static analysis or reverse engineering compromises token signatures across environments.
* **Recommendation:**
  Update all `jwt.sign` and `jwt.verify` calls to reference `process.env.jwtsecret`.

---

### 1.4 Hardcoded Database Connection String
* **Severity:** Low
* **Affected File:** `backend/index.js`
* **Description:**
  The MongoDB URI is hardcoded as `'mongodb://127.0.0.1:27017/jwtproject'`.
* **Impact:**
  Prevents deployment to different environments (staging, production, containerized setups) without editing source code.
* **Recommendation:**
  Move the database URI into environment variables (e.g., `process.env.MONGO_URI`).

---

## 2. Backend Logic Errors & Exception Handling Bugs

### 2.1 Admin Session Cookie Overwritten on User Creation
* **Severity:** High
* **Affected File:** `backend/routes/adminroute.js`
* **Affected Route:** `POST /api/admin/createuser`
* **Description:**
  When an administrator creates a new user via `/createuser`, the backend signs a new JWT token for the *newly created user* and calls `res.cookie("jwt", token, ...)` on the HTTP response.
* **Impact:**
  Overwrites the administrator's active session cookie with the new user's credentials, logging out the administrator immediately upon creating a user.
* **Recommendation:**
  Remove cookie generation and `res.cookie()` calls from the administrative `createuser` endpoint.

---

### 2.2 Unhandled Null Pointer Exception in Single File Upload
* **Severity:** Medium
* **Affected File:** `backend/routes/routes.js`
* **Affected Route:** `POST /api/profile-upload-single`
* **Description:**
  The route handler directly accesses `req.file.filename` without verifying if `req.file` was attached by `multer`. If a request is sent without a file attachment, `req.file` is `undefined`, triggering a `TypeError`.
* **Impact:**
  Causes unhandled runtime exceptions. Combined with empty catch blocks, requests hang until client timeout.
* **Recommendation:**
  Check if `req.file` exists before accessing properties, and return a `400 Bad Request` error if no file was uploaded.

---

### 2.3 Suppressed Exceptions and Hanging HTTP Requests
* **Severity:** Medium
* **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:**
  Multiple try-catch blocks across endpoints (e.g., `/profile-upload-single`, `/profile`, `/deleteUser/:id`, `/logout`) either contain empty catch blocks or only execute `console.log(error.message)` without returning an HTTP response to the client.
* **Impact:**
  When errors occur, client connections remain open and eventually time out, resulting in poor user experience and potential socket exhaustion.
* **Recommendation:**
  Ensure every `catch` block returns an appropriate HTTP error status (e.g., 400, 401, or 500) with a JSON error payload.

---

### 2.4 Schema Definition Type Mismatch for `is_admin`
* **Severity:** Medium
* **Affected File:** `backend/models/user.js`
* **Description:**
  In `userSchema`, `is_admin` is defined with `{ type: String, default: false }`. Mixing `String` type with boolean `false` default leads to schema inconsistencies when querying or casting values (e.g., `{ is_admin: true }` in `adminroute.js`).
* **Impact:**
  Potential query failures or unexpected casting behavior when checking administrative privileges.
* **Recommendation:**
  Change the type definition of `is_admin` in `backend/models/user.js` to `Boolean` (`{ type: Boolean, default: false }`).

---

## 3. Frontend Logic Errors & UI Issues

### 3.1 Incorrect `HttpClient.post` Options Argument Signature
* **Severity:** High
* **Affected Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser` method)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers` method)
* **Description:**
  The `HttpClient.post` method signature in Angular is `post(url, body, options)`. In `deleteUser` and `getusers`, the call is written as:
  `this.http.post(url, { withCredentials: true })`
  This passes `{ withCredentials: true }` as the request `body` (2nd parameter) rather than request `options` (3rd parameter).
* **Impact:**
  Requests are dispatched without credential cookies (`withCredentials`), causing backend authentication checks to fail or request options to be sent as the payload.
* **Recommendation:**
  Pass an explicit body or empty object `{}` as the 2nd argument and `{ withCredentials: true }` as the 3rd argument (e.g., `this.http.post(url, {}, { withCredentials: true })`).

---

### 3.2 Non-Functional Static Search Input
* **Severity:** Low
* **Affected File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:**
  The input element `<input type="text" placeholder="Search" class="input">` in `AdminUserlistComponent` has no event bindings (`(input)`), form control binding, or NgRx state filter integration.
* **Impact:**
  Users typing into the search input experience no filtering action.
* **Recommendation:**
  Bind the search input to a component property/reactive form control and implement filtering logic in the NgRx selector or component.

---

### 3.3 Memory Leak & Unhandled Store Subscription in Profile Component
* **Severity:** Low
* **Affected File:** `frondend/jwtapp/src/app/components/profile/profile.component.ts`
* **Description:**
  `userData$` subscribes directly to `this.store.pipe(select(userProfile))` as a class field property without unsubscribing on component destruction (`ngOnDestroy`) or using the `async` pipe in the template. If store data is initially `undefined`, property access (`userProfileData.name`) throws a runtime exception.
* **Impact:**
  Potential runtime errors on initial render and memory leaks across component navigations.
* **Recommendation:**
  Use the `async` pipe in the component template or manage the RxJS subscription properly with `takeUntil` or `Unsubscribe`.

---

## 4. Test Suite Failures & Architectural Flaws

### 4.1 Angular Component Spec Unit Test Failures (12 of 14 Failing)
* **Severity:** High
* **Affected Files:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:**
  Running `ng test` results in 12 unit test failures out of 14 total tests. The primary error is `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing Store providers in `TestBed` configuration.
* **Impact:**
  Automated CI/CD pipelines fail and component unit testing is non-functional.
* **Recommendation:**
  Update all `.spec.ts` files to include `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and `provideMockStore({})` in `TestBed.configureTestingModule`.

---

### 4.2 Root Directory Misspelling
* **Severity:** Low
* **Affected Directory:** `frondend/`
* **Description:**
  The frontend folder is misspelled as `frondend` instead of `frontend`.
* **Impact:**
  Inconsistent naming convention and potential confusion during setup or build script execution.
* **Recommendation:**
  Rename `frondend` to `frontend` or document the directory structure clearly in project instructions.

---

### 4.3 Missing `start` Script in Backend `package.json`
* **Severity:** Low
* **Affected File:** `backend/package.json`
* **Description:**
  `package.json` in `backend/` lacks a standard `"start"` script in `scripts`.
* **Impact:**
  Standard commands like `npm start` fail when executed inside `backend/`.
* **Recommendation:**
  Add `"start": "node index.js"` to `backend/package.json`.

---

## 5. Summary Table of Identified Issues

| ID | Issue | Severity | Category | Status |
|---|---|---|---|---|
| SEC-01 | Missing Admin Auth Middleware | Critical | Security | Reported |
| SEC-02 | Password Disclosure in Users API | High | Security | Reported |
| SEC-03 | Hardcoded JWT Secret Key | Medium | Security | Reported |
| SEC-04 | Hardcoded MongoDB Connection | Low | Configuration | Reported |
| BUG-01 | Admin Session Cookie Overwritten | High | Backend Logic | Reported |
| BUG-02 | Null Pointer in Profile File Upload | Medium | Backend Error Handling | Reported |
| BUG-03 | Suppressed Exceptions / Hanging Requests | Medium | Backend Error Handling | Reported |
| BUG-04 | Schema Type Mismatch (`is_admin`) | Medium | Database / Schema | Reported |
| FE-01 | `HttpClient.post` Parameter Mismatch | High | Frontend Logic | Reported |
| FE-02 | Static Non-Functional Search Input | Low | Frontend UI | Reported |
| FE-03 | Unhandled RxJS Store Subscription | Low | Frontend State | Reported |
| TST-01 | 12 Failing Angular Unit Tests | High | Testing | Reported |
| ARCH-01| Directory Name Misspelling (`frondend`) | Low | Architecture | Reported |
| ARCH-02| Missing Backend `start` Script | Low | Tooling / NPM | Reported |
