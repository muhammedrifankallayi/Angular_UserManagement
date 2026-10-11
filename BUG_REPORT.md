# Bug Report & System Architecture Audit

## Executive Summary
This document provides a comprehensive report of bugs, security vulnerabilities, architectural flaws, and test failures identified across the full-stack repository (Node.js/Express backend and Angular 16 frontend).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
* **Location:** `backend/routes/routes.js` (Lines 36, 61, 78, 108, 126) and `backend/routes/adminroute.js` (Lines 22, 53, 169)
* **Description:** The string literal `"secret"` is used directly as the secret key in `jwt.sign()` and `jwt.verify()` calls instead of accessing `process.env.jwtsecret`.
* **Impact:** High security risk; sensitive credentials and JWT secrets are exposed in source code and cannot be configured per environment.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
* **Location:** `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
* **Description:** Unlike `/active`, administrative routes (`/users`, `/deleteUser/:id`, etc.) lack JWT verification and role checks (`is_admin`).
* **Impact:** Critical; any unauthenticated HTTP client can delete users, query all users, or modify user details without authorization.

### 1.3 Sensitive Data Exposure (Passwords in API Responses)
* **Location:** `backend/routes/adminroute.js` (Line 69)
* **Description:** The `/api/admin/users` endpoint returns full user MongoDB documents (`User.find({})`) including hashed passwords (`password` field).
* **Impact:** High; exposes hashed passwords of all users to callers of the `/users` route.

### 1.4 Admin Session Overwritten on Admin User Creation
* **Location:** `backend/routes/adminroute.js` (Lines 169-174)
* **Description:** In `/api/admin/createuser`, after creating a new user, a new JWT token is issued for the newly created user and sent in the `res.cookie("jwt", token)` response.
* **Impact:** Medium/High; creating a new user silently logs out the administrator and logs them in as the newly created user.

### 1.5 Missing CSRF Protection & Permissive CORS Configuration
* **Location:** `backend/index.js` (Lines 8-11)
* **Description:** Express relies on cookie-based JWT authentication (`credentials: true`) without implementing CSRF tokens or SameSite cookie restrictions.
* **Impact:** Vulnerable to Cross-Site Request Forgery (CSRF) attacks.

---

## 2. Backend Logic Errors & Schema Flaws

### 2.1 Schema Type Mismatch for `is_admin`
* **Location:** `backend/models/user.js` (Lines 15-18)
* **Description:** In `userSchema`, `is_admin` is defined with type `String` but has a default value of `false` (boolean literal).
* **Impact:** Inconsistent data types in MongoDB and potential comparison bugs when checking `is_admin`.

### 2.2 Unhandled Missing File in File Upload Route
* **Location:** `backend/routes/routes.js` (Line 115)
* **Description:** The `/profile-upload-single` endpoint attempts to access `req.file.filename` without verifying if `req.file` exists.
* **Impact:** Causes an unhandled exception (`TypeError: Cannot read properties of undefined`) if a request is made without a file payload.

### 2.3 Poor Error Handling & Empty Catch Blocks
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Description:** Multiple asynchronous handlers feature empty `catch` blocks or log errors to stdout without sending an HTTP error response (e.g. `adminroute.js` lines 42, 81, 105, 180).
* **Impact:** Requests hang indefinitely on exceptions, resulting in poor API reliability and debugging difficulty.

---

## 3. Frontend Bugs & Issues

### 3.1 Incorrect HttpClient Request Parameter Order in Admin Components
* **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (Line 38)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (Line 92)
* **Description:** Calls to `this.http.post(url, { withCredentials: true })` pass options as the 2nd argument (request body) instead of the 3rd argument (`http.post(url, body, options)`).
* **Impact:** Requests send `{ withCredentials: true }` as the request payload and omit `withCredentials` from the HTTP request options, causing cookie authentication to fail.

### 3.2 Non-Functional Search Input in User List Component
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element is static HTML without `[(ngModel)]`, event bindings, or corresponding filtering logic in `AdminUserlistComponent` or state selectors.
* **Impact:** Users cannot filter or search through the user list.

### 3.3 Misspelled Directory Name
* **Location:** `frondend/` (Root level)
* **Description:** The frontend application folder is named `frondend` instead of `frontend`.

---

## 4. Test Suite & Build Status

### 4.1 Backend
* **Status:** No unit or integration tests exist in `backend/`.

### 4.2 Frontend (Angular)
* **Status:** Multiple spec files fail during `ng test` execution due to missing test module providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).

---

## 5. Summary Recommendations

1. Replace string literal `"secret"` in JWT calls with `process.env.jwtsecret`.
2. Introduce an authentication and authorization middleware (e.g., `verifyAdminToken`) for all `/api/admin/*` endpoints.
3. Exclude `password` from the query projection in `/api/admin/users`.
4. Remove JWT cookie setting logic from `/api/admin/createuser`.
5. Fix `HttpClient.post` signature usages in `AdminUserlistComponent` and `AdminUsereditComponent`.
6. Update `is_admin` schema definition in `backend/models/user.js` to `Boolean`.
7. Add proper error responses in `catch` blocks across all backend route handlers.
