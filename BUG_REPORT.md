# Bug Report - JWT Authentication Application

This bug report provides a comprehensive overview of security vulnerabilities, logic errors, UI/UX issues, and testing/infrastructure deficiencies identified across the backend and frontend components of the project.

---

## 1. Security Vulnerabilities

### 1.1 Unprotected Administrative Endpoints (Missing Auth & Authorization Middleware)
- **Location:** `backend/routes/adminroute.js`
- **Severity:** Critical
- **Affected Endpoints:**
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editDetails/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`
- **Description:** None of the administrative endpoints verify if the incoming request comes from an authenticated user or an administrator. There is no auth middleware applied.
- **Impact:** Any unauthenticated actor or regular user can view, edit, delete, or create user records by making direct API requests.
- **Remediation:** Implement an authentication and role-checking middleware (e.g., verifying the JWT cookie and confirming `is_admin === true`) and apply it across all protected administrative routes.

### 1.2 Sensitive Data Exposure (Password Hashes Leaked)
- **Location:** `backend/routes/adminroute.js` (lines 83-88)
- **Severity:** High
- **Description:** In `GET /api/admin/users`, the handler queries `User.find({})` and directly returns the entire user list without stripping or excluding the `password` field. The exclusion code (`// const {password, ...data} = await user.toJSON();`) is commented out.
- **Impact:** User hashed passwords (bcrypt hashes) are exposed to client-side consumers, increasing the risk of offline dictionary and brute-force attacks.
- **Remediation:** Project out or exclude the password field (e.g., `User.find({}, '-password')` or map to remove `password` before returning data).

### 1.3 Administrator Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (lines 172-177)
- **Severity:** High
- **Description:** When an administrator creates a new user via `POST /api/admin/createuser`, the endpoint signs a JWT for the newly created user and sets it in the `jwt` cookie via `res.cookie('jwt', token)`.
- **Impact:** The administrator's active session cookie is overwritten with the new user's credentials, terminating the admin session and logging the administrator in as the newly created user.
- **Remediation:** Remove `jwt.sign` and `res.cookie("jwt", ...)` from the `createuser` administrative endpoint so the admin's existing session remains intact.

### 1.4 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js` (lines 40, 60, 72, 107, 126), `backend/routes/adminroute.js` (lines 25, 60, 173)
- **Severity:** High
- **Description:** JSON Web Tokens are signed and verified using a hardcoded literal string `"secret"` instead of loading a secure key from `process.env`.
- **Impact:** Anyone with source code access can forge valid JWT tokens for any user or administrator account, completely bypassing authentication.
- **Remediation:** Read the secret key from environment variables (e.g. `process.env.JWT_SECRET` or `process.env.jwtsecret`) and configure defaults in a `.env` file that is excluded from version control.

### 1.5 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Severity:** Medium
- **Description:** The backend accepts cookie-based authentication (`jwt` cookie) with `credentials: true` from the Angular application on `http://localhost:4200`, but lacks Cross-Site Request Forgery (CSRF / XSRF) token validation or SameSite cookie settings.
- **Impact:** Malicious sites visited by an authenticated user could make unauthorized requests on the user's behalf.
- **Remediation:** Configure `SameSite: 'strict'` or `'lax'` on authentication cookies and implement CSRF protection middleware (such as `csurf` or Double Submit Cookie strategy).

---

## 2. Logic & Data Model Errors

### 2.1 Inconsistent `is_admin` Field Type Definition
- **Location:** `backend/models/user.js` (lines 17-20)
- **Severity:** Medium
- **Description:** In the Mongoose schema for `user`, `is_admin` is typed as `String`, yet its default value is set to a boolean `false`. Furthermore, query logic in `adminroute.js` searches with `{ is_admin: true }` (boolean).
- **Impact:** Mongoose type casting issues or string comparisons (e.g., `"false"` being truthy in JavaScript) can cause unexpected behavior or authorization bypasses.
- **Remediation:** Update the schema definition in `backend/models/user.js` to `type: Boolean, default: false`.

### 2.2 Incorrect Angular `HttpClient.post` Parameter Order
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (line 44)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (line 104)
- **Severity:** High
- **Description:** Angular's `HttpClient.post(url, body, options)` expects the request body as the second argument and options as the third. In both files, `this.http.post(url, { withCredentials: true })` passes `{ withCredentials: true }` as the request body rather than options.
- **Impact:** Options are not applied, meaning session cookies (`withCredentials`) are not sent with these requests. Additionally, the backend receives `{ withCredentials: true }` as the body.
- **Remediation:** Pass an empty body as the second argument: `this.http.post(url, {}, { withCredentials: true })`.

### 2.3 Unhandled File Upload Without File Presence Check
- **Location:** `backend/routes/routes.js` (lines 104-121)
- **Severity:** Medium
- **Description:** In `/profile-upload-single`, `req.file.filename` is accessed directly without verifying if `req.file` exists.
- **Impact:** If a request is sent without a file attached, accessing `req.file.filename` throws an unhandled exception (`TypeError: Cannot read properties of undefined`).
- **Remediation:** Add a check `if (!req.file) { return res.status(400).send({ message: "No file uploaded" }); }` before accessing properties on `req.file`.

### 2.4 Inadequate Error Handling and Silent Catch Blocks
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Severity:** Medium
- **Description:** Multiple routes feature empty catch blocks or catch blocks that only log to `console.log(error.message)` without returning an HTTP response to the client (e.g., `/deleteUser/:id`, `/createuser`, `/editUser`, `/logout`, `/profile-upload-single`).
- **Impact:** If an unhandled exception occurs, the HTTP connection is left hanging until client-side timeout, providing no feedback to the user or caller.
- **Remediation:** Always return standard HTTP error responses (e.g., `res.status(500).json({ error: error.message })`) in all catch blocks.

---

## 3. UI/UX Issues

### 3.1 Non-functional Search Bar in Admin User List
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Severity:** Low
- **Description:** The search input `<input type="text" placeholder="Search" class="input">` in `AdminUserlistComponent` has no event bindings (`ngModel`, `(input)`, or `formControl`) and is not integrated with the component state or NgRx store.
- **Impact:** Typing in the search input does nothing, failing user expectations for search functionality.
- **Remediation:** Bind input events or a FormControl to filter the user list observable (`userdata$`) based on search queries.

### 3.2 Directory Misspelling
- **Location:** Project Root (`frondend/` vs `frontend/`)
- **Severity:** Low
- **Description:** The frontend application directory is named `frondend` instead of `frontend`.
- **Impact:** Non-standard folder naming hurts maintainability and developer ergonomics.
- **Remediation:** Rename `frondend/` to `frontend/` and update any documentation or tooling references.

---

## 4. Testing & Infrastructure Issues

### 4.1 Missing Backend Test Scripts and Tests
- **Location:** `backend/package.json`
- **Severity:** Medium
- **Description:** `backend/package.json` does not include a `test` script or any automated test framework (such as Jest, Mocha, or Supertest).
- **Impact:** Backend API routes, authentication logic, and database operations cannot be automatically tested or verified in CI pipelines.
- **Remediation:** Introduce a test framework and define automated integration tests for authentication and user management routes.

### 4.2 Missing Backend Start Script
- **Location:** `backend/package.json`
- **Severity:** Low
- **Description:** The `scripts` object in `backend/package.json` lacks a `"start"` script (`"node index.js"`).
- **Impact:** Running `npm start` in the `backend` directory fails.
- **Remediation:** Add `"start": "node index.js"` to `backend/package.json`.

### 4.3 Broken Angular Frontend Unit Tests
- **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Severity:** High
- **Description:** Running Angular unit tests (`ng test --no-watch --browsers=ChromeHeadless`) results in 12 out of 14 tests failing. The primary errors are `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing Store providers.
- **Impact:** Automated regression testing on the frontend is completely non-functional.
- **Remediation:** Import `HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, `ReactiveFormsModule`, and `provideMockStore()` in the `TestBed.configureTestingModule` setup of each affected component spec.
