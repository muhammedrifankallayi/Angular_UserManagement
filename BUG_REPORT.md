# Bug Report

## Security Vulnerabilities

1.  **Password Leak (Hashed Passwords):**
    *   **Endpoint:** `GET /api/admin/users` in `backend/routes/adminroute.js`.
    *   **Issue:** The logic to exclude passwords from the user list is commented out. As a result, the endpoint returns the entire user object, including the hashed password.
2.  **Unprotected Administrative Routes:**
    *   **Endpoints:** Multiple endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`).
    *   **Issue:** These routes lack authentication and authorization middleware. Anyone can access these endpoints without a valid administrator session.
3.  **Hardcoded and Insecure JWT Secret:**
    *   **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`.
    *   **Issue:** The JWT secret is hardcoded as `"secret"` in the code and also defined as `"secret"` in the `.env` file. This is extremely insecure and makes the tokens easy to forge.
4.  **Missing CSRF Protection:**
    *   **Issue:** The application uses cookie-based authentication and allows credentials from `http://localhost:4200` but does not implement any Cross-Site Request Forgery (CSRF) protection.
5.  **Administrative Session Overwrite:**
    *   **Endpoint:** `POST /api/admin/createuser` in `backend/routes/adminroute.js`.
    *   **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, effectively logging the administrator out and logging them in as the new user.

## Logic Errors

1.  **Broken Search Functionality:**
    *   **Component:** `AdminUserlistComponent` (`frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`).
    *   **Issue:** The search input field is not bound to any component property or logic, making the search feature non-functional.
2.  **Incorrect HttpClient Usage:**
    *   **Components:** `AdminUserlistComponent` and `AdminUsereditComponent`.
    *   **Issue:** In several `http.post` calls, the `options` object (containing `withCredentials: true`) is passed as the second argument (the request body) instead of the third argument. This prevents authentication cookies from being sent to the backend.
3.  **Type Inconsistency in User Model:**
    *   **Location:** `backend/models/user.js`.
    *   **Issue:** The `is_admin` field is defined with type `String` but has a default value of `false` (a Boolean).

## Environment and Configuration Issues

1.  **Directory Misspelling:**
    *   **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.
2.  **Missing Backend Start Script:**
    *   **File:** `backend/package.json`.
    *   **Issue:** There is no `start` script defined. The server must be started manually using `node backend/index.js`.
3.  **Incomplete Backend Dependencies:**
    *   **Issue:** The `backend/middleware/auth.js` file referenced in the bug report memory is missing, and the `middleware` directory itself does not exist.

## Test Failures

*   **Frontend Tests:** 12 out of 14 Angular unit tests are currently failing.
*   **Root Cause:** Most failures are `NullInjectorError` (e.g., "No provider for HttpClient!") because necessary testing modules (`HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, etc.) and mock providers (e.g., `provideMockStore`) are not included in the `TestBed` configuration of the `.spec.ts` files.
