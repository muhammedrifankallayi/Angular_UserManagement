# Bug Report

This document outlines the identified bugs and vulnerabilities in the JWT Project.

## Backend (Node.js/Express)

### 1. Security Vulnerabilities
- **Hardcoded JWT Secret:** The JWT secret is hardcoded as `"secret"` in `backend/routes/routes.js` and `backend/routes/adminroute.js` instead of using the environment variable `process.env.jwtsecret`.
- **Missing Administrative Middleware:** Routes in `backend/routes/adminroute.js` lack middleware to verify if the requesting user has administrative privileges.
- **Sensitive Information Exposure:** The `/api/admin/users` endpoint returns full user objects including hashed passwords.
- **Inconsistent Schema Type:** The `is_admin` field in `backend/models/user.js` is defined as `String` but used with boolean defaults and logic.

### 2. Logic Errors
- **Session Overwriting:** The `/api/admin/createuser` endpoint sets a new JWT cookie for the newly created user, which overwrites the administrator's session cookie.
- **Incomplete Error Handling:** Many catch blocks in `backend/routes/routes.js` and `backend/routes/adminroute.js` are empty or only log to the console without sending an appropriate error response to the client.

## Frontend (Angular)

### 1. Functional Bugs
- **Incorrect HttpClient Call:** In `AdminUserlistComponent.deleteUser`, the `options` object (containing `withCredentials`) is passed as the second argument (body) of `http.post`, whereas `post` expects `(url, body, options)`.
- **Non-functional Search:** The search input in `AdminUserlistComponent` is static HTML and has no implementation in the component or NgRx selectors.

### 2. Unit Test Failures
- Most frontend unit tests are failing due to missing providers for `HttpClient`, `Router`, and NgRx `Store`.

## Miscellaneous
- **Directory Misspelling:** The frontend directory is misspelled as `frondend` in the repository root.
