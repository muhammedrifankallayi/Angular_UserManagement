# Bug Report

## Overview
This bug report documents identified security vulnerabilities, backend logic errors, frontend bugs, architectural/configuration issues, and unit test failures across the full-stack JWT Angular and Node.js application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: JWT signatures are generated and verified using the hardcoded string `"secret"` (e.g., `jwt.sign({_id: user._id}, "secret")`) instead of loading the environment variable from `process.env.jwtsecret` (configured in `backend/.env`).
- **Impact**: Attainable secret key allows signature forgery and potential authentication bypass.

### 1.2 Missing Authentication & Authorization Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Sensitive admin endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication checks and admin permission verification middleware.
- **Impact**: Unauthenticated users can perform administrative operations (listing, editing, creating, or deleting users).

### 1.3 Exposure of Hashed Passwords in API Responses
- **Location**: `backend/routes/adminroute.js` (`/users` route)
- **Description**: `User.find({})` returns all user documents without omitting or stripping the `password` field before sending JSON responses back to the client.
- **Impact**: Hashes of user passwords are exposed over the network.

### 1.4 Missing CSRF Protection & Permissive CORS Configuration
- **Location**: `backend/index.js`
- **Description**: `cors({ credentials: true, origin: ['http://localhost:4200'] })` is enabled alongside `cookie-parser` storing HTTP-only cookies without Anti-CSRF tokens or SameSite attribute configurations on cookies.
- **Impact**: Vulnerable to Cross-Site Request Forgery (CSRF) attacks when authenticated users visit malicious origins.

---

## 2. Backend Logic & Schema Errors

### 2.1 Admin Session Cookie Overwritten on User Creation
- **Location**: `backend/routes/adminroute.js` (`/createuser` route)
- **Description**: When an admin creates a user via `/api/admin/createuser`, the route creates a JWT token for the newly created user ID and sets it as the `jwt` cookie in `res.cookie()`.
- **Impact**: The admin's session cookie is immediately overwritten by the newly created user's credentials, logging out the admin.

### 2.2 Unhandled Null File Access in Profile Image Upload
- **Location**: `backend/routes/routes.js` (`/profile-upload-single` route)
- **Description**: The endpoint directly accesses `req.file.filename` without verifying if `req.file` exists.
- **Impact**: Submitting a request without attaching a file results in an uncaught `TypeError: Cannot read properties of undefined (reading 'filename')`.

### 2.3 Schema Mismatch for `is_admin` Field
- **Location**: `backend/models/user.js`
- **Description**: `is_admin` is defined with `type: String` but assigned a default boolean value (`default: false`). In `adminroute.js`, queries search using boolean `{ is_admin: true }`.
- **Impact**: Inconsistent field typing can lead to query mismatch or unpredicted casting behavior in MongoDB/Mongoose.

### 2.4 Error Suppression and Missing Client Responses in Catch Blocks
- **Location**: `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Description**: Several `try...catch` blocks (e.g. `/deleteUser/:id`, `/logout`, `/profile-upload-single`) either have empty `catch` blocks or log to console without sending a response to the client.
- **Impact**: Client requests hang until timeout when an unexpected error occurs on the server.

---

## 3. Frontend Bugs & UI Issues

### 3.1 Incorrect HTTP POST Request Options Syntax
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` & `admin-useredit.component.ts`
- **Description**: Angular `HttpClient.post` calls pass options (e.g., `{ withCredentials: true }`) as the second argument (`body`) instead of the third argument (`options`). For example:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
- **Impact**: Request body is sent as `{ withCredentials: true }` and HTTP request options (such as credentials) are omitted.

### 3.2 Non-Functional Search Bar
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The input `<input type="text" placeholder="Search" class="input">` is static HTML and lacks `ngModel` binding, event listeners, or NgRx filtering logic in `AdminUserlistComponent`.
- **Impact**: Users cannot search or filter the user list.

### 3.3 Root Frontend Directory Naming Typo
- **Location**: Repository root
- **Description**: The frontend folder is named `frondend/` instead of `frontend/`.
- **Impact**: Causes confusion in project structure and build scripts.

---

## 4. Test Suite Failures

### 4.1 Frontend Angular Unit Test Failures
- **Location**: `frondend/jwtapp/`
- **Description**: Running `ng test` results in 12 out of 14 failing test specs.
- **Root Cause**: Component spec files (`*.spec.ts`) do not provide mock dependencies in `TestBed.configureTestingModule` (e.g., missing `HttpClientTestingModule`, `RouterTestingModule`, `ProvideMockStore`).
- **Failing Specs**:
  - `AppComponent`
  - `DashboardComponent`
  - `LoginComponent`
  - `AdminLoginComponent`
  - `AdminUserlistComponent`
  - `AdminUsereditComponent`
  - `AdminCreateuserComponent`
  - `AdminNavComponent`
  - `NavComponent`
  - `HomeComponent`
  - `ProfileComponent`
  - `RegisterComponent`
