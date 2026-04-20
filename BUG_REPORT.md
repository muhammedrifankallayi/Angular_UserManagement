# Bug Report

## Security Leaks

1. **Password Leak**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user data, including hashed passwords, because the exclusion logic is commented out.
2. **Unprotected Administrative Routes**: Many administrative endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`) lack authentication and authorization middleware.
3. **Hardcoded Secrets**: The JWT secret `"secret"` is hardcoded in `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`.
4. **Missing CSRF Protection**: The backend CORS configuration allows credentials but the application does not implement CSRF protection.
5. **Session Overwrite**: The `/createuser` endpoint in `backend/routes/adminroute.js` issues a new JWT cookie, which overwrites the administrator's session during user creation.

## Logic Errors

1. **Broken Search**: The search input in `AdminUserlistComponent` template is not connected to any logic, making it non-functional.
2. **Incorrect HttpClient Usage**: Frontend `HttpClient.post` calls in `AdminUserlistComponent` and `AdminUsereditComponent` incorrectly pass options (containing `withCredentials: true`) as the second argument (request body) instead of the third.
3. **Type Inconsistency**: The `is_admin` field in `backend/models/user.js` is defined as a `String` but has a `Boolean` default (`false`).

## Structural and Environment Issues

1. **Misspelled Directory**: The frontend directory is misspelled as `frondend` instead of `frontend`.
2. **Missing Scripts**: The backend `package.json` is missing a `start` script.

## Test Failures

- Angular unit tests (12 out of 14) fail with `NullInjectorError` due to missing providers (`provideMockStore`, `HttpClientTestingModule`, `FormsModule`, and `RouterTestingModule`).
