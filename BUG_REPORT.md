# Bug Report - JWT App Project

This document outlines the security vulnerabilities, logic errors, test failures, and environment issues identified in the project.

## Security Vulnerabilities

1.  **Hashed Password Leak**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns the full user object, including the hashed password. The code to exclude the password is currently commented out.
2.  **Unprotected Administrative Routes**: Several administrative endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`) do not have any authentication or authorization middleware, allowing anyone with access to the API to perform administrative actions.
3.  **Hardcoded JWT Secret**: The JWT secret `"secret"` is hardcoded in both `backend/routes/routes.js` and `backend/routes/adminroute.js` instead of being stored in an environment variable.
4.  **Admin Session Overwrite**: In `backend/routes/adminroute.js`, the `/createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the administrator's session cookie, effectively logging out the admin.
5.  **Lack of CSRF Protection**: The application lacks Cross-Site Request Forgery (CSRF) protection, even though it uses cookies for authentication.
6.  **Insecure File Upload**: The `multer` configuration in `backend/routes/routes.js` uses `./file` as a destination without any file type or size validation.

## Logic Errors

1.  **Broken Search Functionality**: The search input in the `AdminUserlistComponent` template (`frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`) is not connected to any component logic. It is just a static HTML element.
2.  **Type Inconsistency in User Model**: The `is_admin` field in `backend/models/user.js` is defined as a `String` with a `Boolean` default (`false`), which can lead to unexpected behavior during database operations.
3.  **Incorrect Angular `HttpClient.post` Usage**: In `AdminUserlistComponent` and `AdminUsereditComponent`, the `withCredentials: true` option is passed as the second argument to `this.http.post`, which is meant for the request body. This prevents authentication cookies from being sent.
4.  **Missing Error Handling**: Many backend routes lack proper error handling or only log the error to the console, often sending empty or confusing responses to the client.

## Test Failures

1.  **Angular Unit Test Failures**: 12 out of 14 Angular unit tests in `frondend/jwtapp/` are failing.
    -   **Cause**: `NullInjectorError: No provider for HttpClient!` and similar errors for `Store`, `Router`, and `FormBuilder`.
    -   **Fix**: Update `TestBed` configuration to include `HttpClientTestingModule`, `provideMockStore`, `RouterTestingModule`, and `FormsModule`.

## Environment and Configuration Issues

1.  **Misspelled Frontend Directory**: The frontend directory is named `frondend` instead of `frontend`, leading to potential confusion and paths that are hard to maintain.
2.  **Missing Start Script in Backend**: The `backend/package.json` file lacks a `start` script. The server must be started manually using `node index.js`.
3.  **Hardcoded Backend URL in Frontend**: The Angular components have the backend URL (`http://localhost:5000`) hardcoded, which should be moved to environment configuration files.
4.  **Incomplete `package.json`**: Some dependencies might be missing or incorrectly versions, and there's no clear build or test process defined for the entire project.
