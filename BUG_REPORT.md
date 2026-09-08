# Comprehensive Bug Report

This bug report details security vulnerabilities, logic errors, data model issues, frontend bugs, architectural defects, and test failures identified across the repository.

---

## 1. Security Vulnerabilities & Authentication Flaws

### 1.1 Hardcoded JWT Secret Key
- **Severity**: High
- **Affected Files**: `backend/routes/routes.js` (lines 31, 56, 73, 107, 127), `backend/routes/adminroute.js` (lines 20, 52)
- **Description**: The JWT signing and verification code uses the hardcoded string `"secret"` instead of referencing the environment variable `process.env.jwtsecret`.
- **Impact**: Anyone with access to the source code or common dictionary secrets can forge valid JWT tokens and bypass authentication entirely.
- **Recommendation**: Replace string literal `"secret"` with `process.env.jwtsecret` in all `jwt.sign` and `jwt.verify` calls, ensuring `.env` is properly configured and loaded.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Severity**: Critical
- **Affected Files**: `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`)
- **Description**: Administrative endpoints do not verify the JWT cookie or check whether the requesting user is an administrator (`is_admin`).
- **Impact**: Any unauthenticated user or unauthorized user can view all users, delete users, or modify user details simply by sending HTTP requests to these endpoints.
- **Recommendation**: Create an authentication and authorization middleware (e.g., `verifyAdminToken`) and apply it to all administrative routes in `adminroute.js`.

### 1.3 Sensitive Data Exposure (Passwords Returned in User List)
- **Severity**: High
- **Affected Files**: `backend/routes/adminroute.js` (`GET /users`)
- **Description**: The `/users` endpoint executes `User.find({})` and directly returns all user documents without excluding the `password` hash field.
- **Impact**: User password hashes are exposed to any party querying the user list endpoint.
- **Recommendation**: Selectively omit the password field using Mongoose query projection `User.find({}).select('-password')` or filter out `password` prior to sending the HTTP response.

### 1.4 Hardcoded MongoDB Connection URI
- **Severity**: Medium
- **Affected Files**: `backend/index.js`
- **Description**: Mongoose connects to `mongodb://127.0.0.1:27017/jwtproject` using a hardcoded string instead of reading from `process.env.MONGO_URI` or environment configuration settings.
- **Impact**: Prevents environment-specific database configuration and exposes database connection details.
- **Recommendation**: Move database URI string into `.env` (e.g., `process.env.MONGO_URI`).

---

## 2. Backend Logic Errors & Exception Handling

### 2.1 Admin Session Overwrite During User Creation
- **Severity**: High
- **Affected Files**: `backend/routes/adminroute.js` (`POST /createuser`)
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the newly created user and attaches it to the response cookie (`res.cookie("jwt", token)`).
- **Impact**: Creating a user causes the administrator's active session cookie to be overwritten by the newly created user's token, logging out the administrator.
- **Recommendation**: Remove the `res.cookie` invocation from the admin user creation handler.

### 2.2 Unhandled File Upload Exception (Missing `req.file` Check)
- **Severity**: Medium
- **Affected Files**: `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Description**: The profile picture upload endpoint attempts to access `req.file.filename` directly. If a client sends a request without a file attachment, `req.file` is `undefined`, causing a runtime TypeError (`Cannot read property 'filename' of undefined`).
- **Impact**: Requests without file payloads result in uncaught server exceptions or hanging responses.
- **Recommendation**: Add a check `if (!req.file) { return res.status(400).send({ message: "No file uploaded" }); }`.

### 2.3 Suppressed Exceptions and Missing Client Responses
- **Severity**: Medium
- **Affected Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Several routes contain empty `catch (error) {}` blocks (e.g., `/profile-upload-single` in `routes.js`, `/deleteUser/:id` in `adminroute.js`, `/logout` in `adminroute.js`) or fail to send error responses to the client when exceptions occur.
- **Impact**: Errors fail silently, causing HTTP requests to hang until client timeouts occur without informative feedback.
- **Recommendation**: Implement proper error handling in `catch` blocks that returns appropriate HTTP status codes (e.g., `500 Internal Server Error`) and logs error messages.

### 2.4 Data Type Mismatch in Mongoose User Model
- **Severity**: Low
- **Affected Files**: `backend/models/user.js`
- **Description**: The `is_admin` property in the user schema is defined as `type: String` with `default: false` (a boolean literal).
- **Impact**: Type inconsistency when querying or storing boolean flags versus string values.
- **Recommendation**: Update `is_admin` schema definition to `type: Boolean, default: false`.

---

## 3. Frontend Bugs & Architectural Defects

### 3.1 Misspelled Frontend Root Directory Name
- **Severity**: Low
- **Affected Files**: `frondend/` (Repository root)
- **Description**: The frontend root directory is named `frondend` instead of `frontend`.
- **Impact**: Confusing project structure and potential build/script path breakage.
- **Recommendation**: Rename directory `frondend` to `frontend`.

### 3.2 Incorrect `HttpClient.post` Options Argument Signatures
- **Severity**: High
- **Affected Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: Calls to `http.post` pass options (`{ withCredentials: true }`) as the second argument (`body`) rather than the third argument (`options`). For example: `http.post(url, { withCredentials: true })` instead of `http.post(url, body, { withCredentials: true })`.
- **Impact**: Requests send `{ withCredentials: true }` as the request body payload while leaving HTTP request options without `withCredentials`, causing cookie/session transmission issues.
- **Recommendation**: Pass empty object or body payload as second argument and request options as third argument: `http.post(url, {}, { withCredentials: true })`.

### 3.3 Non-Functional Search Input Component
- **Severity**: Medium
- **Affected Files**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The user list search input element (`<input type="text" placeholder="Search" class="input">`) is purely static HTML and lacks two-way data binding (`[(ngModel)]`), event bindings (`(input)`), or NgRx state filtering logic.
- **Impact**: Users cannot search or filter the user list.
- **Recommendation**: Implement search model state, filter selectors, or component filtering logic.

---

## 4. Test Infrastructure Issues

### 4.1 Absence of Backend Test Suite
- **Severity**: Medium
- **Affected Files**: `backend/package.json`
- **Description**: The backend package lacks automated unit or integration test scripts.
- **Impact**: Code changes in the backend cannot be validated through automated CI/CD pipelines.
- **Recommendation**: Introduce a testing framework (e.g., Jest or Mocha/Chai) and test scripts in `backend/package.json`.

### 4.2 Frontend Unit Test Failures
- **Severity**: High
- **Affected Files**:
  - `frondend/jwtapp/src/app/app.component.spec.ts`
  - `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description**: Running Angular unit tests results in multiple spec failures (12 out of 14 failing) due to `NullInjectorError: No provider for HttpClient!` and `No provider for Router!` as well as missing NgRx Store mock declarations in test bed configurations.
- **Impact**: Unit tests fail when executed.
- **Recommendation**: Update `TestBed.configureTestingModule` in component spec files to import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
