# Bug Report

## Security Vulnerabilities

1.  **Password Leaks in Admin User List**
    *   **Location**: `backend/routes/adminroute.js` (GET `/api/admin/users`)
    *   **Issue**: The endpoint returns the entire user object from the database, including the hashed password. The exclusion logic `const {password, ...data} = await user.toJSON();` is currently commented out.
    *   **Risk**: Exposure of hashed passwords for all users to any authenticated (or even unauthenticated, see below) user.

2.  **Missing Authentication/Authorization for Administrative Endpoints**
    *   **Location**: `backend/routes/adminroute.js`
    *   **Issue**: Administrative endpoints (like `/users`, `/deleteUser/:id`, `/editUser`, etc.) do not have any middleware to verify the administrator's JWT or check the `is_admin` status. The `backend/middleware/auth.js` file is missing.
    *   **Risk**: Any user (or even unauthenticated attackers) can perform administrative actions.

3.  **Hardcoded JWT Secrets**
    *   **Location**: `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`
    *   **Issue**: The JWT secret `"secret"` is hardcoded across the backend code instead of being securely managed and loaded from environment variables only.
    *   **Risk**: Makes the system vulnerable if the source code is exposed.

4.  **Admin Session Overwrite during User Creation**
    *   **Location**: `backend/routes/adminroute.js` (POST `/api/admin/createuser`)
    *   **Issue**: When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, overwriting the administrator's own session cookie.
    *   **Risk**: The administrator is logged out and logged in as the new user after creation.

5.  **Lack of CSRF Protection**
    *   **Location**: `backend/index.js`
    *   **Issue**: The application uses `cookie-parser` and `cors` with `credentials: true` allowing `http://localhost:4200`, but there is no implementation of Cross-Site Request Forgery (CSRF) protection.
    *   **Risk**: Vulnerable to CSRF attacks.

## Logic and Frontend Errors

1.  **Broken Search Filter**
    *   **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
    *   **Issue**: The search input field `<input type="text" placeholder="Search" class="input">` is not connected to any `ngModel` or component logic, rendering it non-functional.

2.  **Incorrect HttpClient.post Usage**
    *   **Location**: `AdminUserlistComponent` and `AdminUsereditComponent`
    *   **Issue**: In `http.post` calls, the `options` object (containing `withCredentials: true`) is passed as the second argument (the request body) instead of the third argument.
    *   **Impact**: Authentication cookies are not sent with these requests.

3.  **Type Inconsistency in User Model**
    *   **Location**: `backend/models/user.js`
    *   **Issue**: The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean).
    *   **Impact**: Potential data corruption or unexpected behavior when querying.

## Environment and Structural Issues

1.  **Misspelled Frontend Directory**
    *   **Issue**: The frontend directory is named `frondend/` instead of `frontend/`. This misspelling is consistent throughout the project.

2.  **Missing Backend Start Script**
    *   **Location**: `backend/package.json`
    *   **Issue**: There is no `"start"` script defined.
    *   **Impact**: Standard `npm start` command fails; must use `node index.js`.

3.  **Failing Unit Tests**
    *   **Location**: `frondend/jwtapp/`
    *   **Issue**: 12 out of 14 Angular unit tests are failing.
    *   **Cause**: `NullInjectorError` due to missing providers (`HttpClient`, `Store`, etc.) in the `TestBed` configuration of `.spec.ts` files.
