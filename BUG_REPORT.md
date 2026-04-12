# Bug Report

This report documents the security vulnerabilities, logic errors, environment issues, and test failures identified in the project.

## Security Vulnerabilities

1.  **Password Hash Leak**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns full user objects, including hashed passwords, because the exclusion logic is commented out.
2.  **Unprotected Administrative Routes**: Administrative endpoints in `backend/routes/adminroute.js` lack authentication and authorization middleware. The `backend/middleware/auth.js` file is missing.
3.  **Hardcoded Secrets**: The JWT secret `'secret'` is hardcoded in both `backend/routes/routes.js` and `backend/routes/adminroute.js`, as well as defined in `backend/.env`.
4.  **Missing CSRF Protection**: The application lacks Cross-Site Request Forgery (CSRF) protection, and the backend CORS configuration allows credentials for `http://localhost:4200`.
5.  **Session Overwrite**: In `backend/routes/adminroute.js`, the `createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the administrator's existing session.

## Logic Errors

1.  **Broken Search Filter**: The search input in `AdminUserlistComponent` (frontend) is not connected to any component logic, making the filter non-functional.
2.  **Incorrect HttpClient Usage**: Frontend `HttpClient.post` calls in `AdminUserlistComponent` and `AdminUsereditComponent` incorrectly pass the options object (containing `withCredentials: true`) as the second argument (request body) instead of the third.
3.  **Type Inconsistency**: The `is_admin` field in `backend/models/user.js` is defined as a `String` with a `Boolean` default (`false`), leading to potential type issues.

## Environment Issues

1.  **Misspelled Directory**: The frontend directory is misspelled as `frondend` throughout the repository.
2.  **Missing Backend Scripts**: The `backend/package.json` file is missing a `start` script.

## Test Failures

### Frontend (Angular)
- **Results**: 12 out of 14 tests failed.
- **Root Cause**: `NullInjectorError: No provider for HttpClient!`. Tests require `HttpClientTestingModule` (and likely `RouterTestingModule`, `FormsModule`, and `provideMockStore`) to be added to the `TestBed` configuration.

### Backend (Node.js)
- **Results**: No tests specified. Running `npm test` returns an error.
