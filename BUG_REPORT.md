# Bug Report & Vulnerability Analysis

## Overview
This report details identified security vulnerabilities, logic errors, frontend/backend bugs, test failures, and architectural issues across the application codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue**: JWT tokens are signed and verified using a hardcoded string key `"secret"` instead of using the environment variable `process.env.jwtsecret` configured in `.env`.
- **Impact**: Anyone with access to the source code can forge valid JWT tokens and bypass authentication.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Issue**: Administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication/authorization check middleware.
- **Impact**: Any unauthenticated user or guest can invoke sensitive administrative routes, delete users, edit details, or create new accounts.

### 1.3 Sensitive Password Exposure in API Responses
- **Location**: `backend/routes/adminroute.js` (`/users`)
- **Issue**: The `/users` endpoint returns raw Mongoose user documents including the hashed `password` field directly to clients.
- **Impact**: Exposes password hashes of all registered users to any caller of the user listing endpoint.

### 1.4 Missing Cross-Site Request Forgery (CSRF) Protection
- **Location**: `backend/index.js`
- **Issue**: CORS allows credentials (`credentials: true`) from `http://localhost:4200`, but no CSRF tokens or anti-CSRF measures are implemented.
- **Impact**: Authenticated session cookies (`jwt`) are vulnerable to cross-site request forgery attacks.

---

## 2. Backend Logic & Runtime Bugs

### 2.1 Admin Create User Endpoint Overwrites Active Admin Session
- **Location**: `backend/routes/adminroute.js` (`/createuser`)
- **Issue**: When an admin creates a new user, the endpoint generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP-only cookie in `res.cookie("jwt", token)`.
- **Impact**: The active administrator is automatically logged out and authenticated as the newly created user.

### 2.2 Unhandled File Upload Null Access
- **Location**: `backend/routes/routes.js` (`/profile-upload-single`)
- **Issue**: `req.file.filename` is accessed directly without verifying if `req.file` exists when no file is uploaded.
- **Impact**: Sending a request without a file payload throws an unhandled `TypeError` (cannot read property `filename` of undefined) or causes silent failure.

### 2.3 Model Schema Type Mismatch
- **Location**: `backend/models/user.js`
- **Issue**: `is_admin` is defined as `type: String` with `default: false` (boolean).
- **Impact**: Inconsistent property type handling in Mongoose queries and application logic.

### 2.4 Silent Error Suppression in Catch Blocks
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue**: Multiple route handlers contain empty `catch (error)` blocks or `console.log(error.message)` without returning proper HTTP error status codes (e.g. 500 Internal Server Error) to the client.
- **Impact**: API clients receive hanging requests or unexpected empty 200 OK responses on failure.

---

## 3. Frontend Bugs & Issues

### 3.1 Misplaced Options in `HttpClient.post` Calls
- **Location**: `frondend/jwtapp/src/app/components/` (`AdminUserlistComponent`, `AdminUsereditComponent`)
- **Issue**: Angular `HttpClient.post` requests pass options (such as `{ withCredentials: true }`) as the second argument (request body) instead of the third argument (options object).
- **Impact**: Requests send configuration options as payload and omit expected request headers/credentials.

### 3.2 Non-functional Admin User Search
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue**: The user search input in `AdminUserlistComponent` is static HTML without event bindings, form controls, or selector integration.
- **Impact**: Search bar input does not filter the user list.

### 3.3 Misspelled Directory Name
- **Location**: Root directory (`frondend/`)
- **Issue**: Directory is named `frondend` instead of `frontend`.
- **Impact**: Leads to confusion and build/tooling configuration discrepancies.

### 3.4 Unit Test Setup Failures
- **Location**: `frondend/jwtapp/src/app/` (`*.spec.ts`)
- **Issue**: Angular component unit tests fail (12 of 14 failing) due to missing test module imports (`HttpClientTestingModule`, `RouterTestingModule`) and mock store providers (`provideMockStore`).
- **Impact**: Automated unit test suite fails during build checks.

---

## 4. Configuration & Architecture Issues

### 4.1 Missing Backend Start Script
- **Location**: `backend/package.json`
- **Issue**: `package.json` lacks standard `scripts.start` or `scripts.dev` definitions.

### 4.2 Hardcoded Database Connection String
- **Location**: `backend/index.js`
- **Issue**: MongoDB connection string (`mongodb://127.0.0.1:27017/jwtproject`) is hardcoded in application initialization instead of using environment variables.
