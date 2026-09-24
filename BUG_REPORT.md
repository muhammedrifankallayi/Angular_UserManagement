# Comprehensive Bug Report

This document outlines identified security vulnerabilities, backend logic errors, frontend UI/logic issues, and unit testing failures across the codebase.

---

## 1. Backend Security Vulnerabilities & Configuration Issues

### 1.1 Hardcoded JWT Secret
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** JWT signing (`jwt.sign`) and verification (`jwt.verify`) use a hardcoded string literal `"secret"` instead of loading the environment variable `process.env.jwtsecret` defined in `.env`.
* **Impact:** Attackers who inspect source code can forge valid JWT tokens.

### 1.2 Missing Authentication & Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Several administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack JWT authentication and admin role checks.
* **Impact:** Any unauthenticated client or non-admin user can access, modify, create, or delete user accounts via these endpoints.

### 1.3 Sensitive Data Exposure (Password Hashes Returned in API)
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Description:** The `/users` route returns raw MongoDB user objects including hashed passwords (`User.find({})`) without stripping or projecting out the `password` field.
* **Impact:** Exposes user password hashes to any client querying the endpoint.

### 1.4 Hardcoded MongoDB Connection String
* **Location:** `backend/index.js`
* **Description:** The database connection URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded in the application entry point instead of utilizing environment variables.
* **Impact:** Reduces environment portability and exposes connection details in source control.

### 1.5 Mismatched Schema Type for Admin Flag
* **Location:** `backend/models/user.js`
* **Description:** `is_admin` is defined with type `String` but given a boolean default value `default: false`.
* **Impact:** Can cause inconsistent query evaluations when querying `is_admin: true` vs `is_admin: "true"`.

---

## 2. Backend Logic Errors & Resilience Issues

### 2.1 Admin Session Overwritten Upon User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Description:** When an administrator creates a new user, the route generates a JWT for the newly created user and attaches it as a `jwt` cookie in the response (`res.cookie("jwt", token, ...)`).
* **Impact:** Overwrites the administrator's authentication session cookie with the new user's session, logging out the administrator.

### 2.2 Unhandled Null File Upload Crash
* **Location:** `backend/routes/routes.js` (`POST /api/routes/profile-upload-single`)
* **Description:** The endpoint accesses `req.file.filename` without verifying if `req.file` exists.
* **Impact:** If a request is sent without a file attachment, Node.js throws an unhandled `TypeError` (Cannot read properties of undefined), causing a 500 error or server crash.

### 2.3 Poor Error Handling and Request Hanging
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Multiple routes contain empty `catch` blocks or catch blocks that only execute `console.log(error.message)` without sending an HTTP error response to the client.
* **Impact:** Clients making failed requests hang until timeout occurs.

---

## 3. Frontend Bugs & Defects

### 3.1 Incorrect `HttpClient.post` Parameter Ordering
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
* **Description:** `HttpClient.post` calls pass options objects (e.g. `{ withCredentials: true }`) as the second argument (request body) rather than the third argument (options configuration).
* **Impact:** Requests fail to send HTTP cookies (`withCredentials`), causing authentication/session failures on backend calls, while sending `{ withCredentials: true }` as the request payload body.

### 3.2 Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element (`<input type="text" placeholder="Search" class="input">`) is purely static HTML without data binding (`[(ngModel)]` or `(input)` handlers) or integration with NgRx store selectors/actions.
* **Impact:** Search functionality is completely non-operational.

### 3.3 Directory Typo
* **Location:** Repository root
* **Description:** The frontend application root directory is named `frondend` instead of `frontend`.

---

## 4. Test Suite & Testing Failures

### 4.1 Missing Providers in Frontend Unit Test Specifications
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:** 12 out of 14 Angular component test specs fail during execution (`ng test`). The test specs do not import or configure `HttpClientTestingModule`, `RouterTestingModule`, or `provideMockStore`.
* **Impact:** `NullInjectorError: No provider for HttpClient!` and `No provider for Router!` occur across the test suite, preventing automated continuous integration verification.
