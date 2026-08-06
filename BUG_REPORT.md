# Comprehensive Bug & Vulnerability Report

This report documents several critical security vulnerabilities, backend/frontend logic bugs, structural flaws, and unit test failures discovered in the JWT Project.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description**: The JWT signing (`jwt.sign()`) and verification (`jwt.verify()`) operations hardcode the secret key string `"secret"`.
* **Impact**: Environment variable `process.env.jwtsecret` (defined in `backend/.env`) is completely ignored. Hardcoding secrets in source code violates security best practices, allowing attackers to forge valid tokens if they gain read access to the repository.
* **Remediation**: Use `process.env.jwtsecret` instead of `"secret"`.

### 1.2 Exposure of Sensitive Password Hashes in API Responses
* **Location**: `backend/routes/adminroute.js` (inside `/users` endpoint)
* **Description**: The `/users` endpoint retrieves all users from MongoDB using `User.find({})` and returns the resulting array directly to the client.
* **Impact**: The password hash field is exposed in the response JSON, which can be viewed by anyone calling the API. Even though the password is encrypted using bcrypt, exposure of password hashes makes them vulnerable to offline brute-force and rainbow table attacks.
* **Remediation**: Exclude the password field when querying or returning user data (e.g., use `User.find({}, '-password')` or map over results to delete the password property).

### 1.3 Missing Authentication and Authorization on Admin Routes
* **Location**: `backend/routes/adminroute.js`
* **Description**: Endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` have no token validation middleware or administrative checks. Only the `/active` endpoint validates the token.
* **Impact**: Unauthenticated users can directly access, modify, delete, or create user profiles via these endpoints.
* **Remediation**: Create and apply an authentication middleware that verifies the JWT from cookies and ensures that the user is an admin (`is_admin === "true"` or similar boolean check) before proceeding with the request.

### 1.4 No Cross-Site Request Forgery (CSRF) Protection
* **Location**: `backend/index.js`, `backend/routes/`
* **Description**: The backend relies on credentials (cookies) for request authentication and configures CORS to accept origins from `http://localhost:4200` with `credentials: true`. However, the app does not implement CSRF tokens or `SameSite` cookie flags.
* **Impact**: Users could be vulnerable to CSRF attacks if they visit a malicious site while having an active session cookie.
* **Remediation**: Implement double-submit cookie pattern or standard CSRF middleware (e.g., using `csurf` or similar custom middleware) and set strict or lax `SameSite` options on cookies.

---

## 2. Backend Logic Errors

### 2.1 Admin Overwritten by New User Session Cookie during User Creation
* **Location**: `backend/routes/adminroute.js` (inside `/createuser` endpoint)
* **Description**: When an admin creates a new user, the backend generates a JWT token for the newly created user and attaches it as a cookie named `"jwt"`.
* **Impact**: Creating a user overwrites the administrator's own session cookie. As a result, the administrator is either logged out or logged in as the newly created user.
* **Remediation**: Do not generate a new JWT cookie or overwrite the `"jwt"` cookie when an admin is creating an account on behalf of a user. Simply return a success status code.

### 2.2 Model Type Inconsistency for `is_admin` Field
* **Location**: `backend/models/user.js`
* **Description**: The `is_admin` field is defined as `type: String` with `default: false` (a boolean value).
* **Impact**: Mixing types can cause indexing issues, schema mismatches, and confusion in query conditions. For instance, `User.findOne({ is_admin: true })` might behave unexpectedly depending on how Mongoose handles casting.
* **Remediation**: Define `is_admin` with `type: Boolean` and `default: false`.

### 2.3 Potential Server Crash on Profile Image Upload
* **Location**: `backend/routes/routes.js` (inside `/profile-upload-single` endpoint)
* **Description**: The endpoint accesses `req.file.filename` directly.
* **Impact**: If a client sends a request without an attached file under the name `image`, `req.file` will be `undefined`. Accessing `req.file.filename` raises a `TypeError` and crashes the process if unhandled.
* **Remediation**: Add a check: `if (!req.file) { return res.status(400).send({ message: "No file uploaded" }); }`.

### 2.4 Silent Errors/Empty Catch Blocks
* **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description**: Multiple `catch` blocks are completely empty (e.g., `/profile-upload-single` catch block) or only log error messages without sending a HTTP response.
* **Impact**: The server silently fails on errors, leaving the client request hanging indefinitely without a response.
* **Remediation**: Implement consistent global or per-route error handling that responds with an appropriate HTTP status (e.g., `500 Internal Server Error`).

---

## 3. Frontend Implementation & UI Bugs

### 3.1 Angular HttpClient.post Parameter Error
* **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (inside `deleteUser`), `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (inside `getusers`)
* **Description**: Angular's `HttpClient.post()` signature is `post(url, body, options)`. The components invoke it like so: `this.http.post(url, { withCredentials: true })`.
* **Impact**: This passes `{ withCredentials: true }` as the HTTP request body instead of the request options. Credentials are not sent, and the body contains options config instead of payload data.
* **Remediation**: Call `this.http.post(url, {}, { withCredentials: true })` instead.

### 3.2 Non-Functional Search Input
* **Location**: `frondend/jwtapp/src/app/components/admin-userlist/`
* **Description**: The search input field in `admin-userlist.component.html` is a static element: `<input type="text" placeholder="Search" class="input">`. It has no binding (`ngModel` or Reactive Form) and does not trigger any logic to filter user records.
* **Impact**: Users cannot search or filter the list of users displayed in the admin dashboard.
* **Remediation**: Implement a search text binding and a custom pipe or filter logic on the NgRx select selector or component code to filter users dynamically.

### 3.3 Misspelled Frontend Directory Name
* **Location**: Project Root
* **Description**: The folder containing the Angular frontend is named `frondend` instead of `frontend`.
* **Impact**: Potential confusion for developers and build scripts.
* **Remediation**: Rename the directory to `frontend` (while updating any root-level config paths or build references if necessary).

---

## 4. Frontend Unit Test Failures

### 4.1 Test Context Baseline
Executing frontend tests using Angular CLI karma configuration yields `12 FAILED, 2 SUCCESS`.

### 4.2 Root Causes of Test Failures
All 12 component test specs fail primarily due to `NullInjectorError: No provider for HttpClient!` and/or `No provider for Router!`.
* **Missing HTTP Module**: The components inject `HttpClient` into their constructors, but their corresponding `.spec.ts` files do not import or configure `HttpClientTestingModule` or register a mock `HttpClient` provider in `TestBed`.
* **Missing Router Module**: The components inject `Router` or `ActivatedRoute`, but their corresponding `.spec.ts` files do not provide `RouterTestingModule`.
* **Missing NgRx Store**: Components interacting with NgRx Store (e.g., `AdminUserlistComponent`) fail because they lack `provideMockStore()` in their test configuration.

### 4.3 Remediation
In all failing `.spec.ts` files, update the `TestBed.configureTestingModule` call to:
* Import `HttpClientTestingModule` from `@angular/common/http/testing`.
* Import `RouterTestingModule` from `@angular/router/testing`.
* Import reactive form module imports if the component depends on forms.
* Provide mock store using `provideMockStore()` from `@ngrx/store/testing` if state management is utilized.
