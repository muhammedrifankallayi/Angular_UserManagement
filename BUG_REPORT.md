# Bug Report & System Vulnerability Audit

This report documents identified bugs, security vulnerabilities, logic errors, and testing/architectural deficiencies across the project codebase.

---

## Table of Contents
1. [Backend Security Vulnerabilities](#1-backend-security-vulnerabilities)
2. [Backend Logic & Stability Issues](#2-backend-logic--stability-issues)
3. [Frontend Bugs & UI Defects](#3-frontend-bugs--ui-defects)
4. [Testing & Build Infrastructure Gaps](#4-testing--build-infrastructure-gaps)
5. [Summary of Recommendations](#5-summary-of-recommendations)

---

## 1. Backend Security Vulnerabilities

### 1.1. Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** JWT generation and token verification use a hardcoded string literal `"secret"` (e.g., `jwt.sign({ _id: user._id }, "secret")` and `jwt.verify(cookie, "secret")`) instead of utilizing environment variables (e.g., `process.env.jwtsecret`).
- **Impact:** High. Hardcoded secrets committed to source control compromise token signatures and allow unauthorized token forging.

### 1.2. Missing Authentication & Authorization Middleware on Admin Routes
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack cookie/JWT authentication checks and administrator role validation middleware.
- **Impact:** Critical. Any unauthenticated user or external caller can view, edit, or delete arbitrary user records without authentication.

### 1.3. Exposure of Sensitive Hashed Password Data
- **Location:** `backend/routes/adminroute.js` (`GET /users`)
- **Description:** `User.find({})` returns all user documents without excluding the `password` hash field (`res.send(user)`).
- **Impact:** High. Exposes sensitive hashed credentials of all registered users over the API.

### 1.4. Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
- **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route issues `res.cookie("jwt", token)` containing the *newly created user's ID*.
- **Impact:** Medium. Creating a user immediately overwrites the administrator's active session cookie, logging the admin out or hijacking their session as the newly created user.

### 1.5. Absence of CSRF Protection
- **Location:** `backend/index.js`
- **Description:** CORS is configured with `credentials: true` for `http://localhost:4200`, relying solely on HttpOnly cookies for authentication without Anti-CSRF tokens or strict `SameSite` cookie policies.
- **Impact:** Medium. Users may be vulnerable to Cross-Site Request Forgery attacks if interacting with malicious third-party sites.

---

## 2. Backend Logic & Stability Issues

### 2.1. Unhandled File Upload Exception in Profile Picture Route
- **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Description:** The route accesses `req.file.filename` directly without checking if `req.file` exists.
- **Impact:** Medium. Submitting a request without an attached file throws an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`, leading to server crashes or unhandled 500 errors.

### 2.2. Suppressed Errors and Empty Catch Blocks
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Multiple try-catch blocks contain empty `catch (error) {}` blocks or logs errors to console without sending an HTTP error response back to the client.
- **Impact:** Medium. Leads to hanging HTTP requests that time out on the client side when exceptions occur.

### 2.3. Mongoose Schema Type Mismatch for `is_admin`
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is typed as `String` in the Mongoose schema (`type: String, default: false`), while default values and query filters treat it as a `Boolean` (e.g. `is_admin: true`).
- **Impact:** Low. Causes type confusion during Mongoose queries and serialization.

---

## 3. Frontend Bugs & UI Defects

### 3.1. Directory Naming Misspelling
- **Location:** Repository root
- **Description:** The frontend application directory is named `frondend/` instead of `frontend/`.
- **Impact:** Low. Developer confusion and non-standard project structure.

### 3.2. Incorrect Argument Signatures in `HttpClient.post()`
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser()`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers()`)
- **Description:** `HttpClient.post(url, body, options)` is called with request options `{ withCredentials: true }` as the second argument (`body`) instead of the third argument (`options`), e.g.:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
  ```
- **Impact:** High. Sends `{ withCredentials: true }` as HTTP request body while omitting request configuration options, potentially dropping cookie header credentials.

### 3.3. Static Non-Functional Search Bar
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The user list view contains a search input field (`<input type="text" placeholder="Search" class="input">`) that has no `[(ngModel)]`, event bindings, or state selector filtering attached in `admin-userlist.component.ts`.
- **Impact:** Low/Medium. Non-functional UI element visible to end users.

---

## 4. Testing & Build Infrastructure Gaps

### 4.1. Failing Angular Unit Tests
- **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description:** Unit test suite fails (12 of 14 specs failing) primarily due to missing provider imports in `TestBed` setup:
  - `NullInjectorError: No provider for HttpClient!`
  - `NullInjectorError: No provider for Router!`
  - Missing NgRx Mock Store initialization (`provideMockStore`).
- **Impact:** High. Prevents reliable CI/CD test execution and automated regression checking.

### 4.2. Missing Backend Start & Test Scripts
- **Location:** `backend/package.json`
- **Description:** No `start` script or test suite configuration is defined in `backend/package.json`.
- **Impact:** Low. Standard runner commands (`npm test`, `npm start`) fail or are absent for backend services.

---

## 5. Summary of Recommendations

1. **Security:** Implement a centralized authentication and admin authorization middleware for all administrative routes. Replace hardcoded JWT secret with `process.env.jwtsecret`. Exclude `password` from `GET /users` responses. Remove JWT cookie setting from `/api/admin/createuser`.
2. **Backend Robustness:** Add null checks for `req.file` in file upload endpoints. Implement proper HTTP error responses in all catch blocks. Fix `is_admin` schema type to `Boolean`.
3. **Frontend Fixes:** Correct parameter positions in `HttpClient.post` calls. Implement search filter logic in `AdminUserlistComponent`. Rename `frondend/` to `frontend/`.
4. **Testing:** Update frontend unit test spec files to import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`. Add backend test scripts.
