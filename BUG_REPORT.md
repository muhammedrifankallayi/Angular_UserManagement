# Comprehensive Bug Report

This document details all identified bugs, security vulnerabilities, logical flaws, architectural defects, and test failures in the full-stack JWT application.

---

## Table of Contents
1. [Security Vulnerabilities](#1-security-vulnerabilities)
2. [Backend Logic & Route Defects](#2-backend-logic--route-defects)
3. [Frontend Logic & Component Defects](#3-frontend-logic--component-defects)
4. [Testing & Quality Assurance Issues](#4-testing--quality-assurance-issues)
5. [Architecture & Configuration Inconsistencies](#5-architecture--configuration-inconsistencies)
6. [Summary Matrix & Remediation Priority](#6-summary-matrix--remediation-priority)

---

## 1. Security Vulnerabilities

### SEC-01: Administrative Endpoints Missing Authentication & Authorization Middleware
- **Severity**: Critical
- **Location**: `backend/routes/adminroute.js` (lines 62–148)
- **Description**: The administrative routes (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not verify whether an incoming request has a valid JWT cookie or if the requester has administrative privileges (`is_admin: true`). Only `/active` and `/login` check credentials.
- **Impact**: Any unauthenticated user or external client can list all users, read user details, create new users, modify user names, or delete user accounts simply by sending HTTP requests to these endpoints.
- **Remediation**: Create an Express authentication and role-checking middleware (e.g., `authenticateAdmin`) that verifies the JWT token and ensures the user exists and has `is_admin === true`. Attach this middleware to all `/api/admin/*` endpoints.

### SEC-02: Hardcoded JWT Secret Key
- **Severity**: Critical
- **Location**:
  - `backend/routes/routes.js` (lines 35, 59, 71, 95, 115)
  - `backend/routes/adminroute.js` (lines 24, 46, 137)
- **Description**: The JWT signing and verification calls hardcode the secret key string `"secret"` instead of reading from environment variables:
  ```js
  const token = jwt.sign({ _id: user._id }, "secret");
  const claims = jwt.verify(cookie, "secret");
  ```
  Although `dotenv.config()` is called and `.env` contains `jwtsecret="secret"`, `process.env.jwtsecret` is never referenced.
- **Impact**: The secret key is publicly exposed in source control. Anyone with repository access can forge valid JWT tokens for arbitrary user IDs and gain unauthorized access as any user or admin.
- **Remediation**: Use `process.env.jwtsecret` (or a standardized `process.env.JWT_SECRET`) across all JWT sign and verify operations. Ensure an error is thrown if the environment variable is not defined.

### SEC-03: Sensitive Password Hashes Exposed in Admin User List Endpoint
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (lines 62–71)
- **Description**: In the `/users` endpoint:
  ```js
  adminrouter.get('/users', async (req, res) => {
    try {
      const user = await User.find({});
      // const {password, ...data} = await user.toJSON();
      console.log(user);
      res.send(user);
    } catch (error) { ... }
  });
  ```
  The code querying `User.find({})` does not exclude the `password` field (bcrypt hash). The commented-out destructuring line would not work on an array of Mongoose documents anyway.
- **Impact**: Bcrypt password hashes of all registered users and administrators are exposed over the network, making them vulnerable to offline dictionary/rainbow table attacks.
- **Remediation**: Query users with projection `User.find({}, '-password')` or `.select('-password')`.

### SEC-04: Unhandled File Uploads in Profile Picture Endpoint
- **Severity**: Medium
- **Location**: `backend/routes/routes.js` (lines 92–110)
- **Description**: In `/profile-upload-single`, `upload.single('image')` is used, but the route handler assumes `req.file` is always defined:
  ```js
  const updateimg = await User.updateOne(
    { _id: claims._id },
    { $set: { image: req.file.filename } }
  );
  ```
  If a client submits a request without an attached file or with an invalid field name, `req.file` is `undefined`, causing `TypeError: Cannot read properties of undefined (reading 'filename')`.
  Furthermore, `multer({ dest: './file' })` lacks file type validation (mimetype check), file size limits, and sanitization of file extensions.
- **Impact**: Server throws an uncaught exception (swallowed by an empty catch block), fails silently without an HTTP response, and allows uploading arbitrary file formats into `./file`.
- **Remediation**: Check `if (!req.file) return res.status(400).send({ message: "No file uploaded" });`. Configure `multer` with file filter validation for allowed MIME types (e.g., `image/jpeg`, `image/png`) and set reasonable file size limits.

### SEC-05: Missing Cross-Site Request Forgery (CSRF) Protection
- **Severity**: Medium
- **Location**: `backend/index.js`
- **Description**: The backend enables credentials via CORS for `http://localhost:4200` and stores session tokens in HTTP cookies (`jwt`) with `httpOnly: true`. However, it does not set `SameSite` flags (e.g., `sameSite: 'strict'` or `sameSite: 'lax'`) nor does it employ CSRF tokens (such as `csurf` or custom header checks).
- **Impact**: Attackers could potentially induce a user's browser to execute state-changing requests against `/api` or `/api/admin` endpoints via CSRF.
- **Remediation**: Configure cookies with `sameSite: 'lax'` or `'strict'`, and implement standard CSRF protection tokens or anti-CSRF headers.

---

## 2. Backend Logic & Route Defects

### BE-01: Admin Create User Route Overwrites Administrator Session Cookie
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (lines 110–147)
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the route creates the new user, generates a new JWT token for that newly created user ID, and sets it in the response cookie:
  ```js
  const token = jwt.sign({ _id: _id }, "secret");
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  });
  ```
- **Impact**: As soon as an administrator adds a new user, the admin's own authentication cookie is overwritten with the new user's credentials. The administrator is immediately downgraded to regular user permissions or logged out of the admin panel on subsequent requests.
- **Remediation**: Remove `jwt.sign` and `res.cookie` from `/createuser`. Return the created user object or a simple success message `{ message: "User created successfully" }`.

### BE-02: User Schema `is_admin` Field Has Type Inconsistency
- **Severity**: Medium
- **Location**: `backend/models/user.js` (lines 15–18)
- **Description**: In `userSchema`:
  ```js
  is_admin: {
    type: String,
    default: false
  }
  ```
  The schema defines `is_admin` with type `String`, but assigns the boolean `false` as its default value. Additionally, `backend/routes/adminroute.js` queries for users with `{ is_admin: true }` (boolean).
- **Impact**: In Mongoose, casting booleans to strings results in `"false"` or `"true"`. Strict equality checks and query match behaviors can become inconsistent or fail depending on whether string `"true"` or boolean `true` is saved.
- **Remediation**: Change `type: String` to `type: Boolean` in `backend/models/user.js`.

### BE-03: Empty Catch Blocks Silently Suppress Exceptions
- **Severity**: Medium
- **Location**:
  - `backend/routes/routes.js`: lines 108–110
  - `backend/routes/adminroute.js`: lines 39–41, 57–59, 83–85, 105–107
- **Description**: Multiple routes catch exceptions without returning any HTTP response or logging the error:
  ```js
  } catch (error) {
  }
  ```
  For example, in `/deleteUser/:id` and `/profile-upload-single`, if an error occurs, the request never receives a response and hangs indefinitely until client timeout.
- **Impact**: Unhandled exceptions hang client HTTP connections, resulting in poor user experience, resource leaks, and untraceable server-side failures.
- **Remediation**: Implement structured error handling that logs errors (`console.error(error)`) and sends appropriate HTTP responses (e.g., `res.status(500).json({ message: "Internal server error" })`).

### BE-04: Edit Details Endpoint Uses POST Instead of GET
- **Severity**: Low
- **Location**: `backend/routes/adminroute.js` (lines 73–87)
- **Description**: The `/editDetails/:id` route is defined as `adminrouter.post('/editDetails/:id', ...)` but performs a read-only query (`User.findOne({ _id: req.params.id })`) to fetch user information.
- **Impact**: Violates RESTful conventions, complicates API caching, and causes confusion between fetching and mutating data.
- **Remediation**: Change route method to `GET` (`/editDetails/:id` or `/user/:id`).

---

## 3. Frontend Logic & Component Defects

### FE-01: `HttpClient.post` Parameter Mismatch in Admin Components
- **Severity**: High
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (lines 37–49)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (lines 74–86)
- **Description**: In Angular's `HttpClient`, `post` signature is:
  `post(url: string, body: any | null, options?: {...})`
  In `deleteUser` and `getusers`, the options object `{ withCredentials: true }` is passed as the second argument (the `body`), while the options parameter is left blank:
  ```typescript
  // admin-userlist.component.ts
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  });

  // admin-useredit.component.ts
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  });
  ```
- **Impact**: The HTTP request sends `{ withCredentials: true }` as the JSON request body, but does NOT send cookies with the request (`withCredentials` option is false by default in options). Consequently, authentication cookies are not transmitted.
- **Remediation**: Pass `null` or `{}` as the body and provide options as the 3rd argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true });
  // Or better, convert to http.delete and http.get respectively
  ```

### FE-02: Non-Functional Search Input in User List
- **Severity**: Low
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Description**:
  ```html
  <input type="text" placeholder="Search" class="input">
  ```
  The search input is static HTML. There is no `ngModel`, `FormControl`, or event binding (`(input)`) attached to it, and no search action or filter selector implemented in NgRx state or component logic.
- **Impact**: Users cannot search or filter the user list despite the UI showing a search input.
- **Remediation**: Bind the input via Reactive Forms or `(keyup)`, and create a filtered selector in `app.selectors.ts` based on search query state.

---

## 4. Testing & Quality Assurance Issues

### QA-01: All Frontend Component Unit Tests Fail Due to Missing Test Providers
- **Severity**: High
- **Location**: `frondend/jwtapp/src/app/**/*.spec.ts` (12 component spec files)
- **Description**: Every component unit test (`AdminUserlistComponent`, `LoginComponent`, `RegisterComponent`, `ProfileComponent`, etc.) sets up `TestBed.configureTestingModule` with only `declarations: [ComponentName]`. None of them provide:
  - `HttpClientTestingModule` (for components injecting `HttpClient`)
  - `RouterTestingModule` (for components injecting `Router` or `ActivatedRoute`)
  - `provideMockStore` (for NgRx Store injections)
  - `FormBuilder` / `ReactiveFormsModule` (for forms)
  - Service mocks (e.g. `appService`)
- **Impact**: Running `npm test` causes 12 out of 14 unit tests to crash with `NullInjectorError: No provider for HttpClient!`, `NullInjectorError: No provider for Router!`, etc.
- **Remediation**: Update test bed configurations across all `.spec.ts` files to import `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and mock store providers.

### QA-02: Backend Completely Lacks Automated Test Suite
- **Severity**: Medium
- **Location**: `backend/package.json` (line 7)
- **Description**: `backend/package.json` defines test script as `"test": "echo \"Error: no test specified\" && exit 1"`. There are no test files, test runner (e.g., Jest, Mocha/Chai, Supertest), or integration tests for the API routes.
- **Impact**: Regressions in authentication, cookie handling, and database queries cannot be caught automatically.
- **Remediation**: Introduce Supertest and Jest or Mocha to test auth and CRUD routes with an in-memory MongoDB runner (e.g., `mongodb-memory-server`).

---

## 5. Architecture & Configuration Inconsistencies

### ARCH-01: Typo in Frontend Directory Name
- **Severity**: Low
- **Location**: Repository root directory name `frondend/`
- **Description**: The directory containing the Angular client is named `frondend` instead of `frontend`.
- **Impact**: Creates confusion for developers, CI/CD pipelines, and automated tooling expecting standard project structures.
- **Remediation**: Rename directory to `frontend/` and update references if applicable.

### ARCH-02: Hardcoded Database Connection String
- **Severity**: Low
- **Location**: `backend/index.js` (line 19)
- **Description**: `mongoose.connect('mongodb://127.0.0.1:27017/jwtproject')` is hardcoded.
- **Impact**: Prevents deploying the backend to containerized environments (Docker, Kubernetes) or production cloud databases (MongoDB Atlas) without modifying code.
- **Remediation**: Use `process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jwtproject'`.

---

## 6. Summary Matrix & Remediation Priority

| ID | Category | Title | Severity | Impact | Status |
|---|---|---|---|---|---|
| **SEC-01** | Security | Admin Endpoints Missing Authentication & Authorization | Critical | Full unauthorized admin access | Open |
| **SEC-02** | Security | Hardcoded JWT Secret Key (`"secret"`) | Critical | Forgery of auth tokens | Open |
| **SEC-03** | Security | Password Hash Leaked in `/api/admin/users` | High | User credentials leakage | Open |
| **SEC-04** | Security | Unhandled File Upload / Missing Validation | Medium | Server crashes / arbitrary uploads | Open |
| **SEC-05** | Security | Missing CSRF Protection & Cookie SameSite | Medium | Potential cross-site request forgery | Open |
| **BE-01** | Backend Logic | `/createuser` Overwrites Admin Session Cookie | High | Admin session lost on user creation | Open |
| **BE-02** | Backend Logic | `is_admin` Field Defined as String with Boolean Default | Medium | Type coercion query bugs | Open |
| **BE-03** | Backend Logic | Empty Catch Blocks Suppressing Errors | Medium | Hanging requests, no error visibility | Open |
| **BE-04** | Backend Logic | `/editDetails/:id` Uses POST Instead of GET | Low | REST convention violation | Open |
| **FE-01** | Frontend Logic | `HttpClient.post` Options Passed as Body Parameter | High | Cookies not sent on admin calls | Open |
| **FE-02** | Frontend Logic | Search Input in User List is Inoperable | Low | Feature non-functional | Open |
| **QA-01** | Testing | Angular Spec Files Missing Test Providers (`NullInjectorError`) | High | 12/14 test specs fail | Open |
| **QA-02** | Testing | Backend Missing Test Suite | Medium | No automated backend verification | Open |
| **ARCH-01**| Architecture | Frontend Directory Typo (`frondend`) | Low | Developer ergonomics / CI impact | Open |
| **ARCH-02**| Architecture | Hardcoded MongoDB Connection URI | Low | Inflexible deployment | Open |
