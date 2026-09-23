# Comprehensive Bug Report

This document outlines the identified bugs, security vulnerabilities, architectural flaws, and test failure issues present across the backend and frontend components of the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** The string `"secret"` is hardcoded as the JWT signing secret key in `jwt.sign()` and `jwt.verify()` calls instead of reading from `process.env.jwtsecret` or environment variables.
- **Impact:** Anyone with knowledge of the source code can forge valid JSON Web Tokens and impersonate any user or admin.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Sensitive endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication or authorization checks.
- **Impact:** Any unauthenticated HTTP client can list users, retrieve user profile details, edit user details, or delete users without being logged in or having admin privileges.

### 1.3 Exposure of Hashed Passwords in API Responses
- **Location:** `backend/routes/adminroute.js` (`GET /users`)
- **Issue:** The `/users` endpoint returns raw user documents from MongoDB directly (`res.send(user)`), which includes the `password` field (bcrypt hash).
- **Impact:** Exposes user password hashes to anyone calling the endpoint.

### 1.4 Unchecked File Upload in Single Profile Upload Route
- **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Issue:** The route accesses `req.file.filename` directly without verifying whether `req.file` exists.
- **Impact:** If a request is sent without a file attachment, the backend throws an unhandled `TypeError` (Cannot read properties of undefined reading 'filename').

### 1.5 Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
- **Issue:** When an admin creates a new user, the route generates a new JWT token for the created user and sets it in the client's `jwt` cookie via `res.cookie("jwt", token, ...)` before sending a success response.
- **Impact:** Overwrites the logged-in administrator's active JWT cookie with the newly created user's token, effectively demoting/logging out the admin session.

---

## 2. Logic Errors & Structural Flaws

### 2.1 Inconsistent `is_admin` Data Type in User Schema
- **Location:** `backend/models/user.js`
- **Issue:** The field `is_admin` is defined with type `String` with default `false` (boolean). In `backend/routes/adminroute.js`, queries look for `{ is_admin: true }` (boolean).
- **Impact:** Mongoose type casting inconsistencies and potential query mismatch when searching for admin users.

### 2.2 Incorrect Argument Handling in Angular HttpClient `post()` Calls
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Issue:** `http.post(url, { withCredentials: true })` passes options as the second parameter (`body`) instead of the third parameter (`options`).
- **Impact:** The request body is sent as `{ withCredentials: true }` and standard HTTP options (`withCredentials: true`) are omitted from the request header configuration.

### 2.3 Non-Functional Admin User Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Issue:** Search input element exists in template HTML but lacks `ngModel` binding, event listeners, or NgRx state filtering logic.

### 2.4 Misspelled Frontend Directory Name
- **Location:** Repository Root
- **Issue:** The directory containing the Angular application is named `frondend` instead of `frontend`.

---

## 3. Frontend Unit Test Failures

### 3.1 Test Failures due to Missing Dependencies in Angular Spec Files
- **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
- **Issue:** Unit tests in Angular component spec files fail due to unprovided dependencies (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing Store providers).
- **Fix Requirement:** Spec files need `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` added to `TestBed.configureTestingModule`.
