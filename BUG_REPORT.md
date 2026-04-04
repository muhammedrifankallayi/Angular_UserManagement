# Bug Report - JWT Authentication Project

This report documents several critical security vulnerabilities, logic errors, and configuration issues identified in the codebase.

## 1. Security Vulnerabilities

### 1.1 Password Leak in Admin Users List
- **Location:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/users` endpoint returns all user data, including hashed passwords, because the exclusion logic is commented out.
- **Severity:** High
- **Impact:** Compromises user security by exposing password hashes.

### 1.2 Unprotected Administrative Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Description:** Most endpoints in `adminroute.js` (except `/active`) do not verify if the requester is an authenticated administrator.
- **Severity:** Critical
- **Impact:** Unauthorized users can list, create, edit, or delete users.

### 1.3 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Description:** The JWT signing secret is hardcoded as `"secret"`.
- **Severity:** High
- **Impact:** Makes the application vulnerable to token forgery if the secret is leaked. It should be stored in environment variables.

### 1.4 Administrative Session Overwrite
- **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
- **Description:** When an admin creates a new user, the backend issues a new JWT cookie for the *new* user, overwriting the admin's session.
- **Severity:** Medium
- **Impact:** Admins are inadvertently logged out and logged in as the newly created user after performing an administrative action.

### 1.5 Missing CSRF Protection
- **Location:** Backend Configuration (`backend/index.js`)
- **Description:** The application uses cookies for authentication and has CORS enabled with credentials, but lacks CSRF protection.
- **Severity:** Medium
- **Impact:** Risk of Cross-Site Request Forgery attacks.

## 2. Logic Errors

### 2.1 Non-functional User Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Description:** The search input in the HTML template is not connected to any logic in the component.
- **Severity:** Low
- **Impact:** Users cannot filter the user list.

### 2.2 Incorrect HttpClient usage in Angular
- **Location:** Multiple components in `frondend/jwtapp/src/app/components/`
- **Description:** `HttpClient.post` calls incorrectly pass options (like `withCredentials`) as the second argument (the request body) instead of the third argument (options).
- **Severity:** Medium
- **Impact:** Authentication cookies are not sent with POST requests, causing them to fail on protected routes.

### 2.3 Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Description:** `is_admin` is defined as a `String` but given a `Boolean` default (`false`).
- **Severity:** Low
- **Impact:** Potential for unexpected behavior when querying or updating the field.

## 3. Environment & Configuration Issues

### 3.1 Misspelled Frontend Directory
- **Location:** Root Directory
- **Description:** The frontend folder is named `frondend`.
- **Severity:** Low
- **Impact:** Confusing for developers and inconsistent with standard naming.

### 3.2 Missing Start Script in Backend
- **Location:** `backend/package.json`
- **Description:** There is no `"start": "node index.js"` script.
- **Severity:** Low
- **Impact:** Standard `npm start` command fails.

### 3.3 Failing Frontend Unit Tests
- **Location:** `frondend/jwtapp/`
- **Description:** 12 out of 14 Angular unit tests are failing, primarily due to `NullInjectorError` (missing `HttpClient` providers).
- **Severity:** Medium
- **Impact:** Harder to maintain code quality and verify changes.
