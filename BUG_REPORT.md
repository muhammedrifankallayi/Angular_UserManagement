# Comprehensive Bug Report

This document outlines the security vulnerabilities, backend logic errors, frontend defect issues, and testing/environment problems identified within the application repository.

---

## 1. Security Vulnerabilities

### 1.1. Hardcoded Secret Key for JWT Token Signing and Verification
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Issue:** Authentication tokens are signed and verified using the hardcoded string `"secret"` instead of reading from environment configuration (`process.env.jwtsecret` / `process.env.JWT_SECRET`).
* **Impact:** Anyone with access to the source code can forge valid JWT session tokens and impersonate any user or admin.
* **Recommendation:** Use `process.env.jwtsecret` consistently across all JWT signing (`jwt.sign`) and verification (`jwt.verify`) operations.

### 1.2. Missing Authentication & Authorization Middleware on Admin Endpoints
* **Location:** `backend/routes/adminroute.js`
* **Issue:** Administrative API endpoints—including `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, and `POST /api/admin/editUser`—do not perform JWT verification or role checks.
* **Impact:** Unauthenticated users can perform administrative actions, view user lists, edit user details, or delete accounts directly via API requests.
* **Recommendation:** Implement an authentication and authorization middleware that validates the JWT cookie and verifies the user has administrative privileges before handling requests.

### 1.3. Sensitive Password Field Exposure in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Issue:** The `/api/admin/users` endpoint returns raw user documents (`User.find({})`), including hashed `password` strings.
* **Impact:** Hashed user passwords are exposed in HTTP responses, increasing risk in case of data interception or unauthorized access.
* **Recommendation:** Exclude the `password` field from user query results using Mongoose projection (`User.find({}, '-password')`) or omit the password property before returning data.

---

## 2. Backend Logic & Architecture Issues

### 2.1. Admin Session Overwrite Upon User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Issue:** When an admin creates a new user, the backend signs a JWT token for the newly created user and attaches it to `res.cookie("jwt", token)`.
* **Impact:** The logged-in administrator's cookie session is overwritten with the newly created user's session token.
* **Recommendation:** Remove `res.cookie("jwt", token)` from the admin create user route so the admin's session cookie remains intact.

### 2.2. Schema Type Mismatch for `is_admin` Field
* **Location:** `backend/models/user.js`
* **Issue:** The `is_admin` property is defined as `type: String` with `default: false` (a boolean literal).
* **Impact:** Inconsistent data typing in MongoDB where string and boolean types can lead to query anomalies or unexpected evaluation behavior in checks like `is_admin: true`.
* **Recommendation:** Update the Mongoose schema definition for `is_admin` to `type: Boolean, default: false`.

### 2.3. Unhandled Null Check on Single Profile Picture Upload
* **Location:** `backend/routes/routes.js` (`POST /api/profile-upload-single`)
* **Issue:** The code accesses `req.file.filename` without verifying if `req.file` exists.
* **Impact:** If a request is sent without a file attachment, accessing `req.file.filename` throws an unhandled `TypeError` ("Cannot read properties of undefined"), causing server errors or unhandled rejections.
* **Recommendation:** Validate `req.file` before attempting to access `req.file.filename` and return an appropriate HTTP 400 response if no file was uploaded.

### 2.4. Hardcoded Database Connection String
* **Location:** `backend/index.js`
* **Issue:** The MongoDB URI is hardcoded as `'mongodb://127.0.0.1:27017/jwtproject'`.
* **Impact:** Inflexibility across different deployment environments (staging, production, Docker).
* **Recommendation:** Move database connection credentials and URIs to environment variables (e.g., `process.env.MONGODB_URI`).

### 2.5. Silent Error Handling & Missing Client Responses
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Issue:** Catch blocks in multiple handlers (e.g., `adminrouter.post('/logout')`, `adminrouter.post('/deleteUser/:id')`, `router.post('/profile-upload-single')`) are either empty or fail to return HTTP error responses (`res.status(500)`).
* **Impact:** Requests hang or fail silently without providing meaningful error feedback to the client.
* **Recommendation:** Implement proper error handling in all `try/catch` blocks and return appropriate HTTP status codes and error messages.

---

## 3. Frontend Bugs & Defect Issues

### 3.1. Incorrect Request Options Parameter in `HttpClient.post` Calls
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit/admin-useredit.component.ts`
* **Issue:** `HttpClient.post()` expects parameters in the order `(url, body, options)`. In `deleteUser()` and `getusers()`, `{ withCredentials: true }` is passed as the second argument (`body`).
* **Impact:** The request body is sent as `{ withCredentials: true }`, while HTTP options (including actual credentials flags) remain default.
* **Recommendation:** Update `HttpClient.post` calls to pass `null` or `{}` as the body (2nd argument) and `{ withCredentials: true }` as options (3rd argument), e.g., `this.http.post(url, {}, { withCredentials: true })`.

### 3.2. Non-functional Search Input Component
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Issue:** The search input `<input type="text" placeholder="Search" class="input">` is purely static HTML without `ngModel`, event listeners, or NgRx filter state integration.
* **Impact:** Typing into the search bar has no effect on filtering the displayed user list.
* **Recommendation:** Bind the search input to a component property/event handler or NgRx action to dynamically filter the displayed user list.

### 3.3. Misspelled Frontend Root Directory
* **Location:** Root directory (`frondend/`)
* **Issue:** The frontend directory is named `frondend` instead of `frontend`.
* **Impact:** Inconsistency with standard project conventions and potential confusion for developers or CI/CD build scripts.
* **Recommendation:** Rename `frondend/` to `frontend/` and update any references or build scripts accordingly.

---

## 4. Testing & Environment Issues

### 4.1. Missing Backend Test Suite
* **Location:** `backend/package.json`
* **Issue:** The test script is set to `"test": "echo \"Error: no test specified\" && exit 1"`.
* **Impact:** Backend API routes, authentication logic, and controllers lack automated unit and integration tests.
* **Recommendation:** Introduce testing framework dependencies (e.g., Jest or Mocha/Chai with Supertest) and write test cases for authentication and admin API endpoints.

### 4.2. Angular Unit Test Failures
* **Location:** `frondend/jwtapp/src/app/` component spec files
* **Issue:** Running `ng test` results in widespread spec failures (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx Store providers).
* **Impact:** Automated testing suite cannot run or pass, hindering CI/CD verification and quality assurance.
* **Recommendation:** Update `TestBed.configureTestingModule` across spec files to import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
