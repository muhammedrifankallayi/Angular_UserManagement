# Bug Report

This document outlines the bugs and vulnerabilities identified in the JWT authentication project.

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Severity:** Critical
- **Description:** The JWT signing and verification process uses a hardcoded string `"secret"` instead of the environment variable defined in `.env`.
- **Impact:** Compromises the security of the entire authentication system.

### 1.2. Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (`/users` endpoint)
- **Severity:** Critical
- **Description:** The `/api/admin/users` endpoint returns all user data, including hashed passwords, because the exclusion logic is commented out.
- **Impact:** Potential for unauthorized access to user accounts if the database hashes are leaked.

### 1.3. Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Severity:** High
- **Description:** Administrative endpoints lack middleware to verify if the requester is an authenticated administrator. Although some individual routes check for a JWT, there is no consistent middleware (the file `backend/middleware/auth.js` is missing).
- **Impact:** Potential for unauthorized users to access administrative functions.

### 1.4. Missing CSRF Protection
- **Location:** `backend/index.js`
- **Severity:** Medium
- **Description:** The backend allows credentials from `http://localhost:4200` but does not implement CSRF protection.
- **Impact:** Vulnerability to Cross-Site Request Forgery attacks.

---

## 2. Logic Errors

### 2.1. Administrative Session Overwrite
- **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
- **Severity:** High
- **Description:** When an admin creates a new user, the backend issues a new JWT cookie for the newly created user.
- **Impact:** This overwrites the administrator's session cookie, effectively logging them out after creating a user.

### 2.2. Broken Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Severity:** Medium
- **Description:** The search input in the admin user list template is not bound to any logic in the component.
- **Impact:** Users cannot filter the user list.

### 2.3. Incorrect `withCredentials` Configuration
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Severity:** Medium
- **Description:** In several `http.post` calls, `{ withCredentials: true }` is passed as the second argument (the request body) instead of the third argument (the options).
- **Impact:** Authentication cookies are not sent with these POST requests, leading to "unauthenticated" errors.

### 2.4. Schema Type Mismatch
- **Location:** `backend/models/user.js`
- **Severity:** Low
- **Description:** The `is_admin` field is defined as a `String` but initialized with a boolean `false`.
- **Impact:** Potential for inconsistent data or query failures if not handled carefully.

---

## 3. Configuration & Environment

### 3.1. Directory Misspelling
- **Location:** Root directory
- **Severity:** Low
- **Description:** The frontend directory is misspelled as `frondend`.
- **Impact:** Minor annoyance, but can cause confusion and issues with automated scripts.

### 3.2. Widespread Frontend Test Failures
- **Location:** `frondend/jwtapp/`
- **Severity:** Medium
- **Description:** Many Angular unit tests fail with `NullInjectorError: No provider for HttpClient!`.
- **Impact:** Difficult to verify frontend changes and maintain code quality.
