# Comprehensive Bug & Vulnerability Report

## Executive Summary
This document provides a detailed report of software bugs, security vulnerabilities, logic flaws, architectural issues, and unit testing deficiencies identified across the JWT Auth application stack (Node.js/Express backend and Angular 16 frontend).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: JWT tokens are signed and verified using a hardcoded string literal `"secret"` (e.g., `jwt.sign({_id: user._id}, "secret")`) instead of using `process.env.jwtsecret` from the environment configuration (`.env`).
- **Severity**: **High**
- **Impact**: Anyone with read access to the source code can forge arbitrary valid JWT session tokens and impersonate users or administrators.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **File**: `backend/routes/adminroute.js`
- **Description**: Administrative endpoints—including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`—lack authentication verification and admin role check middleware.
- **Severity**: **Critical**
- **Impact**: Any unauthenticated network user can view all registered users, edit user information, delete users, or create new user accounts directly through the API.

### 1.3 Exposure of Sensitive Data (User Passwords) in User List API
- **File**: `backend/routes/adminroute.js`
- **Endpoint**: `GET /users`
- **Description**: The route queries `User.find({})` and returns raw database objects without projecting or stripping out the `password` field.
- **Severity**: **High**
- **Impact**: Hashed user passwords are sent across the network and exposed to any caller fetching the user list.

---

## 2. Backend Logic Flaws & Edge Case Errors

### 2.1 Admin Session Cookie Overwritten During User Creation
- **File**: `backend/routes/adminroute.js`
- **Endpoint**: `POST /createuser`
- **Description**: When an admin creates a new user, the route generates a JWT token for the newly created user and attaches it to the response cookie via `res.cookie("jwt", token)`.
- **Severity**: **Medium**
- **Impact**: Performing account creation as an admin immediately overwrites the admin's active session cookie with a token corresponding to the new user.

### 2.2 Unhandled Missing File Upload Exception
- **File**: `backend/routes/routes.js`
- **Endpoint**: `POST /profile-upload-single`
- **Description**: The route directly accesses `req.file.filename` without checking if `req.file` exists (i.e. when a request is submitted without an image attachment). The surrounding `catch` block is completely empty.
- **Severity**: **Medium**
- **Impact**: Sending a request without a file triggers an unhandled `TypeError` (Cannot read properties of undefined), resulting in an uncaught exception or server hang without responding to the client.

### 2.3 `is_admin` Field Type Inconsistency
- **File**: `backend/models/user.js`
- **Description**: In the Mongoose schema, `is_admin` is defined with `type: String` and `default: false` (a boolean literal). In `adminroute.js`, queries check `{ is_admin: true }`.
- **Severity**: **Low**
- **Impact**: Schema type mismatch between `String` and boolean values can lead to unexpected Mongoose type casting behavior or missed query matches.

---

## 3. Frontend Bugs & UI Issues

### 3.1 Incorrect `HttpClient.post` Parameter Ordering
- **Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser` method)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers` method)
- **Description**: Angular `HttpClient.post()` expects signature `(url, body, options)`. These methods call `http.post(url, { withCredentials: true })`, passing the request options object as the request `body` parameter (the 2nd argument) instead of the options (the 3rd argument).
- **Severity**: **Medium**
- **Impact**: `withCredentials` header option is not actually set on the outgoing request, and `{ withCredentials: true }` is transmitted as the HTTP body.

### 3.2 Non-Functional Search Bar Component
- **File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The user search bar `<input type="text" placeholder="Search" class="input">` is static HTML with no Angular event bindings, `[(ngModel)]`, or state management logic.
- **Severity**: **Low**
- **Impact**: End-users cannot filter the user list by search query in the admin dashboard.

---

## 4. Environment, Directory, and Test Suite Issues

### 4.1 Misspelled Directory Name
- **Location**: Repository root folder `frondend/`
- **Description**: The directory containing the frontend Angular application is misspelled as `frondend` instead of `frontend`.

### 4.2 Frontend Unit Test Dependency Failures
- **Files**: Component spec files under `frondend/jwtapp/src/app/components/`
- **Description**: Angular unit tests fail with `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing NgRx Mock Store configurations.
- **Severity**: **Medium**
- **Impact**: `ng test` suite fails across 12 out of 14 test cases due to missing module imports (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in `TestBed.configureTestingModule`.
