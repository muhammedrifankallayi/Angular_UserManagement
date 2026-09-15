# Bug Report & Audit Document

## Overview
This document outlines the identified bugs, security vulnerabilities, logic errors, and unit test failures in the JWT Authentication & User Management application (comprising the Express backend and Angular frontend).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: The JWT signing and verification calls use a hardcoded fallback string `"secret"` (e.g., `jwt.sign({_id}, "secret")` and `jwt.verify(cookie, "secret")`) instead of accessing `process.env.jwtsecret` configured in `backend/.env`.
- **Impact**: Compromises token security and prevents secret key rotation via environment configuration.

### 1.2 Missing Authentication & Authorization Middleware in Administrative Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Administrative endpoints—specifically `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`—do not perform JWT cookie authentication or verify if the requesting user has `is_admin` privileges.
- **Impact**: Any unauthenticated client can trigger admin actions, delete user accounts, modify user data, or fetch user records.

### 1.3 Sensitive Data Exposure (Hashed Passwords Leaked in API Response)
- **Location**: `backend/routes/adminroute.js` (Endpoint `/users`)
- **Description**: The `/users` endpoint executes `User.find({})` and sends raw Mongoose documents directly to the client (`res.send(user)`).
- **Impact**: Hashed user passwords and internal fields are exposed in the JSON response payload.

### 1.4 CORS & Missing CSRF Protection
- **Location**: `backend/index.js`
- **Description**: CORS is configured with `credentials: true` for `http://localhost:4200`, but there is no CSRF token check or SameSite cookie protection implemented.
- **Impact**: Vulnerable to Cross-Site Request Forgery (CSRF) attacks when authenticated via cookie.

---

## 2. Backend Logic Errors & Exception Handling

### 2.1 Admin Session Overwrite on User Creation
- **Location**: `backend/routes/adminroute.js` (Endpoint `/createuser`)
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the route issues a new `jwt` cookie containing the newly created user's ID (`res.cookie("jwt", token, ...)`).
- **Impact**: The active administrator is immediately logged out and re-authenticated as the newly created standard user account.

### 2.2 Unhandled Null Reference in Profile File Upload
- **Location**: `backend/routes/routes.js` (Endpoint `/profile-upload-single`)
- **Description**: The route directly accesses `req.file.filename` without checking if `req.file` exists.
- **Impact**: If a request is sent without an uploaded file attachment, accessing `req.file.filename` causes a `TypeError: Cannot read property 'filename' of undefined`.

### 2.3 Suppressed Exceptions & Empty Catch Blocks
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Several route handlers (e.g., `/profile-upload-single`, `/deleteUser/:id`, `/logout`, `/profile`) contain empty `catch (error) {}` blocks or do not return HTTP error status responses (such as 500 Internal Server Error) when errors occur.
- **Impact**: Leaves client requests hanging without response headers or swallows runtime errors silently.

### 2.4 Data Type Mismatch in User Schema (`is_admin`)
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` schema field is defined with `type: String, default: false`. The default value is a boolean (`false`), but the type definition is `String`. Additionally, `adminroute.js` queries `{ is_admin: true }` as a boolean.
- **Impact**: Leads to schema data type inconsistencies and potential query mismatches in Mongoose.

---

## 3. Frontend Bugs & Component Issues

### 3.1 Misplaced `HttpClient.post` Options (Options Passed as Body Payload)
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: In both components, `{ withCredentials: true }` is passed as the 2nd argument (`body`) to `this.http.post()` instead of the 3rd argument (`options`). For example:
  `this.http.post('http://localhost:5000/api/admin/deleteUser/' + userId, { withCredentials: true })`
- **Impact**: Credentials (cookies) are not sent with the HTTP POST request, and `{ withCredentials: true }` is inadvertently sent as the JSON body payload.

### 3.2 Non-Functional Search Bar UI Element
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input field `<input type="text" placeholder="Search" class="input">` lacks event binding (`[(ngModel)]` or `(input)`), component logic, and filtering selectors.
- **Impact**: Entering text into the search bar has no effect on the displayed user list.

### 3.3 Directory Naming Typo
- **Location**: `frondend/`
- **Description**: The frontend root directory is named `frondend` instead of `frontend`.

---

## 4. Test Suite Failures & Missing Test Coverage

### 4.1 Frontend Component Unit Test Failures
- **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description**: 12 out of 14 Angular unit tests fail due to missing module imports and providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in the `TestBed` configuration.
- **Impact**: Prevents CI/CD execution and unit test verification of frontend components.

### 4.2 Missing Backend Test Suite
- **Location**: `backend/package.json`
- **Description**: The backend package lacks any unit/integration tests or test script definition.
- **Impact**: Backend API routes cannot be validated automatically.
