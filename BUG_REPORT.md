# Comprehensive Bug Report

This document details all identified security vulnerabilities, logic errors, frontend bugs, schema inconsistencies, and test failures across the backend and frontend components of the application.

---

## 1. Security Vulnerabilities

### Critical Severity

#### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` (lines 35, 61, 71, 107, 127), `backend/routes/adminroute.js` (lines 22, 45)
- **Description:** JWT signing and verification rely on a hardcoded string `"secret"` rather than retrieving the environment variable (`process.env.jwtsecret`).
- **Impact:** An attacker aware of the hardcoded secret can easily forge JWT tokens with arbitrary user IDs (`_id`), enabling total account takeover and administrative privilege escalation.
- **Recommendation:** Replace `"secret"` with `process.env.jwtsecret` across all backend route files.

#### 1.2 Missing Authentication & Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several sensitive administrative endpoints lack session verification or admin privilege checks:
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editDetails/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`
- **Impact:** Any unauthenticated remote user can list, edit, or delete arbitrary user accounts, as well as register new users with administrative routes.
- **Recommendation:** Implement a common authentication/authorization middleware that verifies the JWT cookie and confirms the user has `is_admin: true` before granting access.

#### 1.3 Exposure of Hashed Passwords in User Directory API
- **Location:** `backend/routes/adminroute.js` (line 62 - `GET /users`)
- **Description:** The `/api/admin/users` endpoint executes `User.find({})` and directly returns the raw user documents including `password` hashes to the client.
- **Impact:** Leaking password hashes facilitates offline brute-force or dictionary attacks against user credentials.
- **Recommendation:** Exclude the `password` field from queries using `.select('-password')` or map user objects to remove the password field before sending the response.

### High Severity

#### 1.4 Missing Cross-Site Request Forgery (CSRF) Defenses
- **Location:** `backend/index.js` & frontend HTTP calls
- **Description:** The API uses `httpOnly` authentication cookies with `credentials: true` in CORS, but does not implement CSRF tokens or SameSite cookie restrictions.
- **Impact:** Users visiting malicious sites while logged into the application are vulnerable to CSRF attacks against state-changing POST endpoints (`/deleteUser`, `/editUser`, etc.).
- **Recommendation:** Implement CSRF token validation or configure cookie attributes with appropriate `SameSite` restrictions (`SameSite=Strict` or `SameSite=Lax`).

---

## 2. Logic Errors & Backend Bugs

### High Severity

#### 2.1 Admin Session Hijacking on User Creation
- **Location:** `backend/routes/adminroute.js` (lines 142-146 - `POST /createuser`)
- **Description:** When an administrator creates a new user via `/api/admin/createuser`, the backend signs a new JWT for the *newly created user* and sets it as the `jwt` HTTP cookie on the response.
- **Impact:** The administrator's active session cookie is immediately overwritten with the new user's credentials, effectively logging the admin out and logging them in as the newly created user.
- **Recommendation:** Remove the token generation and cookie-setting logic from administrative user creation routes.

#### 2.2 Unchecked File Upload Property Access
- **Location:** `backend/routes/routes.js` (line 114 - `POST /profile-upload-single`)
- **Description:** The route accesses `req.file.filename` assuming a file was successfully attached by Multer without validating if `req.file` exists.
- **Impact:** Submitting a request without a multipart file payload triggers an unhandled `TypeError: Cannot read property 'filename' of undefined`, leading to server instability or unhandled exceptions.
- **Recommendation:** Validate `if (!req.file)` and return a `400 Bad Request` response before attempting to access `req.file.filename`.

### Medium Severity

#### 2.3 Mongoose Schema Type Mismatch for `is_admin`
- **Location:** `backend/models/user.js` (lines 16-19)
- **Description:** `is_admin` is declared with `type: String` but assigned a default value of boolean `false`. Querying with boolean checks (`is_admin: true`) causes type inconsistencies.
- **Impact:** Queries checking `is_admin: true` may fail or exhibit unexpected behavior depending on how values were stored in MongoDB.
- **Recommendation:** Change `is_admin` type definition in the Mongoose schema to `type: Boolean, default: false`.

#### 2.4 Silent Catch Blocks & Missing Error Responses
- **Location:** `backend/routes/routes.js` & `backend/routes/adminroute.js`
- **Description:** Multiple routes (e.g., `/profile-upload-single`, `/logout`, `/deleteUser/:id`) have empty `catch (error) {}` blocks or fail to return HTTP responses when exceptions occur.
- **Impact:** Requests hang indefinitely on server-side exceptions until client timeouts occur, obscuring error diagnostics.
- **Recommendation:** Add proper error logging and return structured error responses (e.g., status 500 with error details).

---

## 3. Frontend Bugs & UI Issues

### High Severity

#### 3.1 Incorrect `HttpClient.post` Parameter Placement
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (line 39) & `admin-useredit.component.ts` (line 89)
- **Description:** HTTP POST requests pass `{ withCredentials: true }` as the second argument (request body) instead of the third argument (options):
  ```typescript
  // Incorrect:
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
  // Correct:
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, { withCredentials: true })
  ```
- **Impact:** The `withCredentials` option is treated as the JSON body payload rather than request configuration, causing session cookies not to be sent or sending invalid body data.
- **Recommendation:** Pass an empty body `{}` or actual payload as the second parameter and pass `{ withCredentials: true }` as the third parameter.

### Low Severity

#### 3.2 Non-Functional User Search Bar
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input in the user list view is static HTML with no `ngModel`, event listeners, or NgRx selector integration for filtering users.
- **Impact:** Users cannot search or filter the user list.
- **Recommendation:** Bind the search input to a search query state and implement filtering in NgRx selectors or component logic.

#### 3.3 Root Folder Naming Typo
- **Location:** Workspace root (`frondend/`)
- **Description:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Minor repository structure inconsistency.
- **Recommendation:** Rename directory to `frontend/` and update any references or build scripts.

---

## 4. Test Suite Failure Summary

### 4.1 Frontend Unit Test Failures
- **Status:** 12 out of 14 unit tests fail when executed via `./node_modules/.bin/ng test --no-watch --no-progress --browsers=ChromeHeadless`.
- **Primary Root Cause:** Missing Angular testing modules and state providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in component `.spec.ts` files.
- **Recommendation:** Update all component spec files to import required testing modules and provide mock store configurations in `TestBed.configureTestingModule`.

### 4.2 Missing Backend Test Suite
- **Status:** `backend/package.json` contains no test runner or test scripts.
- **Recommendation:** Set up a backend testing framework (e.g., Jest or Mocha/Supertest) and add unit/integration tests for authentication and admin routes.
