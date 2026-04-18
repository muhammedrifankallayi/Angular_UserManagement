# BUG REPORT

## Security Issues
1. **Password Leaks**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user data, including hashed passwords, because the exclusion logic is commented out.
2. **Unprotected Admin Routes**: Most administrative endpoints in `backend/routes/adminroute.js` (like `/users`, `/deleteUser/:id`, `/editDetails/:id`) lack authentication and authorization middleware.
3. **Hardcoded JWT Secret**: The secret key `"secret"` is hardcoded in `backend/routes/adminroute.js` and `backend/routes/routes.js`.
4. **Session Overwrite**: The `/api/admin/createuser` endpoint issues a new JWT cookie for the created user, which overwrites the administrator's session.
5. **Missing CSRF Protection**: The application lacks protection against Cross-Site Request Forgery (CSRF).

## Logic Errors
1. **Broken Search Filter**: The search input in `AdminUserlistComponent`'s template is not connected to any component logic, making it non-functional.
2. **Incorrect HttpClient Usage**: In `AdminUserlistComponent` and `AdminUsereditComponent`, `HttpClient.post` is called with options as the second argument (the request body), preventing authentication cookies from being sent.
3. **Type Inconsistency**: In `backend/models/user.js`, the `is_admin` field is defined as a `String` but has a `Boolean` default (`false`).

## Environment & Setup Issues
1. **Misspelled Directory**: The frontend directory is misspelled as `frondend` instead of `frontend`.
2. **Missing Backend Start Script**: `backend/package.json` lacks a `start` script.
3. **Missing Middleware Directory**: The `backend/middleware/` directory mentioned in development context does not exist.

## Test Failures
- **Angular Unit Tests**: 12 out of 14 tests fail with `NullInjectorError` due to missing providers (`HttpClient`, `Store`, etc.) in the test setup.
