# Bug Report

This document details all security vulnerabilities, logic bugs, architectural/configuration flaws, and test failure issues identified across the application's backend and frontend codebases.

---

## 1. Backend Security Vulnerabilities & Bugs

### BUG-BE-01: Hardcoded JWT Secret Key
- **Severity**: Critical
- **Affected Files**:
  - `backend/routes/routes.js` (lines 38, 59, 70, 93, 115)
  - `backend/routes/adminroute.js` (lines 23, 48, 142)
- **Description**:
  The JWT generation (`jwt.sign`) and verification (`jwt.verify`) methods use a hardcoded plaintext string `"secret"` rather than retrieving the environment secret configured in `backend/.env` (`process.env.jwtsecret`).
- **Impact**:
  Anyone can forge valid JWT tokens for any user ID or admin account without knowing the server's environment configuration.
- **Proposed Fix**:
  Use `process.env.jwtsecret` for signing and verifying tokens across all authentication routes, and ensure a fallback or startup validation ensures the key is defined.

---

### BUG-BE-02: Missing Authentication and Authorization on Administrative Endpoints
- **Severity**: Critical
- **Affected Files**:
  - `backend/routes/adminroute.js` (lines 65-154)
- **Description**:
  Administrative endpoints including:
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editDetails/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`
  do not check the user's JWT cookie or verify administrative privileges (`is_admin: true`). Only `GET /api/admin/active` checks the cookie, but even that endpoint does not check if the user is actually an administrator.
- **Impact**:
  Unauthenticated or non-admin users can list all registered users, delete arbitrary users, edit user information, and create new user accounts.
- **Proposed Fix**:
  Implement an authentication and role-checking middleware (e.g. `verifyAdmin`) that extracts the JWT token, fetches the user record, and asserts `is_admin === true` prior to executing admin route handlers.

---

### BUG-BE-03: Plaintext Password Hash Exposure in User Listing API
- **Severity**: High
- **Affected Files**:
  - `backend/routes/adminroute.js` (lines 65-74)
- **Description**:
  The `GET /api/admin/users` endpoint performs `User.find({})` and directly responds with `res.send(user)` without projecting out the `password` field. The line stripping password was commented out (`// const {password, ...data} = await user.toJSON();`).
- **Impact**:
  Hashed passwords of all users in the database are transmitted over the network and exposed to client-side inspect tools.
- **Proposed Fix**:
  Exclude the password field in the query (`User.find({}, '-password')` or `User.find({}, { password: 0 })`).

---

### BUG-BE-04: Admin Cookie Overwritten Upon User Creation (`/api/admin/createuser`)
- **Severity**: High
- **Affected Files**:
  - `backend/routes/adminroute.js` (lines 144-147)
- **Description**:
  When an admin creates a new user through `POST /api/admin/createuser`, the route creates a token for the newly created user and sets it as the `jwt` cookie in the admin's browser (`res.cookie("jwt", token, ...)`).
- **Impact**:
  The administrator's current session cookie is overwritten with the newly created user's session token, logging the admin out or demoting them to the newly created user.
- **Proposed Fix**:
  Do not set the `jwt` cookie in response to an administrative user creation action. Only return a success response or the created user details.

---

### BUG-BE-05: Unhandled Undefined `req.file` in Profile Image Upload
- **Severity**: Medium
- **Affected Files**:
  - `backend/routes/routes.js` (line 100)
- **Description**:
  In `POST /api/routes/profile-upload-single`, `req.file.filename` is accessed directly without validating whether `req.file` exists.
- **Impact**:
  If a client submits a request without a file or with an improper field name, the server throws an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`.
- **Proposed Fix**:
  Verify `if (!req.file) { return res.status(400).json({ message: 'No file uploaded' }); }` before accessing properties on `req.file`.

---

### BUG-BE-06: Schema Type Inconsistency for `is_admin` Field
- **Severity**: Medium
- **Affected Files**:
  - `backend/models/user.js` (lines 17-20)
  - `backend/routes/adminroute.js` (line 11)
- **Description**:
  The `is_admin` property is defined with `type: String` and `default: false` in the Mongoose schema. In `backend/routes/adminroute.js`, the query checks `is_admin: true` (boolean comparison).
- **Impact**:
  Storing boolean values in a string-typed schema causes unpredictable querying and type mismatches.
- **Proposed Fix**:
  Change `is_admin` type to `Boolean` in `backend/models/user.js`:
  ```javascript
  is_admin: {
    type: Boolean,
    default: false
  }
  ```

---

### BUG-BE-07: Inadequate Error Handling & Silent Catch Blocks
- **Severity**: Medium
- **Affected Files**:
  - `backend/routes/routes.js` (lines 106-108, 122-124)
  - `backend/routes/adminroute.js` (lines 29-31, 39-41, 71-73, 86-88, 101-103, 114-116, 150-152)
- **Description**:
  Many asynchronous route handlers contain empty catch blocks (`catch (error) {}`) or only call `console.log(error.message)` without sending an HTTP response to the client (`res.status(500)...`).
- **Impact**:
  When an error occurs, the HTTP request hangs until client/gateway timeout, leaking connection resources and degrading client performance.
- **Proposed Fix**:
  Ensure all catch blocks return an appropriate error response, e.g., `res.status(500).json({ message: 'Internal server error' })`.

---

### BUG-BE-08: Hardcoded Database Connection String and Missing CSRF Protection
- **Severity**: Medium
- **Affected Files**:
  - `backend/index.js` (lines 8-11, 20-22)
- **Description**:
  The MongoDB connection URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded. CORS is enabled with `credentials: true` for `http://localhost:4200`, but cookies are authenticated without CSRF tokens (SameSite is not explicitly configured and no anti-CSRF measures exist).
- **Impact**:
  Deployments to non-local environments require code edits. Cross-origin requests could potentially exploit cookie-based authentication if SameSite attributes default loosely.
- **Proposed Fix**:
  Move database connection configuration to `process.env.MONGODB_URI`. Configure `sameSite` policy on cookies and implement CSRF protection.

---

## 2. Frontend Bugs & Architectural Flaws

### BUG-FE-01: Incorrect `HttpClient.post` Parameter Signature (Options Passed as Body)
- **Severity**: High
- **Affected Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (lines 40-42)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (lines 75-77)
- **Description**:
  Angular's `HttpClient.post(url, body, options)` expects the request payload as the 2nd parameter and HTTP options (`{ withCredentials: true }`) as the 3rd parameter.
  In `AdminUserlistComponent.deleteUser`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
  And in `AdminUsereditComponent.getusers`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  })
  ```
  The options object is incorrectly passed as the request body with no options argument, causing the request to omit `withCredentials`.
- **Impact**:
  Authentication cookies are not sent with these POST requests, and requests with endpoints expecting parameters or payload fail.
- **Proposed Fix**:
  Pass an empty body `{}` as the 2nd argument and options as the 3rd argument:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, {
    withCredentials: true
  })
  ```
  (Alternatively, use `http.delete` and `http.get` corresponding to semantic REST conventions).

---

### BUG-FE-02: Non-Functional Search Input in User List Component
- **Severity**: Medium
- **Affected Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Description**:
  The search bar `<input type="text" placeholder="Search" class="input">` in `AdminUserlistComponent` is purely static HTML. It has no `[(ngModel)]`, `formControl`, input event bindings, or filtering logic applied to `userdata$`.
- **Impact**:
  Typing in the search input does nothing, failing user expectations for user filtering.
- **Proposed Fix**:
  Bind the search input to a form control or search query subject, and apply filtering logic via NgRx selector or an RxJS pipeline against user records.

---

### BUG-FE-03: Failing Angular Unit Tests Due to Missing Test Providers
- **Severity**: Medium
- **Affected Files**:
  - `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description**:
  Component unit tests generated by Angular CLI configure `TestBed` with only component declarations, omitting dependencies such as `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and `provideMockStore`.
- **Impact**:
  Running `ng test` results in widespread test suite failures with `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
- **Proposed Fix**:
  Import and configure `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and provide mock store implementations in all spec files.

---

### BUG-FE-04: Misspelled Root Directory Name (`frondend`)
- **Severity**: Low
- **Affected Files**:
  - `frondend/`
- **Description**:
  The root directory for the Angular application is named `frondend` instead of `frontend`.
- **Impact**:
  Violates common project conventions and causes confusion for developer onboarding and CI/CD script paths.
- **Proposed Fix**:
  Rename directory from `frondend` to `frontend` (or alias it) and update relevant path references in documentation and build scripts.
