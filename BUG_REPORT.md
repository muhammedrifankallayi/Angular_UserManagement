# Comprehensive Bug Report

This document outlines security vulnerabilities, backend logic errors, database schema inconsistencies, frontend bugs, and unit test failures discovered across the codebase.

---

## 1. Security Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Impact:** Critical
* **Description:** Administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack JWT authentication and role-based access control (admin authorization check) middleware. Any unauthenticated client or regular non-admin user can execute privileged administrative operations (e.g., listing all users, deleting users, modifying user details).

### 1.2 Sensitive Password Hashes Exposed in User List API Response
* **Location:** `backend/routes/adminroute.js` (Endpoint: `GET /users`)
* **Impact:** High
* **Description:** The `GET /users` endpoint returns raw user database documents directly without stripping out sensitive fields like `password`. Exposing password hashes allows potential attackers to attempt offline cracking.

### 1.3 Hardcoded JWT Secrets Instead of Environment Variables
* **Location:** `backend/routes/routes.js` & `backend/routes/adminroute.js`
* **Impact:** High
* **Description:** JWT signing and verification calls hardcode the secret string `"secret"` (e.g., `jwt.sign(..., "secret")` and `jwt.verify(cookie, "secret")`) rather than reading `process.env.jwtsecret` configured in `.env`.

### 1.4 Unchecked File Upload Handling (Potential Crash / Arbitrary File Upload)
* **Location:** `backend/routes/routes.js` (Endpoint: `POST /profile-upload-single`)
* **Impact:** Medium
* **Description:** The route accesses `req.file.filename` assuming a file was provided in the request payload. If a request is sent without a file attachment, `req.file` is `undefined`, causing an unhandled `TypeError` that crashes request execution or generates unhandled server errors.

### 1.5 Lack of CSRF Protection & Permissive CORS Configuration
* **Location:** `backend/index.js`
* **Impact:** Medium
* **Description:** The Express application uses `cookie-parser` for authentication cookies (`jwt`) with `credentials: true`, but lacks CSRF tokens or SameSite attribute configurations to protect endpoints against Cross-Site Request Forgery (CSRF).

---

## 2. Backend Logic & Database Schema Issues

### 2.1 Mongoose User Schema `is_admin` Field Type Inconsistency
* **Location:** `backend/models/user.js`
* **Impact:** Medium
* **Description:** The `is_admin` field in the user Mongoose schema is defined as `type: String` with `default: false` (a boolean). This creates type inconsistency when querying for admin users or performing boolean assertions.

### 2.2 Admin Session Cookie Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` (Endpoint: `POST /createuser`)
* **Impact:** Medium
* **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP cookie on the response. This overwrites the administrator's active session cookie, immediately logging the administrator out and switching their active session to the newly created user.

### 2.3 Poor Error Handling & Silent Exception Suppression
* **Location:** `backend/routes/routes.js` & `backend/routes/adminroute.js`
* **Impact:** Medium
* **Description:** Multiple routes feature empty `catch` blocks or log errors to stdout without returning appropriate HTTP error responses (e.g., HTTP 500) to the client, leading to hung client requests or indeterminate state.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1 Angular `HttpClient.post` Parameter Misplacement
* **Location:**
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser` method)
  * `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers` method)
* **Impact:** High
* **Description:** Angular's `HttpClient.post()` signature is `post(url, body, options)`. In `deleteUser` and `getusers`, `{ withCredentials: true }` is passed as the 2nd argument (request body) instead of the 3rd argument (options). As a result, the backend receives `{ withCredentials: true }` as the request body, and HTTP requests are dispatched without `withCredentials: true`, causing cookie transmission to fail.

### 3.2 Non-Functional Static Search Input in Admin User List
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
* **Impact:** Low
* **Description:** The search bar UI element in the admin user list component is static HTML and lacks two-way data binding (`[(ngModel)]`), event listeners, component logic, and NgRx selector logic to filter users.

### 3.3 Spelling Error in Frontend Directory Name
* **Location:** `frondend/` (Root directory)
* **Impact:** Low
* **Description:** The frontend root directory is misspelled as `frondend` instead of `frontend`.

---

## 4. Frontend Unit Test Suite Failures

* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Impact:** Medium
* **Description:** 12 out of 14 Angular frontend unit tests fail when executing `./node_modules/.bin/ng test`. The failures are primarily due to missing testing module imports (`HttpClientTestingModule`, `RouterTestingModule`) and missing provider mocks (`provideMockStore`, `appService`) in component test specifications.
