# Comprehensive Bug and Vulnerability Report

## Executive Summary

This report documents the security vulnerabilities, business logic errors, frontend component bugs, and test infrastructure issues identified across the application repository.

---

## 1. Security Vulnerabilities (Critical & High Severity)

### 1.1 Hardcoded Secret Key for JWT Signing and Verification
* **Severity:** High
* **Location:** `backend/routes/routes.js` (lines 35, 59, 74, 114, 137), `backend/routes/adminroute.js` (lines 20, 40, 163)
* **Description:** The JWT token signing and verification logic uses the hardcoded string `"secret"` instead of referencing the environment variable `process.env.jwtsecret` (configured in `backend/.env`).
* **Impact:** Anyone with access to the source code can forge valid JWT authentication cookies and impersonate any user or admin in the system.
* **Remediation:** Replace `"secret"` with `process.env.jwtsecret` across all route files and ensure a strong secret is configured in production.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Severity:** Critical
* **Location:** `backend/routes/adminroute.js`
* **Description:** Administrative endpoints including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack middleware to verify if the requesting user is authenticated and possesses admin privileges (`is_admin: true`).
* **Impact:** Unauthenticated users or regular non-admin users can view, edit, or delete any user account in the system by directly making HTTP requests to these endpoints.
* **Remediation:** Implement an authentication/authorization middleware (e.g., `verifyAdmin`) that validates the JWT cookie and confirms `is_admin === true` before executing handler logic.

### 1.3 Sensitive Data Exposure: Hashed Passwords Returned in User List
* **Severity:** High
* **Location:** `backend/routes/adminroute.js` (lines 53–62, `GET /users`)
* **Description:** The `/api/admin/users` endpoint retrieves user records via `User.find({})` and returns the complete Mongoose documents directly without excluding the `password` field.
* **Impact:** Password hashes of all registered users are sent in raw JSON over the network, exposing them to unauthorized viewing or cracking attempts.
* **Remediation:** Exclude the password field using Mongoose field selection (`User.find({}, '-password')`) or omit the field before returning data.

### 1.4 Admin Session Overwrite when Creating New User
* **Severity:** High
* **Location:** `backend/routes/adminroute.js` (lines 142–176, `POST /createuser`)
* **Description:** When an administrator creates a new user via `/api/admin/createuser`, the backend signs a new JWT for the *newly created user* and sets it as the `jwt` HTTP cookie on the response.
* **Impact:** Creating a user immediately overwrites the logged-in administrator's JWT cookie, effectively logging out the administrator and logging them in as the newly created user.
* **Remediation:** Remove the `res.cookie("jwt", token, ...)` call from the administrative user creation endpoint so the administrator's session is preserved.

---

## 2. Backend Logic & Reliability Issues

### 2.1 Unchecked File Upload Object (`req.file`)
* **Severity:** Medium
* **Location:** `backend/routes/routes.js` (lines 110–130, `POST /profile-upload-single`)
* **Description:** The single-file upload handler accesses `req.file.filename` directly without checking whether `req.file` exists.
* **Impact:** If a client submits a request to `/profile-upload-single` without attaching an image file, `req.file` will be `undefined`, causing an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')` crash or unhandled promise rejection.
* **Remediation:** Add a check `if (!req.file) return res.status(400).send({ message: "No file uploaded" });` before accessing `req.file.filename`.

### 2.2 Schema Type Inconsistency for `is_admin` Field
* **Severity:** Medium
* **Location:** `backend/models/user.js` (line 17)
* **Description:** The `is_admin` property in the Mongoose schema is defined with type `String`, but given a default boolean value `false`. In `backend/routes/adminroute.js`, queries search for `{ is_admin: true }` (boolean).
* **Impact:** Inconsistent type definitions (`String` vs `Boolean`) can result in failed database queries or unexpected implicit type coercion.
* **Remediation:** Change `is_admin` type to `Boolean` in `backend/models/user.js`: `{ type: Boolean, default: false }`.

### 2.3 Unhandled Exception Suppression & Missing Response Handlers
* **Severity:** Medium
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Description:** Several endpoint handlers (e.g., `adminrouter.post('/logout')`, `adminrouter.post('/deleteUser/:id')`, `router.post('/profile-upload-single')`) contain empty catch blocks (`catch (error) {}`) or omit error responses.
* **Impact:** Server-side exceptions are silently ignored, leaving client HTTP requests hanging or returning ambiguous responses without error messaging.
* **Remediation:** Add proper error logging (`console.error`) and return appropriate HTTP status codes (e.g., `res.status(500).json({ message: "Internal server error" })`) in all catch blocks.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1 Incorrect `HttpClient.post` Parameter Ordering
* **Severity:** Medium
* **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Description:** `HttpClient.post()` signature is `post(url, body, options)`. In these components, `{ withCredentials: true }` is passed as the second argument (`body`) instead of the third argument (`options`), e.g., `this.http.post(url, { withCredentials: true })`.
* **Impact:** `{ withCredentials: true }` is transmitted as the request body payload while the actual HTTP request is sent *without* credentials (cookies), leading to authentication failures on cookie-protected endpoints.
* **Remediation:** Pass an explicit empty body or request payload as second argument and options as third argument: `this.http.post(url, {}, { withCredentials: true })`.

### 3.2 Non-Functional Search Input in User List Component
* **Severity:** Low
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search element `<input type="text" placeholder="Search" class="input">` is static HTML without `[(ngModel)]`, `(input)` event bindings, or state selector filtering logic in `AdminUserlistComponent`.
* **Impact:** Users typing in the search bar experience no UI filtering or response.
* **Remediation:** Implement search state in NgRx or local component state and apply a filter pipe/selector on the displayed `userdata$` array.

### 3.3 Misspelled Directory Name
* **Severity:** Low
* **Location:** Root directory `frondend/`
* **Description:** The frontend project directory is misspelled as `frondend` instead of `frontend`.
* **Impact:** Non-standard folder naming degrades developer experience and tool consistency.
* **Remediation:** Rename directory from `frondend` to `frontend` and update any script or setup references if applicable.

---

## 4. Test Suite and Infrastructure Issues

### 4.1 Missing Testing Module Imports in Frontend Component Specs
* **Severity:** Medium
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:** Component unit tests fail during execution with `NullInjectorError: No provider for HttpClient!` and `No provider for Router!` because spec files lack `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
* **Impact:** Frontend unit tests cannot be run or validated in CI/CD pipelines without failing.
* **Remediation:** Update `TestBed.configureTestingModule` in all component `.spec.ts` files to include `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()`.

---

## 5. Summary Matrix

| ID | Module | Issue Summary | Severity | Status |
|---|---|---|---|---|
| 1.1 | Backend | Hardcoded JWT Secret (`"secret"`) | High | Open |
| 1.2 | Backend | Missing Auth/Admin Checks on Admin API Endpoints | Critical | Open |
| 1.3 | Backend | Sensitive Data Exposure (Password Hashes in `/users`) | High | Open |
| 1.4 | Backend | Admin Session Overwrite in `/createuser` | High | Open |
| 2.1 | Backend | Unchecked `req.file` access in file upload | Medium | Open |
| 2.2 | Backend | `is_admin` schema type defined as String instead of Boolean | Medium | Open |
| 2.3 | Backend | Suppressed exceptions and empty catch blocks | Medium | Open |
| 3.1 | Frontend | `HttpClient.post` options passed as request body | Medium | Open |
| 3.2 | Frontend | Static non-functional user search bar | Low | Open |
| 3.3 | Frontend | Root directory misspelled as `frondend` | Low | Open |
| 4.1 | Frontend | Unit test specs missing required module providers | Medium | Open |
