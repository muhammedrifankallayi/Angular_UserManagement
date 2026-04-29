# BUG REPORT

## Security Vulnerabilities

1.  **Password Hash Leak**
    *   **Location:** `backend/routes/adminroute.js` in the `/api/admin/users` endpoint.
    *   **Description:** The exclusion logic for passwords is commented out, causing hashed passwords to be leaked in the user list response.

2.  **Session Overwrite**
    *   **Location:** `backend/routes/adminroute.js` in the `/api/admin/createuser` endpoint.
    *   **Description:** Creating a new user as an admin issues a new JWT cookie for the created user, overwriting the admin's session.

3.  **Hardcoded JWT Secret**
    *   **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`.
    *   **Description:** The string `"secret"` is hardcoded for JWT signing/verification instead of using the `jwtsecret` from the environment.

## Logic Errors

1.  **Broken Search Functionality**
    *   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
    *   **Description:** The search input in the HTML template is not bound to any logic in the component.

2.  **Incorrect HttpClient.post Usage**
    *   **Location:** `AdminUserlistComponent` and `AdminUsereditComponent`.
    *   **Description:** Options like `{withCredentials: true}` are passed as the second argument (the body) instead of the third, preventing authentication cookies from being sent.

## Data Consistency and Environment Issues

1.  **is_admin Type Inconsistency**
    *   **Location:** `backend/models/user.js`
    *   **Description:** `is_admin` is defined as a `String` but has a `Boolean` default value (`false`).

2.  **Misspelled Frontend Directory**
    *   **Description:** The frontend directory is named `frondend` instead of `frontend`.

3.  **Missing Backend Start Script**
    *   **Location:** `backend/package.json`
    *   **Description:** No `start` script is defined to run the server easily.
