# Bug Report & Audit Document

## Overview
This document provides a comprehensive analysis of security vulnerabilities, logic errors, architectural flaws, and test failures identified within the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Severity:** High
* **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** The JSON Web Token (JWT) signing and verification processes use a hardcoded string literal (`"secret"`) instead of consuming environment variables (e.g., `process.env.jwtsecret`).
* **Impact:** Anyone with access to the source code can forge arbitrary JWT tokens, bypassing authentication completely and impersonating any user or administrator.
* **Recommendation:** Replace `"secret"` with `process.env.jwtsecret` or a securely generated environment variable in all JWT sign/verify calls.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
* **Severity:** High
* **Affected Files:** `backend/routes/adminroute.js`
* **Description:** Endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication and admin authorization checks.
* **Impact:** Any unauthenticated user can access, modify, or delete user accounts via direct API calls.
* **Recommendation:** Implement an authentication middleware verifying JWT cookies and enforcing `is_admin` privileges before executing route handlers.

### 1.3 Exposure of Sensitive Data (Password Hashes)
* **Severity:** Medium
* **Affected Files:** `backend/routes/adminroute.js` (`/users` route)
* **Description:** The `/users` endpoint returns raw user documents from `User.find({})` without stripping the `password` field.
* **Impact:** Exposes hashed passwords to clients, making them susceptible to offline brute-force or dictionary attacks.
* **Recommendation:** Exclude the `password` field using `User.find({}, { password: 0 })` or `select('-password')`.

### 1.4 Unhandled Null Reference in File Upload (Potential DoS)
* **Severity:** Medium
* **Affected Files:** `backend/routes/routes.js` (`/profile-upload-single` route)
* **Description:** The file upload handler accesses `req.file.filename` directly without verifying if `req.file` exists.
* **Impact:** Requests submitted without an attached file trigger an uncaught `TypeError: Cannot read properties of undefined (reading 'filename')`, causing backend exceptions.
* **Recommendation:** Validate `req.file` before accessing its properties and return a `400 Bad Request` response if absent.

### 1.5 Missing CSRF Protection & Permissive CORS Configuration
* **Severity:** Medium
* **Affected Files:** `backend/index.js`
* **Description:** CORS is configured with `credentials: true` for `http://localhost:4200`, but there is no Anti-CSRF token verification or SameSite cookie protection implemented.
* **Impact:** Vulnerable to Cross-Site Request Forgery (CSRF) attacks when authenticated users visit malicious origins.
* **Recommendation:** Implement Anti-CSRF middleware or configure cookie attributes with `SameSite=Strict` / `SameSite=Lax`.

---

## 2. Logic & Functional Bugs

### 2.1 Admin Create User Session Overwrite
* **Severity:** High
* **Affected Files:** `backend/routes/adminroute.js` (`/createuser` route)
* **Description:** When an administrator creates a new user account via `/createuser`, the server sets a new `jwt` cookie containing the created user's ID.
* **Impact:** Creating a user immediately overwrites the administrator's authentication cookie, logging them out or switching their active session to the new user.
* **Recommendation:** Do not issue a new JWT cookie upon administrative user creation.

### 2.2 Mongoose Schema Field Type Inconsistency
* **Severity:** Medium
* **Affected Files:** `backend/models/user.js`, `backend/routes/adminroute.js`
* **Description:** The `is_admin` field in the Mongoose schema is defined as `type: String` with `default: false` (a boolean).
* **Impact:** Inconsistent queries (e.g., querying `{ is_admin: true }` vs `{ is_admin: "true" }`) lead to unexpected lookup failures.
* **Recommendation:** Update `is_admin` in `user.js` to `type: Boolean`.

### 2.3 Frontend HttpClient Request Options Placement Bug
* **Severity:** High
* **Affected Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Description:** `HttpClient.post` calls pass HTTP options (e.g. `{ withCredentials: true }`) as the second argument (request body) instead of the third argument (options object) for routes without payload.
* **Impact:** Cookie credentials are not included in requests, causing authentication checks to fail on the backend.
* **Recommendation:** Pass `{ withCredentials: true }` as the third parameter in `http.post(url, body, options)` calls (e.g., `http.post(url, {}, { withCredentials: true })`).

### 2.4 Silent Errors & Unhandled Catch Blocks
* **Severity:** Medium
* **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Multiple endpoints contain empty `catch` blocks or log errors without returning an HTTP error response to the client.
* **Impact:** Client HTTP requests remain hanging until timeout when runtime exceptions occur.
* **Recommendation:** Add proper error logging and ensure all `catch` blocks return appropriate HTTP status codes (e.g., `res.status(500).json({ message: "Server error" })`).

### 2.5 Unimplemented Search Feature in Admin User List
* **Severity:** Low
* **Affected Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element in `admin-userlist` is static HTML without databinding or backing event handlers in the component logic.
* **Impact:** Users cannot filter or search through the user list.
* **Recommendation:** Connect search input with `ngModel` / Reactive Forms and implement search filtering logic or NgRx actions.

---

## 3. Architectural & Environment Issues

### 3.1 Misspelled Frontend Directory Name
* **Severity:** Low
* **Affected Files:** Root workspace directory (`frondend/`)
* **Description:** The frontend root folder is named `frondend` instead of `frontend`.
* **Impact:** Potential confusion for developer tooling and CI/CD pipelines expecting standard directory naming.

### 3.2 Hardcoded Database Connection String
* **Severity:** Low
* **Affected Files:** `backend/index.js`
* **Description:** Connection URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
* **Impact:** Prevents dynamic configuration across development, staging, and production environments.
* **Recommendation:** Use environment variable `process.env.MONGODB_URI`.

### 3.3 Missing Test/Start Scripts in Backend `package.json`
* **Severity:** Low
* **Affected Files:** `backend/package.json`
* **Description:** No `npm test` script or standardized test runner is configured for backend testing.
* **Recommendation:** Add test runner scripts (e.g., Jest or Mocha) and test files for API endpoint verification.

---

## 4. Frontend Unit Test Failures

### 4.1 Missing Angular Test Providers
* **Severity:** Medium
* **Affected Files:** Component `.spec.ts` files under `frondend/jwtapp/src/app/`
* **Description:** 12 out of 14 Angular unit tests fail due to missing dependencies in `TestBed` configurations (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx Store providers).
* **Impact:** Automated unit test suite fails during CI checks.
* **Recommendation:** Import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` in test spec configurations.
