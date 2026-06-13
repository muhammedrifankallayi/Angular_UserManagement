# Bug Report - JWT Project

This report documents identified bugs, security vulnerabilities, and inconsistencies in the codebase as of June 2023.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location:**
    - `backend/routes/routes.js` (Multiple lines)
    - `backend/routes/adminroute.js` (Multiple lines)
- **Description:** The string `"secret"` is used directly as the JWT signing/verification key across multiple routes.
- **Impact:** Critical security risk. Secrets should be stored in environment variables (e.g., `process.env.jwtsecret`) and never committed to source control.
- **Suggested Fix:** Replace `"secret"` with `process.env.jwtsecret` and ensure `.env` is properly loaded.

### 1.2 Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Affected Routes:** `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`
- **Description:** These sensitive administrative routes lack middleware to verify if the request comes from an authenticated admin user.
- **Impact:** Critical. Unauthorized users can list, edit, delete, or create users if they know the endpoint.
- **Suggested Fix:** Implement and apply a `verifyToken` and `isAdmin` middleware to these routes.

## 2. Logic Errors

### 2.1 Admin Session Hijacking (Cookie Overwrite)
- **Location:** `backend/routes/adminroute.js` (Inside `/createuser` route)
- **Description:** When an admin creates a new user, the server generates a new JWT for the *newly created user* and sends it back in a `jwt` cookie.
- **Impact:** Major. The admin's own session cookie is overwritten by the new user's token, effectively logging the admin out or switching their session to the new user.
- **Suggested Fix:** Do not set a cookie when an admin creates a user.

### 2.2 Suppressed Exceptions
- **Location:**
    - `backend/routes/adminroute.js` (Empty catch blocks on lines 46, 93, 137)
    - `backend/routes/routes.js` (Empty catch block on line 119)
- **Description:** Several `try-catch` blocks are empty, meaning errors are silently ignored.
- **Impact:** Hinders debugging and can leave the application in an inconsistent state.
- **Suggested Fix:** Log the errors using `console.error` and return appropriate HTTP error status codes.

## 3. Inconsistencies and Typos

### 3.1 Schema Type Mismatch
- **Location:** `backend/models/user.js` (Line 17)
- **Description:** The `is_admin` field is defined as `type: String`, but its default value is `false` (a Boolean).
- **Impact:** Minor to Moderate. Can cause confusion and potential issues with MongoDB queries or strict type checking.
- **Suggested Fix:** Change `type: String` to `type: Boolean`.

### 3.2 Directory Misspelling
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Low. Developer confusion and unprofessional project structure.
- **Suggested Fix:** Rename `frondend` to `frontend`.

## 4. Test Suite Status

### 4.1 Frontend Unit Tests
- **Status:** **12 FAILED**, 2 SUCCESS (out of 14 tests)
- **Primary Error:** `NullInjectorError: No provider for HttpClient!`
- **Description:** Most component tests fail because they don't provide the necessary dependencies (like `HttpClient` or `Router`) in their `TestBed` configuration.
- **Impact:** High. The test suite is currently unreliable for verifying code changes.
- **Suggested Fix:** Update spec files to include `HttpClientTestingModule` and other required providers/mocks.
