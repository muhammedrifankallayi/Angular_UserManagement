# Comprehensive Bug & Security Report

## Overview
This report documents security vulnerabilities, logic errors, frontend/backend bugs, and test failure analysis identified in the application repository.

---

## 1. Critical Security Vulnerabilities

### 1.1 Unauthenticated & Unauthorized Admin API Routes
- **Location:** `backend/routes/adminroute.js`
- **Description:** Administrative endpoints (including `/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/editDetails/:id`, `/api/admin/editUser`, and `/api/admin/createuser`) lack JWT authentication and role-based authorization middleware.
- **Impact:** Any unauthenticated remote user can list all user accounts, view details, edit user details, delete users, or create new accounts without providing valid authentication tokens or administrative credentials.
- **Recommendation:** Implement authentication middleware (`jwt.verify`) and check for `is_admin` privilege on all administrative routes before handling requests.

### 1.2 Sensitive Information Leakage (Hashed Passwords in API Responses)
- **Location:** `backend/routes/adminroute.js` (`/api/admin/users`)
- **Description:** The `/api/admin/users` route retrieves all user documents with `User.find({})` and directly returns them (`res.send(user)`). Commented-out code indicates intention to strip passwords, but it is currently unexecuted.
- **Impact:** User records returned by the API include hashed passwords (`password` field), exposing sensitive user credentials to any client querying this endpoint.
- **Recommendation:** Exclude the `password` field from Mongoose queries (`User.find({}, { password: 0 })`) or strip `password` from output objects before sending responses.

### 1.3 Hardcoded JWT Secrets
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** The JWT secret `"secret"` is hardcoded as a literal string in `jwt.sign()` and `jwt.verify()` calls across both route files, despite `process.env.jwtsecret` being defined in the environment.
- **Impact:** Attackers who inspect source code or obtain public code access can forge valid JWT tokens for any user or administrator.
- **Recommendation:** Replace all hardcoded secret strings with `process.env.jwtsecret`.

### 1.4 Admin Session Overwriting on User Creation
- **Location:** `backend/routes/adminroute.js` (`/api/admin/createuser`)
- **Description:** When an admin creates a new user via `/api/admin/createuser`, the route signs a new JWT token for the newly created user and sets it in the HTTP cookie (`res.cookie("jwt", token)`).
- **Impact:** The admin's session cookie is overwritten with the new user's JWT, effectively logging the admin out and impersonating the newly created user.
- **Recommendation:** Remove token generation and cookie setting from the admin `createuser` endpoint; only save the new user record and return a success message.

### 1.5 Missing CSRF Protections & Permissive CORS Configuration
- **Location:** `backend/index.js`
- **Description:** CORS is configured to allow credentials (`credentials: true`) from `http://localhost:4200`, but no Anti-CSRF tokens or `SameSite` cookie attributes are configured on JWT session cookies.
- **Impact:** Susceptible to Cross-Site Request Forgery (CSRF) attacks if a user visits a malicious website while authenticated.
- **Recommendation:** Implement CSRF protection middleware or enforce `SameSite=Strict` / `SameSite=Lax` on session cookies.

---

## 2. Logic Errors & Application Bugs

### 2.1 Mongoose Schema Type Mismatch for `is_admin`
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String, default: false`. A boolean `false` is assigned as default value for a `String` field type.
- **Impact:** Queries such as `User.findOne({ email: req.body.email, is_admin: true })` in `adminroute.js` compare boolean `true` against string stored values, leading to potential type mismatches or unexpected behavior depending on Mongoose casting.
- **Recommendation:** Update `is_admin` field schema definition to `type: Boolean, default: false`.

### 2.2 Unhandled Null/Undefined File in Profile Picture Upload
- **Location:** `backend/routes/routes.js` (`/profile-upload-single`)
- **Description:** The `/profile-upload-single` endpoint accesses `req.file.filename` directly without validating whether `req.file` exists.
- **Impact:** If a request is sent without a file attachment or with an incorrect field name, accessing `req.file.filename` throws a `TypeError: Cannot read properties of undefined (reading 'filename')`, causing unhandled runtime errors.
- **Recommendation:** Add a guard check `if (!req.file) { return res.status(400).send({ message: "No file uploaded" }); }`.

### 2.3 Poor Error Handling and Suppressed Exceptions
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Multiple routes feature empty `catch (error) {}` blocks (e.g. `/profile-upload-single`, `/deleteUser/:id`, `/logout`) or lack HTTP response calls inside `catch` blocks.
- **Impact:** Server errors are silently caught without returning HTTP error responses (e.g., status 500), causing client requests to hang or fail silently.
- **Recommendation:** Ensure all `catch` blocks log errors and return appropriate HTTP responses (`res.status(500).json(...)`).

### 2.4 Misplaced HTTP Request Arguments in Frontend Components
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** `HttpClient.post()` signature in Angular expects `(url, body, options)`. In `deleteUser()` and `getusers()`, options `{ withCredentials: true }` are passed as the second argument (`body`) instead of the third argument (`options`).
- **Impact:** Request body contains `{ withCredentials: true }` while HTTP request options remain default (meaning cookies are not sent with credentials), breaking session authorization for these endpoints.
- **Recommendation:** Pass `{}` as the body (second argument) and `{ withCredentials: true }` as the options object (third argument): `this.http.post(url, {}, { withCredentials: true })`.

### 2.5 Non-Functional Admin User Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Description:** The search input element `<input type="text" placeholder="Search" class="input">` in `AdminUserlistComponent` is static HTML without `ngModel`, event listeners, or store filtering logic.
- **Impact:** Typing in the search field produces no filtering or user search functionality.
- **Recommendation:** Implement two-way data binding or event handling and filter `userdata$` through RxJS operators or NgRx selectors.

---

## 3. Environment, Project Structure & Unit Test Failures

### 3.1 Misspelled Frontend Directory Name
- **Location:** Root directory (`frondend/` instead of `frontend/`)
- **Description:** The directory containing the Angular project is named `frondend`.
- **Impact:** Causes confusion for developer tooling, scripts, and onboarding documentation expecting standard naming.
- **Recommendation:** Rename `frondend/` directory to `frontend/`.

### 3.2 Missing NPM Scripts in Backend
- **Location:** `backend/package.json`
- **Description:** `package.json` in `backend` lacks `start` script and test scripts (`"test": "echo \"Error: no test specified\" && exit 1"`).
- **Impact:** Standard commands like `npm start` fail to execute the server.
- **Recommendation:** Add `"start": "node index.js"` script to `backend/package.json`.

### 3.3 Angular Frontend Unit Test Suite Failures
- **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description:** Multiple Angular component spec files lack required mock modules in `TestBed` configuration (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Impact:** Unit tests fail with `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing Store providers.
- **Recommendation:** Import `HttpClientTestingModule`, `RouterTestingModule`, and configure `provideMockStore()` in all component spec files.
