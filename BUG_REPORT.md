# Bug Report

## Security Leaks
1. **Password Leak in Admin Route**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user data, including hashed passwords, because the exclusion logic is commented out.
2. **Unprotected Administrative Endpoints**: Several endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware, allowing any requester to perform administrative actions.
3. **Hardcoded JWT Secret**: The JWT signing and verification processes in `backend/routes/adminroute.js` and `backend/routes/routes.js` use a hardcoded secret string `"secret"`.
4. **Session Overwrite on User Creation**: The `/createuser` endpoint in `backend/routes/adminroute.js` issues a new JWT cookie upon successful user creation, which overwrites the existing administrator's session.

## Logic Errors
1. **Broken Search Filter**: The search input in the `AdminUserlistComponent` template is not bound to any component logic, rendering the user search functionality non-functional.
2. **Incorrect HttpClient Usage**: In `AdminUserlistComponent` and `AdminUsereditComponent`, `HttpClient.post` calls pass the options object (containing `withCredentials: true`) as the second argument (request body) instead of the third, preventing authentication cookies from being sent.
3. **Model Type Inconsistency**: The `is_admin` field in `backend/models/user.js` is defined as a `String` but initialized with a `Boolean` default (`false`), leading to potential type-related issues.

## Environment Issues
1. **Misspelled Directory**: The frontend directory is named `frondend` instead of `frontend`.
2. **Missing Backend Start Script**: The `backend/package.json` does not contain a `start` script, requiring the server to be started manually with `node index.js`.

## Test Failures
1. **Frontend Unit Tests**: Multiple Angular unit tests fail with `NullInjectorError` due to missing providers (`provideMockStore`, `HttpClientTestingModule`, `FormsModule`, and `RouterTestingModule`) in the test configuration.
