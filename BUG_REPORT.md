# Bug Report & Security Audit

This document details all security vulnerabilities, logic bugs, code errors, and architectural issues identified across the application repository.

---

## Executive Summary
The application is a full-stack project consisting of a **Node.js/Express** backend and an **Angular 16** frontend (with NgRx for state management). A thorough audit revealed multiple critical security vulnerabilities (hardcoded JWT secrets, sensitive data exposure, unauthenticated administrative endpoints), logical defects (cookie overwriting on user creation, incorrect HTTP request options passing in Angular), and missing error handling.

---

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secrets
* **Location:** `backend/routes/routes.js` (lines 35, 58, 70, 94, 120) and `backend/routes/adminroute.js` (lines 24, 42)
* **Severity:** High
* **Issue:** The application uses a hardcoded string `"secret"` to sign and verify JSON Web Tokens (JWT) instead of retrieving the secret from environment variables (`process.env.jwtsecret`), despite `dotenv` being imported and `.env` being present.
* **Impact:** Anyone with knowledge of the repository or source code can forge arbitrary JWT tokens and gain unauthorized access to any account.

### 1.2. Missing Authentication & Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Severity:** Critical
* **Issue:** Administrative endpoints including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication or admin-check middleware.
* **Impact:** Any unauthenticated user can access, modify, list, or delete user records and create new accounts via these endpoints.

### 1.3. Sensitive Data Exposure (Password Hash Leak)
* **Location:** `backend/routes/adminroute.js` (`/users` route)
* **Severity:** High
* **Issue:** The `/users` endpoint returns raw MongoDB user documents directly via `res.send(user)` without stripping password hashes.
* **Impact:** User password hashes (`bcrypt` hashes) are publicly exposed in API responses.

### 1.4. Missing CSRF Protection & Permissive CORS Configuration
* **Location:** `backend/index.js`
* **Severity:** Medium
* **Issue:** The application configures `cors` with `credentials: true` for `http://localhost:4200` and relies on `httpOnly` cookies for authentication without implementing Cross-Site Request Forgery (CSRF) protection or SameSite cookie attributes.
* **Impact:** Susceptible to CSRF attacks if cross-origin requests are triggered from authenticated sessions.

---

## 2. Backend Logic Bugs & Defects

### 2.1. Admin Cookie Overwrite on User Creation
* **Location:** `backend/routes/adminroute.js` (`/createuser` route)
* **Severity:** Medium
* **Issue:** When an administrator creates a new user via `/api/admin/createuser`, the backend signs a JWT for the *new user* and sets a new `jwt` cookie in the response.
* **Impact:** Creation of a user immediately overwrites the administrator's authentication cookie, effectively logging out the admin or switching their session context to the newly created user.

### 2.2. Unchecked File Upload Property Access
* **Location:** `backend/routes/routes.js` (`/profile-upload-single` route)
* **Severity:** Medium
* **Issue:** In `router.post('/profile-upload-single')`, `req.file.filename` is accessed directly without verifying if `req.file` exists.
* **Impact:** Sending a request without a file payload throws an uncaught `TypeError: Cannot read properties of undefined (reading 'filename')`.

### 2.3. Schema Type Mismatch (`is_admin`)
* **Location:** `backend/models/user.js`
* **Severity:** Low
* **Issue:** The `is_admin` field in the Mongoose schema is declared as `type: String` with a default value of `false` (boolean).
* **Impact:** Queries checking `is_admin: true` or boolean comparisons may produce inconsistent results due to type coercion issues between String and Boolean types in MongoDB/Mongoose.

### 2.4. Silent Exception Handling & Missing Responses
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Severity:** Medium
* **Issue:** Multiple routes (e.g., `/profile-upload-single`, `/deleteUser/:id`) have empty `catch` blocks or catch errors without sending an HTTP response back to the client.
* **Impact:** Requests failing server-side will hang until timeout, leading to poor client application responsiveness and difficult debugging.

### 2.5. Hardcoded Database Connection String
* **Location:** `backend/index.js`
* **Severity:** Low
* **Issue:** The MongoDB URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of being loaded from environment configuration (`process.env.MONGODB_URI`).

---

## 3. Frontend Bugs & Defects

### 3.1. Incorrect Parameter Ordering in HttpClient Requests
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
* **Severity:** High
* **Issue:** `HttpClient.post()` calls pass request options (`{ withCredentials: true }`) as the second argument instead of the third argument (e.g. `this.http.post('...', { withCredentials: true })`).
* **Impact:** Angular sends `{ withCredentials: true }` as the JSON request payload/body while omitting request options, causing requests to fail or send invalid data to the backend.

### 3.2. Static / Non-Functional Search Input Field
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Severity:** Low
* **Issue:** The search input box in the Admin User List view is static HTML and lacks two-way binding (`[(ngModel)]`), event listeners, or NgRx state integration for filtering users.

### 3.3. Typo in Root Directory Name
* **Location:** Repository root
* **Severity:** Low
* **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.

---

## 4. Test Suite & Dependency Findings

### 4.1. Failing Angular Unit Tests
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Severity:** Medium
* **Issue:** 12 out of 14 unit test specs fail due to missing test module providers (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx Mock Store).
* **Fix Required:** Add `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` to `TestBed` setup in component `.spec.ts` files.

### 4.2. Missing Backend Test Framework
* **Location:** `backend/package.json`
* **Severity:** Low
* **Issue:** The backend project has no unit or integration test suite configured in `scripts.test`.
