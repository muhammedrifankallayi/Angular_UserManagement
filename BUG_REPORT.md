# Bug Report

This document outlines the security vulnerabilities, logic errors, and configuration issues identified in the project.

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secret
*   **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
*   **Issue:** The JWT secret key is hardcoded as `"secret"`.
*   **Risk:** Extremely high. An attacker can easily sign their own tokens and gain unauthorized access if they know the secret.

### 1.2. Missing Authentication/Authorization Middleware
*   **Location:** `backend/routes/adminroute.js`
*   **Issue:** Most administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack middleware to verify if the request is from an authenticated administrator.
*   **Risk:** High. Any user (or even unauthenticated visitors) can potentially perform administrative actions if they know the endpoint.

### 1.3. Exposure of Sensitive Information (PII)
*   **Location:** `backend/routes/adminroute.js` - `/users` endpoint.
*   **Issue:** The endpoint returns the full user object from MongoDB, including the hashed `password` field.
*   **Risk:** High. Unnecessary exposure of password hashes increases the risk of brute-force attacks if the data is intercepted.

### 1.4. Lack of CSRF Protection
*   **Location:** `backend/index.js` (CORS configuration)
*   **Issue:** The application uses cookies for authentication and enables `credentials: true` in CORS but lacks Cross-Site Request Forgery (CSRF) protection.
*   **Risk:** Medium. Users could be tricked into performing actions on the site without their consent.

---

## 2. Logic Errors

### 2.1. Administrative Session Overwrite
*   **Location:** `backend/routes/adminroute.js` - `/createuser` endpoint.
*   **Issue:** When an admin creates a new user, the backend generates a new JWT for the *created user* and sets it in the administrator's browser cookie.
*   **Impact:** The administrator is effectively logged out and logged in as the newly created user.

### 2.2. Schema Type Mismatch
*   **Location:** `backend/models/user.js`
*   **Issue:** The `is_admin` field is defined as `type: String` but has a boolean default `default: false`.
*   **Impact:** Inconsistent data types can lead to unexpected behavior during queries and authorization checks.

### 2.3. Incorrect Angular HttpClient Usage
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
*   **Issue:** `this.http.post(url, options)` is used where `options` (containing `withCredentials`) is passed as the second argument (the `body`).
*   **Impact:** The request options are sent as the request body, and the actual options (like credentials) are not applied correctly.

### 2.4. Missing File Upload Validation
*   **Location:** `backend/routes/routes.js` - `/profile-upload-single`
*   **Issue:** The code accesses `req.file.filename` without checking if `req.file` exists.
*   **Impact:** The server will crash with a "TypeError" if a request is made to this endpoint without an attached file.

---

## 3. Environment and Configuration Issues

### 3.1. Misspelled Frontend Directory
*   **Location:** Root directory.
*   **Issue:** The frontend directory is named `frondend` instead of `frontend`.
*   **Impact:** Confusing for developers and potentially breaks automated scripts expecting standard naming.

### 3.2. Widespread Frontend Test Failures
*   **Location:** `frondend/jwtapp/`
*   **Status:** 12 out of 14 unit tests are failing.
*   **Issue:** `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`. Spec files are missing `HttpClientTestingModule` and `RouterTestingModule`.

### 3.3. Hardcoded Database Connection String
*   **Location:** `backend/index.js`
*   **Issue:** The MongoDB URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
*   **Impact:** Difficult to deploy to different environments (development, staging, production).
