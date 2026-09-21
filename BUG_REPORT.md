# Bug Report & Vulnerability Analysis

This document provides a comprehensive report on security vulnerabilities, logic errors, architectural flaws, and test failures identified across the backend and frontend components of the application.

---

## 1. Backend Issues

### 1.1 Security Vulnerabilities (High / Critical)
1. **Hardcoded Secret Key for JWT Signing and Verification**
   - **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
   - **Description:** JWTs are signed and verified using the string literal `"secret"` (e.g., `jwt.sign({_id: user._id}, "secret")`) instead of using environment variables such as `process.env.jwtsecret`.
   - **Impact:** Attackers who inspect the source code can easily forge arbitrary JWT tokens and hijack any user or admin account.
   - **Fix:** Replace `"secret"` with `process.env.jwtsecret` (or `process.env.JWT_SECRET`) across all authentication endpoints.

2. **Missing Authentication and Authorization Middleware on Admin Routes**
   - **Location:** `backend/routes/adminroute.js`
   - **Description:** Endpoints such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editUser`, `POST /api/admin/editDetails/:id`, and `POST /api/admin/createuser` do not perform JWT verification or verify whether the requester is an administrator (`is_admin: true`).
   - **Impact:** Unauthenticated users or non-admin users can access, modify, delete user records, or create new users arbitrarily.
   - **Fix:** Add authentication middleware (`verifyToken` / `verifyAdmin`) to all administrative routes in `adminroute.js`.

3. **Exposure of Password Hashes in User List Endpoint**
   - **Location:** `backend/routes/adminroute.js` (Endpoint: `GET /api/admin/users`)
   - **Description:** The `GET /users` route returns raw Mongoose user documents (`res.send(user)`), which includes the hashed `password` field for all users in the database.
   - **Impact:** Exposes password hashes to API clients, increasing the risk of offline brute-force attacks if intercepted or leaked.
   - **Fix:** Exclude password fields from query results (e.g., `User.find({}, { password: 0 })`) or strip `password` from the JSON response before sending.

4. **CORS Credentials Allowed Without CSRF Protection**
   - **Location:** `backend/index.js`
   - **Description:** `cors({ credentials: true, origin: ['http://localhost:4200'] })` is enabled alongside `cookie-parser` for authentication, but no anti-CSRF token mechanisms (e.g., SameSite cookies or CSRF tokens) are implemented.
   - **Impact:** Malicious websites running on the user's browser could make cross-origin requests to sensitive endpoints using stored cookies.
   - **Fix:** Set appropriate `SameSite` flags (`Strict` or `Lax`) on session cookies and/or implement CSRF token validation middleware.

---

### 1.2 Logic & Schema Errors (Medium)
1. **Admin Session Hijacking on User Creation**
   - **Location:** `backend/routes/adminroute.js` (Endpoint: `POST /api/admin/createuser`)
   - **Description:** When an admin creates a user via `/api/admin/createuser`, the server generates a new JWT token for the *newly created user* and overwrites the active session cookie (`res.cookie("jwt", token)`).
   - **Impact:** Creating a user immediately logs the admin out and signs them in as the newly created user.
   - **Fix:** Remove cookie generation (`res.cookie("jwt", token)`) from the `/createuser` administrative handler.

2. **Mongoose Schema Type Mismatch for `is_admin`**
   - **Location:** `backend/models/user.js`
   - **Description:** `is_admin` is defined as `type: String` with `default: false` (a boolean literal).
   - **Impact:** Inconsistent data types in MongoDB and querying errors (e.g., comparing string vs boolean).
   - **Fix:** Update schema definition in `backend/models/user.js` to `type: Boolean, default: false`.

3. **Unhandled Missing File Exception in Single Upload Endpoint**
   - **Location:** `backend/routes/routes.js` (Endpoint: `POST /profile-upload-single`)
   - **Description:** Accesses `req.file.filename` directly without verifying if `req.file` exists.
   - **Impact:** Submitting a request without an attached file triggers an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')` and causes 500 Internal Server Errors or silent failures.
   - **Fix:** Check `if (!req.file)` and return a 400 Bad Request HTTP status code with an appropriate message.

4. **Empty Catch Blocks and Suppressed Errors**
   - **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
   - **Description:** Multiple routes (e.g., `/deleteUser/:id`, `/logout`, `/profile-upload-single`) use empty `catch (error) {}` blocks or log to console without sending error responses to the HTTP client.
   - **Impact:** API requests hang indefinitely until timeout or fail silently without feedback.
   - **Fix:** Implement proper error handling in `catch` blocks and return HTTP status `500` with descriptive error payloads.

---

## 2. Frontend Issues

### 2.1 Logic & API Usage Errors (Medium)
1. **Incorrect `HttpClient.post` Request Option Formatting**
   - **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
   - **Description:** `this.http.post(url, { withCredentials: true })` passes options as the second parameter (`body`) instead of the third parameter (`options`).
   - **Impact:** Requests are sent with `{ withCredentials: true }` in the POST body while the actual HTTP request options miss `withCredentials: true`, causing cookie header exclusion on cross-origin requests.
   - **Fix:** Change signature to `this.http.post(url, body, { withCredentials: true })` (e.g., `this.http.post(url, {}, { withCredentials: true })`).

2. **Non-Functional Static Search Input in User List Component**
   - **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
   - **Description:** The search input `<input type="text" placeholder="Search" class="input">` is non-functional static HTML and lacks event bindings, Angular reactive forms / `ngModel`, or NgRx state selectors for filtering.
   - **Impact:** Users cannot search or filter users in the admin dashboard.
   - **Fix:** Bind search input to a search query property / subject and implement filtering logic in the component or NgRx selectors.

3. **Misspelled Directory Name**
   - **Location:** Root directory
   - **Description:** The frontend application directory is named `frondend` instead of `frontend`.
   - **Impact:** Causes developer confusion and potential CI/CD script path failures.
   - **Fix:** Rename directory from `frondend` to `frontend` and update references in deployment/CI scripts.

---

## 3. Frontend Unit Test Failures

### 3.1 Test Suite Status
Running `./node_modules/.bin/ng test --no-watch --no-progress --browsers=ChromeHeadless` inside `frondend/jwtapp/` results in **12 out of 14 failing specs**.

### 3.2 Root Causes & Failures
1. **Missing Angular Test Providers (`NullInjectorError`)**
   - **Components Affected:** `AppComponent`, `AdminLoginComponent`, `AdminNavComponent`, `AdminUsereditComponent`, `AdminUserlistComponent`, `DashboardComponent`, `HomeComponent`, `LoginComponent`, `NavComponent`, `ProfileComponent`, `RegisterComponent`.
   - **Errors:** `NullInjectorError: No provider for HttpClient!` and `NullInjectorError: No provider for Router!`.
   - **Cause:** Spec files (`*.spec.ts`) configure `TestBed.configureTestingModule({...})` without importing `HttpClientTestingModule` or `RouterTestingModule`.
   - **Fix:** Import and include `HttpClientTestingModule` and `RouterTestingModule` in `imports` of `TestBed.configureTestingModule`.

2. **Missing NgRx Mock Store Provider**
   - **Components Affected:** `AdminUserlistComponent`, `DashboardComponent`, `HomeComponent`, `ProfileComponent`.
   - **Errors:** `NullInjectorError: No provider for Store!`.
   - **Cause:** Spec files do not provide the NgRx `Store`.
   - **Fix:** Provide `provideMockStore({})` from `@ngrx/store/testing` in `providers` for affected component specs.
