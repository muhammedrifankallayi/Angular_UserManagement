# Bug Report & Security Vulnerability Assessment

This document provides a comprehensive report of identified security vulnerabilities, logic errors, schema inconsistencies, error handling flaws, frontend bugs, and test failures across the repository.

---

## 1. Security Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Most endpoints in `adminroute.js` (e.g., `GET /users`, `POST /deleteUser/:id`, `POST /editDetails/:id`, `POST /editUser`, `POST /createuser`) do not check if the requesting user is authenticated or authorized as an administrator. Any unauthenticated client can trigger these endpoints.
- **Impact**: High / Critical. Unauthenticated attackers can list, edit, or delete arbitrary user records, as well as create new users.

### 1.2 Hardcoded JWT Secret Key
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: The JWT signing and verification calls use a hardcoded string `"secret"` (e.g. `jwt.sign({_id: user._id}, "secret")`) instead of loading from environment variables (`process.env.jwtsecret`).
- **Impact**: High. Attackers who inspect the source code can forge valid JWT tokens and bypass authentication.

### 1.3 Sensitive Data Exposure (Plaintext Passwords in User List API)
- **Location**: `backend/routes/adminroute.js` (`GET /users`)
- **Description**: The `GET /users` route retrieves all user documents with `User.find({})` and directly returns them without omitting the `password` field (hashed passwords/hashes are exposed in the JSON response).
- **Impact**: High. Exposes user password hashes to anyone calling the endpoint.

### 1.4 Missing File Upload Input Validation
- **Location**: `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Description**: The profile upload route directly accesses `req.file.filename` without verifying if `req.file` exists (i.e. if a file was attached in the request).
- **Impact**: Medium. Sending a request without a file attachment causes an unhandled exception (`TypeError: Cannot read properties of undefined (reading 'filename')`), leading to potential application crash or 500 error.

### 1.5 CORS Credentials Without CSRF Protection
- **Location**: `backend/index.js`
- **Description**: Express server uses `cors({ credentials: true, origin: ['http://localhost:4200'] })` and relies on `httpOnly` cookies for JWT storage without implementing CSRF tokens or SameSite cookie protections.
- **Impact**: Medium. Susceptible to Cross-Site Request Forgery (CSRF) if an attacker targets authenticated users browsing malicious sites.

---

## 2. Logic & Functional Errors

### 2.1 Admin User Creation Overwrites Admin Session Cookie
- **Location**: `backend/routes/adminroute.js` (`POST /createuser`)
- **Description**: When an administrator creates a new user via `POST /api/admin/createuser`, the route generates a new JWT token for the newly created user and sets it as the `jwt` HTTP cookie on the response (`res.cookie("jwt", token, ...)`).
- **Impact**: Medium / High. The administrator is immediately logged out and re-authenticated as the newly created user.

### 2.2 Incorrect Argument Positions in Angular HttpClient Calls
- **Location**: Frontend Angular components (`AdminUserlistComponent`, `AdminUsereditComponent`)
- **Description**: In multiple frontend HTTP POST requests (e.g. `HttpClient.post`), options such as `{ withCredentials: true }` are passed as the second argument (request body) instead of the third argument (options configuration object).
- **Impact**: Medium. Causes invalid request payloads to be sent to the backend and fails to pass required configuration options.

### 2.3 Non-Functional Search Input
- **Location**: `AdminUserlistComponent` frontend component
- **Description**: The search input element in the template is static HTML and lacks two-way binding, event handlers, or NgRx selector filtering implementation.
- **Impact**: Low / Medium. Users cannot filter or search the user list in the admin UI.

---

## 3. Schema & Type Inconsistencies

### 3.1 Inconsistent `is_admin` Field Type in Mongoose Schema
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined with `type: String`, but its default value is set to the boolean `false` (`default: false`), and admin authorization queries check for boolean `is_admin: true`.
- **Impact**: Medium. Mongoose type coercion or strict queries may fail or behave inconsistently depending on whether `is_admin` is stored as a string or boolean.

---

## 4. Error Handling Deficiencies

### 4.1 Empty / Suppressed Catch Blocks in Backend Express Routes
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Numerous `try...catch` blocks catch exceptions without returning an HTTP error response to the client or logging details (e.g., empty `catch (error) {}` in `/profile-upload-single`, `logout`, and `deleteUser`).
- **Impact**: Low / Medium. Requests hang until timeout or return empty responses when errors occur, complicating debugging and client error handling.

---

## 5. Testing & Repository Structure Deficiencies

### 5.1 Misspelled Frontend Directory Name
- **Location**: Repository Root
- **Description**: The frontend directory is named `frondend/` instead of `frontend/`.
- **Impact**: Low (developer experience / standard project convention).

### 5.2 Angular Spec Test Failures
- **Location**: `frondend/jwtapp/src/app/...` spec files
- **Description**: Frontend unit tests fail due to missing module providers in `TestBed` setups (e.g., `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`, missing NgRx mock store providers).
- **Impact**: Medium. Unit test suite cannot pass in automated CI/CD pipelines.
