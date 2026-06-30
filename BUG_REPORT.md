# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, and frontend issues found in the repository.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` instead of using an environment variable (`process.env.jwtsecret`).
- **Risk:** High. If the secret is exposed, anyone can forge valid JWT tokens.

### 1.2 Missing Authentication/Authorization on Admin Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Most administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack any middleware to verify if the request is coming from an authenticated administrator.
- **Risk:** Critical. Unauthorized users can list, modify, or delete any user in the system.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` -> `/users`
- **Issue:** The endpoint returns the full user document from MongoDB, including the hashed `password` field.
- **Risk:** High. Exposure of password hashes facilitates offline brute-force attacks.

### 1.4 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Issue:** The backend uses cookie-based authentication and allows cross-origin requests from the frontend but does not implement any CSRF (Cross-Site Request Forgery) protection.
- **Risk:** Medium.

---

## 2. Logic Errors

### 2.1 Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` -> `/createuser`
- **Issue:** When an admin creates a new user, the server generates a new JWT for the *created user* and sends it back in a `jwt` cookie.
- **Impact:** This overwrites the administrator's own session cookie, effectively logging them out and logging them in as the new user.

### 2.2 Schema Type Mismatch
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** Inconsistent data types in the database and potential issues with truthiness checks in JavaScript.

### 2.3 Unsafe File Upload
- **Location:** `backend/routes/routes.js` -> `/profile-upload-single`
- **Issue:** The code accesses `req.file.filename` without verifying that `req.file` is defined (i.e., that a file was actually uploaded).
- **Impact:** Server crash (TypeError) if an upload request is made without a file.

---

## 3. Frontend Issues

### 3.1 Misspelled Directory
- **Issue:** The frontend root directory is misspelled as `frondend/`.
- **Impact:** Confusion and non-standard project structure.

### 3.2 Incorrect `HttpClient` Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit/admin-useredit.component.ts`
- **Issue:** `http.post()` is called with request options (like `{ withCredentials: true }`) as the second argument.
- **Correction:** The second argument for `post` is the request body. Options should be the third argument.
- **Impact:** CSRF/Session cookies might not be sent correctly if not handled by interceptors, and the server receives the options object as the request body.

### 3.3 Non-functional Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input is a static HTML element with no event bindings or logic implemented in the component or NgRx store to filter the user list.

---

## 4. Backend Infrastructure

### 4.1 Hardcoded Database Connection
- **Location:** `backend/index.js`
- **Issue:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact:** Difficulty in deploying to different environments (development, staging, production).

### 4.2 Poor Error Handling
- **Location:** Throughout `backend/routes/`
- **Issue:** Many `catch` blocks are empty or only `console.log` the error without sending an error response to the client.
- **Impact:** The frontend may hang or receive a generic success response when a server-side error occurs.

---

## 5. Test Failures

### 5.1 Frontend Unit Tests
- **Status:** 12 out of 14 tests failing.
- **Primary Cause:** `NullInjectorError: No provider for HttpClient!`.
- **Reason:** Most component spec files (`.spec.ts`) do not import or provide `HttpClientTestingModule` or `RouterTestingModule` in their `TestBed` configuration, even though the components depend on these services.
