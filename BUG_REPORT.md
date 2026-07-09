# Bug Report

## Security Vulnerabilities

1.  **Hardcoded JWT Secrets**:
    *   **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
    *   **Description**: The JWT secret is hardcoded as `"secret"` instead of using an environment variable (e.g., `process.env.jwtsecret`).
2.  **Missing Authorization Middleware**:
    *   **Files**: `backend/routes/adminroute.js`
    *   **Description**: Administrative endpoints like `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication and authorization checks. Any user (or even unauthenticated visitors) can potentially access these routes.
3.  **Sensitive Data Exposure**:
    *   **Files**: `backend/routes/adminroute.js`
    *   **Description**: The `/users` endpoint returns the full user object, including the `password` field (hashed), to the client.
4.  **Lack of CSRF Protection**:
    *   **Description**: The backend uses cookies for authentication but does not implement CSRF protection.

## Logic Errors

1.  **Admin Session Overwritten**:
    *   **File**: `backend/routes/adminroute.js`
    *   **Endpoint**: `/createuser`
    *   **Description**: When an administrator creates a new user, the server generates a new JWT for the *created* user and sets it as the `jwt` cookie. This overwrites the administrator's own session cookie, effectively logging them out and logging them in as the new user.
2.  **Inconsistent `is_admin` Type**:
    *   **File**: `backend/models/user.js`
    *   **Description**: The `is_admin` field is defined as a `String` with a default value of `false` (boolean). This type mismatch can lead to unexpected behavior during queries and logic checks.
3.  **Poor Error Handling**:
    *   **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
    *   **Description**: Many `catch` blocks are empty or only log the error to the console without sending an appropriate error response to the client. This leaves the client-side application hanging or in an uncertain state.
4.  **Missing File Existence Check**:
    *   **File**: `backend/routes/routes.js`
    *   **Endpoint**: `/profile-upload-single`
    *   **Description**: The code accesses `req.file.filename` without checking if `req.file` exists, which will cause a crash if no file is uploaded.

## Frontend Issues

1.  **Misspelled Directory Name**:
    *   **Description**: The frontend directory is named `frondend` instead of `frontend`.
2.  **Non-functional Search Input**:
    *   **File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
    *   **Description**: The search input in the admin user list is static HTML and has no backing logic in the component.
3.  **Incorrect HttpClient Calls**:
    *   **Description**: Some `HttpClient.post` calls pass options (like `withCredentials`) as the second argument (the body) instead of the third.

## Test Failures

1.  **Frontend Unit Tests**:
    *   **Current State**: 12 out of 14 tests are failing.
    *   **Primary Causes**: `NullInjectorError` due to missing providers for `HttpClient` and `Router` in the test suites.
