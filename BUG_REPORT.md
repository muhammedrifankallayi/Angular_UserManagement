# Bug Report - JWT Project (Angular & Node.js)

This report documents the security vulnerabilities, logic errors, and test failures found in the project.

## Security Vulnerabilities

1.  **Hardcoded JWT Secret**:
    *   **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`.
    *   **Issue**: The JWT secret is hardcoded as `"secret"` in `jwt.sign()` and `jwt.verify()` calls, even though a `jwtsecret` is defined in `backend/.env`.
2.  **Missing Authentication/Authorization Middleware**:
    *   **Location**: `backend/routes/adminroute.js`.
    *   **Issue**: Several admin routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have any middleware to verify if the requester is an authenticated administrator.
3.  **Sensitive Data Exposure**:
    *   **Location**: `backend/routes/adminroute.js` (endpoint `/users`).
    *   **Issue**: The `/users` endpoint returns the full user object, including the hashed `password` field, which should never be sent to the client.
4.  **CORS Insecure Configuration**:
    *   **Location**: `backend/index.js`.
    *   **Issue**: While it specifies an origin, the lack of CSRF protection while using `credentials: true` with cookies is a risk.

## Logic Errors

1.  **Admin Create User Cookie Overwrite**:
    *   **Location**: `backend/routes/adminroute.js` (endpoint `/createuser`).
    *   **Issue**: When an admin creates a new user, the backend sets a new JWT cookie for the *created user*, which effectively logs the admin out and logs them in as the new user.
2.  **Inconsistent Type for `is_admin`**:
    *   **Location**: `backend/models/user.js`.
    *   **Issue**: The `is_admin` field is defined as `type: String`, but it has a `default: false` (boolean). This can cause issues with queries and type checks.
3.  **Incorrect HttpClient Usage (Frontend)**:
    *   **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`.
    *   **Issue**: In `deleteUser`, `this.http.post` is called with the request options (including `withCredentials`) as the *second* argument. For POST requests, the second argument is the body, and the third is the options. This means the options are being sent as the request body.
4.  **Search Functionality Missing Implementation**:
    *   **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`.
    *   **Issue**: There is a search input in the HTML, but it is not bound to any component logic, so it doesn't actually filter the user list.

## Infrastructure & Maintenance Issues

1.  **Misspelled Frontend Directory**:
    *   **Issue**: The frontend directory is named `frondend` instead of `frontend`.
2.  **Unit Test Failures**:
    *   **Issue**: 12 out of 14 Angular unit tests are failing. Most failures are `NullInjectorError` because `HttpClient` and `Router` providers are missing in the test configuration of various component spec files.

## Summary of Test Failures
| Component | Status | Error |
|-----------|--------|-------|
| NavComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| DashboardComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| HomeComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| LoginComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| RegisterComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| AdminCreateuserComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| AdminLoginComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| ProfileComponent | FAILED | NullInjectorError: No provider for HttpClient! |
| ... and others | FAILED | ... |
