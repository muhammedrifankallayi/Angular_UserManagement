# Comprehensive Bug Report

This document outlines the security vulnerabilities, logic errors, schema inconsistencies, frontend defects, and test suite failures identified across the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded Secrets
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue**: Standard JWT signing and verification use hardcoded secret strings (`"secret"`) instead of using environment variables (e.g., `process.env.jwtsecret` loaded via `dotenv`).
- **Impact**: Attainable production tokens if repository code is exposed; inability to rotate secrets securely.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
- **Location**: `backend/routes/adminroute.js`
- **Issue**: Endpoints such as `GET /users`, `POST /deleteUser/:id`, `POST /editDetails/:id`, `POST /editUser`, and `POST /createuser` do not check for authentication or verify if the caller has administrator privileges (`is_admin`).
- **Impact**: Any unauthenticated actor or non-admin user can list, edit, or delete users and create new accounts.

### 1.3 Exposure of Sensitive User Data (Passwords)
- **Location**: `backend/routes/adminroute.js` (`GET /users`)
- **Issue**: The `GET /users` route retrieves and returns raw user documents from MongoDB without excluding or sanitizing the hashed `password` field.
- **Impact**: User password hashes are exposed to any client calling the user listing API.

### 1.4 Admin Session Overwritten on User Creation
- **Location**: `backend/routes/adminroute.js` (`POST /createuser`)
- **Issue**: When an admin creates a new user, a new JWT token is signed for the created user and set as the HTTP-only `jwt` cookie response.
- **Impact**: Overwrites the administrator's active session cookie, effectively logging out the admin and authenticating them as the newly created user.

### 1.5 Missing CSRF Protection & Permissive CORS Configuration
- **Location**: `backend/index.js`
- **Issue**: The Express app allows `credentials: true` for cross-origin requests without anti-CSRF token verification on state-changing endpoints.
- **Impact**: Leaves cross-site users vulnerable to Request Forgery attacks.

---

## 2. Backend Logic Errors & Schema Inconsistencies

### 2.1 Type Mismatch in Mongoose Schema (`is_admin`)
- **Location**: `backend/models/user.js`
- **Issue**: `is_admin` is typed as `String` in the schema while having a boolean default (`default: false`).
- **Impact**: Lead to inconsistent query behavior when checking `is_admin` boolean vs string values in database queries.

### 2.2 Unchecked File Upload Access
- **Location**: `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Issue**: Attempts to access `req.file.filename` without verifying if `req.file` exists.
- **Impact**: Triggers an unhandled runtime `TypeError: Cannot read property 'filename' of undefined` if an upload request is submitted without an attached file payload.

### 2.3 Poor Error Handling & Hanging HTTP Requests
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue**: Multiple route handlers contain empty `catch` blocks or catch errors without sending an HTTP response back to the client (e.g., `/profile-upload-single`, `/deleteUser/:id`, `/logout`).
- **Impact**: Client requests time out or hang indefinitely when unexpected backend exceptions occur.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1 Misspelled Directory Name
- **Location**: Root directory (`frondend/` instead of `frontend/`)
- **Issue**: The root frontend folder is named `frondend`.
- **Impact**: Causes confusion and potential path resolution issues across standard CI/CD pipelines.

### 3.2 Incorrect `HttpClient.post` Parameter Order
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue**: `this.http.post(url, { withCredentials: true })` passes request options as the second argument (`body`) instead of passing `body` as second and `{ withCredentials: true }` as the third argument.
- **Impact**: Backend receives option object as request payload; authentication credentials cookies are not attached automatically.

### 3.3 Non-Functional Admin Search Input
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Issue**: Search input in the admin user list component is static HTML and lacks event binding, component logic, and state selector implementations.
- **Impact**: Admin users cannot filter or search through user lists.

---

## 4. Test Suite Failures

### 4.1 Missing Dependencies / Test Bed Injection Errors in Angular Unit Specs
- **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Issue**: Running `ng test` results in widespread test failures (e.g., 12 out of 14 specs failing) due to `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing NgRx MockStore providers (`provideMockStore`).
- **Impact**: Unit test suite is non-functional and fails automated verification.
