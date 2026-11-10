# Bug Report

This document outlines the security vulnerabilities, logic errors, architectural flaws, and test suite issues identified across the application codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
* **Locations**:
  * `backend/routes/routes.js` (lines 33, 56, 68, 92, 112)
  * `backend/routes/adminroute.js` (lines 25, 49, 137)
* **Description**:
  The application uses the hardcoded string `"secret"` for signing and verifying JSON Web Tokens (JWT) instead of loading the secret from environment variables (`process.env.jwtsecret`).
* **Impact**:
  Anyone inspecting the codebase or knowing the default secret can forge authentication tokens for any user or administrator.
* **Recommendation**:
  Use `process.env.jwtsecret` (or `process.env.JWT_SECRET`) consistently across all token generation and verification endpoints, ensuring fallback handling or fatal startup errors if not defined.

---

### 1.2 Missing Authentication and Authorization on Sensitive Admin Endpoints
* **Locations**:
  * `backend/routes/adminroute.js`:
    * `/api/admin/users` (GET)
    * `/api/admin/deleteUser/:id` (POST)
    * `/api/admin/editDetails/:id` (POST)
    * `/api/admin/editUser` (POST)
    * `/api/admin/createuser` (POST)
* **Description**:
  Only `/api/admin/active` checks the JWT cookie. The administrative routes (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not verify the JWT cookie or check if the requesting user has administrator privileges (`is_admin: true`).
* **Impact**:
  Any unauthenticated user or external caller can view all registered users, delete users, modify user details, and create new users.
* **Recommendation**:
  Implement an authentication and admin-authorization middleware (e.g. `verifyAdmin`) to validate the JWT and verify `is_admin` status before executing admin handlers.

---

### 1.3 Exposure of Sensitive Password Hashes in API Responses
* **Locations**:
  * `backend/routes/adminroute.js` (`/api/admin/users`)
* **Description**:
  The `/api/admin/users` endpoint returns the full user documents via `User.find({})` without projecting out or stripping the `password` field:
  ```javascript
  const user = await User.find({})
  res.send(user)
  ```
* **Impact**:
  All user password hashes (bcrypt hashes) are exposed to anyone calling the endpoint.
* **Recommendation**:
  Exclude the password field either via projection `User.find({}, { password: 0 })` or by mapping and stripping passwords before sending the response.

---

### 1.4 Hardcoded Database Connection String
* **Locations**:
  * `backend/index.js` (line 21)
* **Description**:
  The MongoDB connection URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded in `backend/index.js`.
* **Impact**:
  Prevents environment-specific database configuration and risks leaking credentials if changed to authenticated connection strings in code.
* **Recommendation**:
  Load the database connection URI from environment variables (e.g., `process.env.MONGODB_URI`).

---

### 1.5 Missing CSRF Protection
* **Locations**:
  * `backend/index.js`
* **Description**:
  The application uses cookies (`res.cookie('jwt', ...)` with `credentials: true` in CORS) for authentication across cross-origin requests, but does not implement CSRF tokens or `SameSite` cookie protections (such as `SameSite: 'Strict'` or `SameSite: 'Lax'`).
* **Impact**:
  Vulnerable to Cross-Site Request Forgery (CSRF) attacks where malicious third-party websites can perform actions on behalf of authenticated users.
* **Recommendation**:
  Implement CSRF protection (e.g., using `csurf` or double-submit cookies) and configure cookie options (`sameSite: 'lax'` or `'strict'`).

---

## 2. Backend Logic and Runtime Bugs

### 2.1 Schema Type Inconsistency for `is_admin`
* **Locations**:
  * `backend/models/user.js` (lines 16-19)
  * `backend/routes/adminroute.js` (line 10)
* **Description**:
  In `backend/models/user.js`, `is_admin` is declared as:
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
  However, `backend/routes/adminroute.js` queries `User.findOne({ email: req.body.email, is_admin: true })` using a boolean. Mongoose schema casting between `String` and `Boolean` can lead to inconsistent behavior or query failures.
* **Recommendation**:
  Change `is_admin` to `type: Boolean, default: false` in the Mongoose schema.

---

### 2.2 Admin `createuser` Overwrites Admin's JWT Session Cookie
* **Locations**:
  * `backend/routes/adminroute.js` (lines 135-144)
* **Description**:
  When an administrator creates a new user via `/api/admin/createuser`, the backend generates a JWT for the newly created user and sets it as the `jwt` cookie on the response:
  ```javascript
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{ ... })
  ```
* **Impact**:
  The administrator's browser session cookie is replaced with the newly created non-admin user's token, effectively logging the admin out.
* **Recommendation**:
  Do not issue a JWT cookie when creating a user from the admin panel.

---

### 2.3 Unhandled Missing File in Single Profile Upload
* **Locations**:
  * `backend/routes/routes.js` (lines 88-105)
* **Description**:
  In `/profile-upload-single`, `req.file.filename` is accessed directly without verifying whether `req.file` exists:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
* **Impact**:
  If a client submits a request without a file or with an incorrect field name, `req.file` is `undefined`, causing an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`.
* **Recommendation**:
  Validate `if (!req.file) { return res.status(400).send({ message: 'No file uploaded' }); }` before accessing properties.

---

### 2.4 Silent Empty Catch Blocks and Inadequate Error Responses
* **Locations**:
  * `backend/routes/routes.js` (catch blocks)
  * `backend/routes/adminroute.js` (catch blocks in `/login`, `/logout`, `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
* **Description**:
  Several endpoints feature empty `catch (error) {}` blocks or `console.log(error.message)` without returning an HTTP error response to the client. For instance, in `/deleteUser/:id`, if an exception occurs, the request hangs until client timeout.
* **Recommendation**:
  Implement proper centralized error handling or return standard error status codes (e.g. `res.status(500).json({ error: error.message })`).

---

## 3. Frontend Logic and UI Bugs

### 3.1 Incorrect HttpClient.post Argument Order
* **Locations**:
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (lines 42-44)
  * `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (lines 82-84)
* **Description**:
  In Angular's `HttpClient`, `post` signature is `post(url, body, options)`. In `AdminUserlistComponent`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
  Here, `{ withCredentials: true }` is passed as the `body` parameter (2nd argument) instead of the `options` parameter (3rd argument). Thus, `withCredentials` is not enabled on the HTTP request. The same issue exists in `AdminUsereditComponent.getusers()`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  })
  ```
* **Impact**:
  Credentials (cookies) may not be sent with these POST requests, and the options object is sent as the request payload.
* **Recommendation**:
  Pass `null` or `{}` as the second argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

---

### 3.2 Non-Functional Search Input
* **Locations**:
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
* **Description**:
  The admin user list template contains an `<input type="text" placeholder="Search" class="input">` element, but it is not bound via `[(ngModel)]` or reactive forms, and there is no search or filtering logic implemented in the component or NgRx selectors.
* **Impact**:
  Typing in the search box has no effect.
* **Recommendation**:
  Implement search query state and filter users based on name or email in the NgRx store or component.

---

### 3.3 Misspelled Directory Name
* **Locations**:
  * Root folder: `frondend/` instead of `frontend/`
* **Description**:
  The frontend Angular project is located under `frondend/jwtapp/`.
* **Impact**:
  Causes confusion for developers and standard tooling/scripts expecting `frontend/`.
* **Recommendation**:
  Rename `frondend/` to `frontend/` (or update documentation/scripts accordingly).

---

## 4. Test Suite and Build Issues

### 4.1 Missing Unit Tests in Backend
* **Locations**:
  * `backend/package.json`
* **Description**:
  The backend has no test framework installed (such as Jest, Mocha, or Supertest) and `npm test` outputs `"Error: no test specified"`.
* **Recommendation**:
  Add a testing framework (e.g. Jest and Supertest) and write integration tests for authentication and admin routes.

---

### 4.2 Frontend Unit Test Failures (NullInjectorError)
* **Locations**:
  * `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description**:
  Angular unit tests fail across 12 component test suites due to `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
  The test setup in `TestBed.configureTestingModule` does not import `HttpClientTestingModule`, `RouterTestingModule`, or provide `provideMockStore()`.
* **Impact**:
  Running `ng test` results in failing test suites across almost all components.
* **Recommendation**:
  Update component spec files to include:
  - `HttpClientTestingModule` in `imports`
  - `RouterTestingModule` in `imports`
  - `FormsModule` and `ReactiveFormsModule` where applicable
  - `provideMockStore()` in `providers` for components injecting NgRx `Store`.
