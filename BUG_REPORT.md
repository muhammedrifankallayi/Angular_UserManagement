# Bug Report & Security Audit Findings

This document outlines the identified security vulnerabilities, backend/frontend logic errors, database schema inconsistencies, UI/UX issues, and test suite failures within the application codebase.

---

## 1. Security Vulnerabilities

### BUG-SEC-01: Hardcoded JWT Secret Key
* **Location**: `backend/routes/routes.js` (lines 35, 59, 71, 99, 119) & `backend/routes/adminroute.js` (lines 20, 41)
* **Severity**: Critical
* **Description**: JWT tokens are signed and verified using a hardcoded string literal `"secret"` rather than retrieving the environment variable `process.env.jwtsecret` (configured in `backend/.env`).
* **Impact**: Anyone with access to the source code can easily forge arbitrary JWT tokens, bypass authentication, and impersonate any user or admin account.
* **Remediation**: Replace all instances of `"secret"` with `process.env.jwtsecret`.

### BUG-SEC-02: Missing Authentication and Authorization Middleware on Admin Endpoints
* **Location**: `backend/routes/adminroute.js`
* **Severity**: Critical
* **Description**: The following administrative endpoints lack JWT authentication and admin role (`is_admin`) validation middleware:
  * `GET /api/admin/users`
  * `POST /api/admin/deleteUser/:id`
  * `POST /api/admin/editDetails/:id`
  * `POST /api/admin/editUser`
  * `POST /api/admin/createuser`
* **Impact**: Unauthenticated users or regular non-admin users can access, modify, create, or delete user accounts directly via API endpoints.
* **Remediation**: Implement authentication/authorization middleware that verifies the user's JWT token and validates that `is_admin` is set to `true` before granting access to these routes.

### BUG-SEC-03: Sensitive Password Hash Exposure in Admin API
* **Location**: `backend/routes/adminroute.js` (lines 53-61)
* **Severity**: High
* **Description**: The `GET /api/admin/users` endpoint executes `User.find({})` and directly returns the full user records to the client, including hashed passwords (`password` property).
* **Impact**: Hashed user passwords are exposed over the network, making user accounts vulnerable to offline password cracking attacks.
* **Remediation**: Exclude the `password` field from the database query projection (e.g., `User.find({}, '-password')`) or omit `password` prior to sending the response payload.

### BUG-SEC-04: Admin Session Hijacked/Overwritten on User Creation
* **Location**: `backend/routes/adminroute.js` (lines 130-134)
* **Severity**: High
* **Description**: When an administrator creates a new user via `POST /api/admin/createuser`, the route creates a JWT token for the *newly created user* and sets it as the HTTP `jwt` cookie (`res.cookie("jwt", token)`).
* **Impact**: Creating a user automatically overwrites the administrator's active session cookie with the newly created user's token, effectively logging out the administrator.
* **Remediation**: Remove the `res.cookie("jwt", token)` call from `POST /api/admin/createuser`.

### BUG-SEC-05: CSRF Vulnerability on Cookie-Based Authentication
* **Location**: `backend/index.js`
* **Severity**: Medium
* **Description**: The application uses `cookie-parser` and stores JWTs in HTTP cookies with CORS `credentials: true` allowed for `http://localhost:4200`. However, no CSRF mitigation mechanisms (e.g., Anti-CSRF tokens or strict `SameSite` cookie flags) are implemented.
* **Impact**: Cross-site request forgery attacks can be launched against logged-in users.
* **Remediation**: Set `SameSite: 'Strict'` or `'Lax'` on JWT cookies and implement CSRF prevention headers/tokens for state-changing endpoints.

---

## 2. Logic & Runtime Errors

### BUG-LOG-01: Incorrect Angular `HttpClient.post` Options Parameter Placement
* **Location**:
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (lines 35-37)
  * `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (lines 80-82)
* **Severity**: High
* **Description**: In Angular's `HttpClient.post(url, body, options)` signature, request options (like `{ withCredentials: true }`) must be supplied as the 3rd argument. In these components, `{ withCredentials: true }` is passed as the 2nd argument (the `body`).
* **Impact**: Cookies are not transmitted with these POST requests, causing authorization failures on the backend. In addition, `{ withCredentials: true }` is sent as payload data.
* **Remediation**: Pass a valid body (or `{}` if empty) as the 2nd parameter and `{ withCredentials: true }` as the 3rd parameter: `this.http.post(url, {}, { withCredentials: true })`.

### BUG-LOG-02: Unhandled Null File Payload in Single File Upload
* **Location**: `backend/routes/routes.js` (line 93)
* **Severity**: Medium
* **Description**: Endpoint `POST /api/profile-upload-single` accesses `req.file.filename` directly without verifying whether `req.file` exists.
* **Impact**: Requests sent to this endpoint without a file attachment cause a `TypeError: Cannot read property 'filename' of undefined` which crashes or hangs the route handler.
* **Remediation**: Add validation: `if (!req.file) { return res.status(400).json({ message: 'No file uploaded' }); }`.

### BUG-LOG-03: Mongoose Schema Type Mismatch for `is_admin` Field
* **Location**: `backend/models/user.js` (line 15)
* **Severity**: Medium
* **Description**: In the `userSchema`, `is_admin` is defined with type `String` (`type: String`), but has a boolean default value (`default: false`). In `adminroute.js`, queries check `{ is_admin: true }` (boolean).
* **Impact**: Inconsistent field typing can lead to unexpected query behavior, type casting issues, or failed lookups when checking admin status.
* **Remediation**: Change the schema definition to `type: Boolean, default: false`.

### BUG-LOG-04: Poor Error Handling and Suppressed Exceptions
* **Location**: `backend/routes/routes.js` & `backend/routes/adminroute.js`
* **Severity**: Medium
* **Description**: Multiple `try/catch` blocks in backend routes (e.g., `profile-upload-single`, `logout`, `deleteUser`) have empty `catch` blocks or only `console.log` errors without sending an HTTP response to the client.
* **Impact**: When errors occur, HTTP requests hang indefinitely until timing out, degrading user experience and client application stability.
* **Remediation**: Implement proper error responses in `catch` blocks, e.g., `res.status(500).json({ message: 'Server error', error: error.message })`.

---

## 3. Frontend & UI Issues

### BUG-UI-01: Non-Functional Search Input Field
* **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
* **Severity**: Low
* **Description**: The user list template contains a search input field (`<input type="text" placeholder="Search" class="input">`) that lacks data binding (`[(ngModel)]`), event listeners, or supporting logic in `AdminUserlistComponent` or NgRx selectors.
* **Impact**: Searching functionality displayed in the UI does not filter user records.
* **Remediation**: Implement a search term state/signal, template binding, and an NgRx filter selector to filter the user list dynamically.

### BUG-UI-02: Misspelled Root Directory Name
* **Location**: Root directory (`frondend/`)
* **Severity**: Low
* **Description**: The directory containing the Angular client application is named `frondend` instead of `frontend`.
* **Impact**: Inconsistent naming convention across project documentation, scripts, and build environments.
* **Remediation**: Rename directory from `frondend` to `frontend` and update references if necessary.

---

## 4. Testing & Maintenance Issues

### BUG-TEST-01: Angular Unit Test Suite Failures
* **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Severity**: Medium
* **Description**: Running Angular unit tests (`ng test`) results in failures across component specs due to missing mock providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
* **Impact**: Automated unit tests cannot run or pass, hindering CI/CD pipelines and regression testing.
* **Remediation**: Update component `.spec.ts` files to configure `TestBed` with necessary testing modules (`HttpClientTestingModule`, `RouterTestingModule`) and `provideMockStore()`.

### BUG-TEST-02: Missing Backend Test Suite
* **Location**: `backend/package.json`
* **Severity**: Low
* **Description**: The backend package configuration lacks automated unit or integration tests (`"test": "echo \"Error: no test specified\" && exit 1"`).
* **Impact**: API route changes cannot be validated automatically.
* **Remediation**: Introduce a testing framework (such as Jest or Supertest) and write API endpoint unit/integration tests.
