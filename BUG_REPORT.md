# Bug Report

This report documents the security leaks, logic errors, and broken tests identified in the project.

## Backend Issues

### Security Leaks
1.  **Hashed Password Leak**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns the full user objects from the database, including hashed passwords. The logic to exclude the password is currently commented out.
2.  **Unprotected Administrative Endpoints**: Several administrative endpoints in `backend/routes/adminroute.js` (including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`) lack any authentication or authorization middleware.
3.  **Hardcoded JWT Secret**: The JWT secret key is hardcoded as `"secret"` in both `backend/routes/adminroute.js` and `backend/routes/routes.js` instead of using an environment variable.

### Logic Errors
1.  **`is_admin` Type Inconsistency**: In `backend/models/user.js`, the `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
2.  **Session Overwriting in `createuser`**: The `/api/admin/createuser` endpoint in `backend/routes/adminroute.js` generates a new JWT for the newly created user and sets it in the `jwt` cookie. If an administrator is using this endpoint, their own session cookie will be overwritten by the new user's token.
3.  **Missing Start Script**: The `backend/package.json` file lacks a `start` script, requiring the server to be started manually using `node index.js`.

## Frontend Issues

### Logic and UX Errors
1.  **Broken Search Filter**: The search input in the `AdminUserlistComponent` template (`frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`) is not bound to any component logic, making the search functionality non-functional.
2.  **Incorrect `HttpClient.post` Usage**: In `AdminUserlistComponent` and `AdminUsereditComponent`, `this.http.post` is called with the options object (containing `withCredentials: true`) as the second argument. Since the second argument of `post` is the request body, the options are being sent as the payload, and the actual options are missing, leading to authentication failures (cookies not being sent).
3.  **Misspelled Directory**: The main frontend directory is misspelled as `frondend` instead of `frontend`.

### Test Failures
1.  **Broken Unit Tests**: Currently, 12 out of 14 Angular unit tests fail. Most failures are `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` or similar providers are missing from the test suites' `TestBed` configurations.

---
*End of Report*
