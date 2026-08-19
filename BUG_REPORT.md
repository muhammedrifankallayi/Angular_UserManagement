# Comprehensive Application Bug Report

## Overview
This bug report documents critical security vulnerabilities, backend logic and schema errors, frontend API and UI bugs, and testing shortcomings identified during a full-codebase audit of the application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Files Affected:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** The JWT secret key is hardcoded as the literal string `"secret"` throughout authentication routes instead of reading from environment variables (`process.env.jwtsecret`).
- **Impact:** Anyone with access to the source code can forge valid JWT tokens and bypass authentication entirely.

### 1.2 Missing Authentication & Authorization Middleware on Admin Routes
- **Files Affected:** `backend/routes/adminroute.js`
- **Issue:** Sensitive administrative endpoints (`/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/editDetails/:id`, `/api/admin/editUser`, `/api/admin/createuser`) lack middleware to verify if the requester is authenticated or possesses administrator privileges.
- **Impact:** Unauthenticated external users can query, edit, create, or delete user accounts via direct API calls.

### 1.3 Exposure of Password Hashes in Admin User List Endpoint
- **Files Affected:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/users` endpoint returns raw user documents from MongoDB without excluding or stripping the `password` field.
- **Impact:** Administrative users (or unauthenticated callers) receive hashed user passwords in HTTP responses.

### 1.4 Admin Session Cookie Overwritten on User Creation
- **Files Affected:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/createuser` endpoint generates a new JWT token for the newly created user and sets it in `res.cookie("jwt", token, ...)`.
- **Impact:** When an admin creates a new user, the admin's session cookie is overwritten with the new user's JWT token, causing the admin to be logged out and impersonated as the new user.

### 1.5 Unhandled File Upload Null/Undefined Reference Crash
- **Files Affected:** `backend/routes/routes.js`
- **Issue:** The `/profile-upload-single` route accesses `req.file.filename` directly without checking if `req.file` exists.
- **Impact:** If a client submits a request without attaching a file, `req.file` is `undefined`, causing a `TypeError`. The route's empty `catch` block suppresses the error and leaves the HTTP request hanging indefinitely without sending an error response.

### 1.6 CSRF Vulnerability & SameSite Cookie Configuration
- **Files Affected:** `backend/index.js`, `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** JWT tokens are stored in cookies with `httpOnly: true`, but `SameSite` flags and CSRF tokens are not configured, while CORS permits credentials for `http://localhost:4200`.
- **Impact:** The application is vulnerable to Cross-Site Request Forgery (CSRF) attacks.

---

## 2. Backend Logic & Schema Errors

### 2.1 Mongoose User Schema Type Mismatch for `is_admin`
- **Files Affected:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as `type: String` with `default: false` (a boolean). In `adminroute.js`, queries search for `{ email: req.body.email, is_admin: true }`.
- **Impact:** Type inconsistency between String and Boolean types in Mongoose schema causes queries for `is_admin` to fail or produce unexpected results.

### 2.2 Suppressed Exceptions and Hanging Requests
- **Files Affected:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** Multiple routes contain empty `catch` blocks (e.g. `adminrouter.post('/logout')`, `adminrouter.post('/deleteUser/:id')`, `router.post('/profile-upload-single')`).
- **Impact:** When exceptions occur, errors are suppressed and no HTTP status code or JSON response is returned to the client, causing client requests to timeout.

### 2.3 Hardcoded MongoDB Connection URI
- **Files Affected:** `backend/index.js`
- **Issue:** MongoDB connection string is hardcoded as `'mongodb://127.0.0.1:27017/jwtproject'` without environment variable fallback.
- **Impact:** Connection configuration cannot be customized across environments (development, staging, production).

### 2.4 Missing Backend Start and Test Scripts
- **Files Affected:** `backend/package.json`
- **Issue:** `package.json` lacks standard npm `start` and `test` scripts.

---

## 3. Frontend Logic & UI Issues

### 3.1 Incorrect HttpClient POST Options Parameter Passing
- **Files Affected:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** In `deleteUser()` and `getusers()`, `http.post` passes `{ withCredentials: true }` as the 2nd argument (request body) instead of the 3rd argument (options). For example:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
  ```
- **Impact:** The options object is sent as the request payload body while cookies are not included in the request because options default to `{ withCredentials: false }`.

### 3.2 Non-Functional Static Search Input
- **Files Affected:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`, `admin-userlist.component.ts`
- **Issue:** The search input element in `admin-userlist.component.html` (`<input type="text" placeholder="Search" class="input">`) has no template bindings (`[(ngModel)]` or `(input)`), and `AdminUserlistComponent` has no filtering logic or selectors implemented for searching users.
- **Impact:** Typing into the user search bar has no effect.

### 3.3 Misspelled Directory Name
- **Directory Affected:** `frondend/`
- **Issue:** The frontend directory is named `frondend/` instead of `frontend/`.
- **Impact:** Non-standard folder structure causes confusion and path discrepancies in scripts.

---

## 4. Testing & Quality Assurance

### 4.1 Missing Backend Test Suite
- **Issue:** No test framework or test cases exist in the backend package.

### 4.2 Frontend Unit Test Failures
- **Files Affected:** Component spec files in `frondend/jwtapp/src/app/components/`
- **Issue:** 12 out of 14 Angular component unit tests fail due to missing dependencies in `TestBed` setups (e.g. `HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Impact:** Automated testing pipelines fail and regression testing is disabled.
