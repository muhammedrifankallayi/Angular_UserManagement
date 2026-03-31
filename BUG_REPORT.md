# BUG REPORT

## Security Leaks

1.  **Hashed Password Leaks**:
    *   **Description**: In `backend/routes/adminroute.js`, the `/api/admin/users` endpoint returns all user data, including hashed passwords, because the exclusion logic is commented out.
    *   **Impact**: Exposes sensitive user information.
    *   **Suggested Fix**: Uncomment the password exclusion logic: `const {password, ...data} = await user.toJSON();`.

2.  **Unprotected Administrative Endpoints**:
    *   **Description**: Many administrative endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/createuser`) lack authentication and authorization middleware.
    *   **Impact**: Allows unauthorized users to perform administrative actions.
    *   **Suggested Fix**: Implement and apply authentication/authorization middleware (e.g., in `backend/middleware/auth.js`).

3.  **Hardcoded JWT Secret**:
    *   **Description**: The JWT secret `"secret"` is hardcoded in `backend/routes/adminroute.js` and `backend/routes/routes.js` for token signing and verification.
    *   **Impact**: Compromises security if the source code is exposed.
    *   **Suggested Fix**: Use the environment variable `jwtsecret` defined in `backend/.env`.

4.  **Session Overwrite on User Creation**:
    *   **Description**: In `backend/routes/adminroute.js`, the `/createuser` endpoint issues a new JWT cookie, which overwrites the administrator's existing session cookie.
    *   **Impact**: Forces the administrator to log out after creating a new user.
    *   **Suggested Fix**: Avoid setting a new cookie when an administrator creates a user.

5.  **Lack of CSRF Protection**:
    *   **Description**: The application lacks CSRF protection, although CORS allows credentials for `http://localhost:4200`.
    *   **Impact**: Potential for Cross-Site Request Forgery attacks.
    *   **Suggested Fix**: Implement a CSRF protection mechanism (e.g., using `csurf` middleware).

## Logic Errors

1.  **Broken Search Filter**:
    *   **Description**: In `AdminUserlistComponent`, the search input in the template is not connected to any component logic, making the filter non-functional.
    *   **Impact**: Users cannot search for other users.
    *   **Suggested Fix**: Bind the search input to a variable and implement a filtering pipe or logic.

2.  **Incorrect HttpClient Usage**:
    *   **Description**: In `AdminUserlistComponent` and `AdminUsereditComponent`, `HttpClient.post` calls incorrectly pass options (e.g., `{withCredentials: true}`) as the second argument instead of the third.
    *   **Impact**: Prevents authentication cookies from being sent in POST requests.
    *   **Suggested Fix**: Pass the request body as the second argument and options as the third.

3.  **Type Inconsistency**:
    *   **Description**: In `backend/models/user.js`, the `is_admin` field is defined as a `String` but has a `Boolean` default (`false`).
    *   **Impact**: Potential for data type mismatch and unexpected behavior.
    *   **Suggested Fix**: Change the `is_admin` type to `Boolean` or the default value to `"false"`.

## Environment and Dependency Issues

1.  **Misspelled Directory**:
    *   **Description**: The frontend directory is misspelled as `frondend` instead of `frontend`.
    *   **Impact**: Inconsistency and potential confusion.
    *   **Suggested Fix**: Rename the directory to `frontend`.

2.  **Missing Backend Start Script**:
    *   **Description**: The `package.json` in the `backend/` directory lacks a `start` script.
    *   **Impact**: Prevents standard `npm start` execution.
    *   **Suggested Fix**: Add `"start": "node index.js"` to `backend/package.json`.

## Test Failures

*   **Frontend Tests**: 12 out of 14 Angular unit tests fail with `NullInjectorError` because of missing providers (`HttpClient`, `Store`, `Router`, etc.) in the `TestBed` configuration.
    *   **Suggested Fix**: Update `.spec.ts` files to include necessary modules and mock providers (`HttpClientTestingModule`, `provideMockStore`, `RouterTestingModule`).
