# Application Bug Report & Vulnerability Assessment

## Overview
This document provides a comprehensive report of security vulnerabilities, backend logic and schema issues, frontend bugs, and testing infrastructure deficiencies identified within the codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** The secret key used to sign and verify JSON Web Tokens is hardcoded as `"secret"` across authentication routes rather than utilizing the `jwtsecret` environment variable defined in `.env` (`process.env.jwtsecret`).
- **Impact:** Hardcoded credentials allow unauthorized parties with codebase access to forge JWT tokens and bypass authentication across user and admin accounts.

### 1.2 Missing Authentication & Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Key administrative API endpoints (including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack middleware to verify the JWT token or check if the requesting user has administrative privileges (`is_admin: true`).
- **Impact:** Any unauthenticated remote client can access, modify, delete user records, or create new user accounts by directly querying the admin endpoints.

### 1.3 Exposure of Hashed Passwords in API Responses
- **Location:** `backend/routes/adminroute.js` (`/users` route)
- **Issue:** The `GET /api/admin/users` endpoint executes `User.find({})` and returns full user documents directly without stripping out the `password` field.
- **Impact:** Passwords (hashed) are leaked to any caller querying the user list endpoint.

### 1.4 Unhandled File Upload Exceptions (Crash Vulnerability)
- **Location:** `backend/routes/routes.js` (`/profile-upload-single` route)
- **Issue:** The handler accesses `req.file.filename` assuming a file was uploaded, without checking if `req.file` exists.
- **Impact:** Sending a request without a file payload causes an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`, leading to server failure or unhandled rejection.

### 1.5 Lack of CSRF Protection & Permissive CORS Configuration
- **Location:** `backend/index.js`
- **Issue:** The application uses cookie-based JWT authentication (`httpOnly: true`) and allows credentials from `http://localhost:4200`, but lacks Anti-CSRF token verification or SameSite cookie attributes.
- **Impact:** Vulnerable to Cross-Site Request Forgery (CSRF) if an authenticated user visits a malicious origin.

---

## 2. Backend Logic & Schema Errors

### 2.1 Mongoose Schema Type Mismatch (`is_admin`)
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field in the user schema is defined with `type: String` but given a default boolean value `default: false`.
- **Impact:** Querying `User.findOne({ email: ..., is_admin: true })` causes type mismatch issues or unpredictable Mongoose type casting behavior between Boolean and String types.

### 2.2 Admin Session Cookie Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (`/createuser` route)
- **Issue:** When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP cookie on the response.
- **Impact:** The administrator's session cookie is overwritten with the newly created user's identity, automatically logging out the administrator and switching their session to the new user.

### 2.3 Non-Standard REST API Methods & Request Options Misalignment
- **Location:** `backend/routes/adminroute.js` (`/deleteUser/:id` and `/editDetails/:id`)
- **Issue:** Data retrieval (`editDetails`) and deletion (`deleteUser`) endpoints use `POST` HTTP methods with URL parameter IDs instead of standard RESTful `GET` or `DELETE` verbs.
- **Impact:** Inconsistent API design leading to frontend misconfigurations when sending empty POST request bodies.

### 2.4 Error Suppression in Catch Blocks
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** Multiple routes contain empty `catch (error) {}` blocks or log errors without returning an HTTP error status (e.g., status 500) to the client.
- **Impact:** Client requests hang indefinitely when exceptions occur, or fail silently without providing feedback to the user or frontend caller.

---

## 3. Frontend Bugs & UI Flaws

### 3.1 Incorrect `HttpClient.post` Options Argument
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Issue:** The `HttpClient.post` method signature is `post(url, body, options)`. In both components, `{ withCredentials: true }` is passed as the second argument (`body`), causing options to be sent as the POST body payload while `withCredentials` remains unset in the actual request options.
- **Impact:** Authenticated requests requiring cookies fail on cross-origin requests, and dummy option objects are sent to backend routes as the body.

### 3.2 Non-Functional Admin Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `admin-userlist.component.ts`
- **Issue:** The search input box in the user list template is static HTML without `ngModel` or event bindings. Neither the component script nor the NgRx selectors (`app.selectors.ts`) contain implementation logic to filter users.
- **Impact:** Search bar in the admin dashboard does not perform any filtering.

### 3.3 Misspelled Frontend Directory Name
- **Location:** Root directory (`frondend/`)
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Inconsistent pathing in scripts, tooling, and documentation.

---

## 4. Testing & Infrastructure Issues

### 4.1 Missing Backend Test Framework
- **Location:** `backend/package.json`
- **Issue:** The backend project has no test framework (e.g. Jest, Mocha, Supertest) configured and lacks test scripts or test files.
- **Impact:** Inability to perform automated backend regression testing.

### 4.2 Frontend Unit Test Spec Failures
- **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Issue:** Angular unit test spec files fail due to unprovided dependencies in `TestBed` setup (missing `HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Impact:** Automated `ng test` suite fails across 12 of 14 specs due to `NullInjectorError` errors.
