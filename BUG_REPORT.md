# Comprehensive Bug and Security Report

This document outlines identified security vulnerabilities, backend logic and error handling issues, frontend bugs and architectural flaws, and schema/configuration inconsistencies present in the application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: JWT signing and verification calls use the hardcoded string literal `"secret"` (e.g., `jwt.sign({_id: ...}, "secret")`) instead of loading the environment variable configured in `backend/.env` (`process.env.jwtsecret`).
- **Impact**: Anyone with access to the source code or common dictionary secrets can sign arbitrary tokens and impersonate users/admins.

### 1.2 Missing Authentication & Authorization Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Most admin endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and role verification checks. They do not verify whether the incoming request contains a valid JWT or if the user is an administrator.
- **Impact**: Any unauthenticated user can invoke administrative endpoints to view, edit, create, or delete users.

### 1.3 Exposure of Sensitive Fields in User List Endpoint
- **Location**: `backend/routes/adminroute.js` (Endpoint: `GET /users`)
- **Description**: The `/users` route returns raw Mongoose user documents using `User.find({})` without stripping the `password` hash field.
- **Impact**: Password hashes are leaked to client callers via the `/users` endpoint.

### 1.4 Absence of CSRF Protection & Insecure Cookie Settings
- **Location**: `backend/index.js`, `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Authentication cookies (`jwt`) rely solely on `httpOnly: true`. There is no CSRF token validation middleware or `SameSite` attribute enforcement on cookies.
- **Impact**: The application is vulnerable to Cross-Site Request Forgery (CSRF) attacks when cross-origin requests are made with credentials enabled.

---

## 2. Backend Logic and Error Handling Issues

### 2.1 Admin Session Overwrite on User Creation
- **Location**: `backend/routes/adminroute.js` (Endpoint: `POST /createuser`)
- **Description**: When an admin creates a new user via `/createuser`, the route signs a JWT for the *newly created user* and sets it in the response cookie (`res.cookie("jwt", token, ...)`).
- **Impact**: Creating a user immediately overwrites the administrator's active session cookie with the new user's session cookie.

### 2.2 Missing File Verification in Single Profile Upload Route
- **Location**: `backend/routes/routes.js` (Endpoint: `POST /profile-upload-single`)
- **Description**: The handler accesses `req.file.filename` directly without verifying that `req.file` exists.
- **Impact**: Upload requests sent without a file payload cause an unhandled runtime error (`TypeError: Cannot read properties of undefined (reading 'filename')`), leading to request hangs or server failure.

### 2.3 Poor Error Handling and Suppressed Exceptions
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Multiple try/catch blocks are empty or log errors to stdout without returning HTTP responses to the client (e.g., in `/profile-upload-single`, `/logout`, `/deleteUser/:id`).
- **Impact**: Clients receive no response or hang until timeout when an error occurs inside these routes.

---

## 3. Frontend Bugs and Architectural Flaws

### 3.1 Directory Naming Typo
- **Location**: `frondend/`
- **Description**: The root frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Improper HttpClient Parameter Passing
- **Location**: `AdminUserlistComponent`, `AdminUsereditComponent`
- **Description**: Angular `HttpClient.post` calls pass options (such as `{ withCredentials: true }`) as the second argument (request body) rather than the third argument (`options`).
- **Impact**: API requests send invalid body payloads and miss intended configuration options like credentials.

### 3.3 Static Search Input in Admin User List
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input element in the user list template is static HTML without data bindings (`[(ngModel)]`), event listeners, or corresponding filtering logic in the component or NgRx selectors.
- **Impact**: User filtering functionality in the admin user list interface is non-functional.

### 3.4 Failing Unit Tests
- **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description**: 12 of 14 Angular component unit test suites fail due to missing module/provider imports in `TestBed` setups (e.g., `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx mock store providers).

---

## 4. Schema and Environment Inconsistencies

### 4.1 Mongoose Schema Type Mismatch for `is_admin`
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined as `type: String` with `default: false` (a boolean). In `backend/routes/adminroute.js`, queries search for `{ is_admin: true }` (a boolean).
- **Impact**: Potential type conversion anomalies and inconsistent queries across Mongoose operations.

### 4.2 Hardcoded Database Connection String
- **Location**: `backend/index.js`
- **Description**: MongoDB connection string (`mongodb://127.0.0.1:27017/jwtproject`) is hardcoded directly in `index.js` rather than being loaded from environment variables.
