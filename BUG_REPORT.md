# Application Bug & Vulnerability Report

## Executive Summary
This report documents security vulnerabilities, logical flaws, component errors, and test suite failures discovered during a comprehensive code audit of the application repository. The application consists of a Node.js/Express backend (`backend/`) and an Angular 16 frontend (`frondend/jwtapp/`).

---

## 1. Backend Issues (`backend/`)

### 1.1 Security Vulnerabilities

#### 1.1.1 Missing Authentication & Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Description:** Administrative endpoints including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` do not perform JWT authentication or verify if the requesting user possesses administrator privileges (`is_admin: true`).
- **Impact:** Any unauthenticated client or standard user can execute admin-level operations (listing all users, editing user details, deleting user accounts, or creating new accounts).

#### 1.1.2 Hardcoded Secret Keys in JWT Operations
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** JWT generation (`jwt.sign`) and verification (`jwt.verify`) hardcode the string literal `"secret"` instead of loading `process.env.jwtsecret` from the environment.
- **Impact:** Hardcoded secrets compromise token security and prevent secret rotation in production environments.

#### 1.1.3 Password Exposure in API Output
- **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
- **Description:** The `/users` route returns the complete user database objects directly via `res.send(user)` without stripping out the `password` field (bcrypt hash).
- **Impact:** Exposes password hashes of all registered users to any caller of the API.

#### 1.1.4 Missing Anti-CSRF Protection
- **Location:** `backend/index.js`
- **Description:** The server accepts requests with credentials (`credentials: true`) from `http://localhost:4200` via cookies but implements no CSRF mitigation mechanisms (such as SameSite attribute configurations or CSRF token validation).
- **Impact:** Vulnerable to Cross-Site Request Forgery attacks if state-changing GET/POST endpoints rely solely on HTTP-only cookies.

---

### 1.2 Logic Errors & Implementation Deficiencies

#### 1.2.1 Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
- **Description:** When an administrator creates a new user via `/createuser`, the route generates a new JWT for the newly created user and sets it in the response cookie (`res.cookie("jwt", token)`).
- **Impact:** Overwrites the administrator's active session cookie, logging out the admin and replacing their session with the newly created user account.

#### 1.2.2 Schema Type Mismatch for Admin Flag
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field in the User Mongoose schema is declared with `type: String` while having `default: false` (a boolean).
- **Impact:** Creates type inconsistencies when querying or comparing `is_admin` values (e.g. `is_admin: true` vs `"true"` vs `false`).

#### 1.2.3 Unsafe Property Access on File Upload
- **Location:** `backend/routes/routes.js` (`POST /api/profile-upload-single`)
- **Description:** Accesses `req.file.filename` directly without checking whether `req.file` exists.
- **Impact:** If a client sends a request without an attached file, the application throws an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')` and crashes or fails silently.

#### 1.2.4 Faulty Deletion Check
- **Location:** `backend/routes/adminroute.js` (`POST /api/admin/deleteUser/:id`)
- **Description:** Checks `if (!deleteUser)` to detect failure. However, Mongoose `deleteOne()` returns an acknowledgment object `{ acknowledged: true, deletedCount: ... }`, so `!deleteUser` always evaluates to `false`.
- **Impact:** Fails to properly notify clients when a requested user ID does not exist or deletion fails.

#### 1.2.5 Suppressed Exceptions & Missing Client Responses
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Numerous routes contain empty `catch (error) {}` blocks or log error messages via `console.log(error.message)` without sending an HTTP response to the client.
- **Impact:** Requests that encounter errors hang indefinitely on the client side until timing out.

#### 1.2.6 Environment Configuration & Package Scripts
- **Location:** `backend/index.js` and `backend/package.json`
- **Description:**
  - MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of read from environment variables.
  - `backend/package.json` lacks standard `start` and `test` scripts.

---

## 2. Frontend Issues (`frondend/jwtapp/`)

### 2.1 HTTP Client Request Option Placement Errors
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description:** The Angular `HttpClient.post()` signature is `post(url, body, options)`. In these methods, `{ withCredentials: true }` is passed as the **second** parameter (the body) instead of the **third** parameter (options):
  ```typescript
  // Incorrect
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
  ```
- **Impact:** The request payload becomes `{ withCredentials: true }` while HTTP options default to empty, preventing credentials/cookies from being transmitted to the backend.

---

### 2.2 Unimplemented UI Features
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The user search input `<input type="text" placeholder="Search" class="input">` is plain static HTML. It lacks `ngModel`, reactive form controls, or event bindings, and no filtering logic exists in the component ts file or NgRx selectors.
- **Impact:** Search bar is completely non-functional for end users.

---

### 2.3 Unit Test Suite Failures
- **Location:** Component spec files (`*.component.spec.ts`) across `frondend/jwtapp/src/app/`
- **Description:** 12 out of 14 Angular component test specs fail during execution due to incomplete `TestBed` module setup. Components require dependencies (`HttpClient`, `Router`, `FormBuilder`, NgRx Store) that are not provided in spec configurations.
- **Errors Encountered:**
  - `NullInjectorError: No provider for HttpClient!`
  - `NullInjectorError: No provider for Router!`
  - `NullInjectorError: No provider for Store!`
- **Remediation Required:** Import `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and `provideMockStore()` in test suite setups.

---

### 2.4 Directory Naming Flaw
- **Location:** Project Root
- **Description:** The frontend folder is misspelled as `frondend/` instead of `frontend/`.
- **Impact:** Confusing directory structure and potential pathing issues in multi-repository toolings or CI/CD scripts.

---

## 3. Remediation Summary & Recommendations

1. **Security Hardening:**
   - Implement authentication (`jwt.verify`) and admin role checking middleware for all `/api/admin/*` routes.
   - Refactor all JWT calls to use `process.env.jwtsecret`.
   - Exclude sensitive fields (`password`) from JSON serialization in user list endpoints.
2. **Backend Robustness:**
   - Correct `is_admin` schema type in `User` model to `Boolean`.
   - Fix `createuser` endpoint to prevent overwriting admin cookies.
   - Guard file upload route with `req.file` presence checks.
   - Return proper HTTP status codes (400, 401, 404, 500) in all catch blocks.
3. **Frontend Fixes:**
   - Fix `HttpClient.post` calls to properly pass options in the 3rd parameter.
   - Implement search filtering logic connected to the search input.
   - Update all `spec.ts` files with `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()`.
   - Rename `frondend/` to `frontend/`.
