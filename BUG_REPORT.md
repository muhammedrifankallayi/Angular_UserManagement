# Bug Report

## Security Vulnerabilities

1.  **Hardcoded JWT Secrets**:
    *   **Files**: `backend/routes/adminroute.js`, `backend/routes/routes.js`
    *   **Description**: The JWT secret is hardcoded as `"secret"` in multiple places instead of using the `process.env.jwtsecret` environment variable.
2.  **Missing Authentication/Authorization Middleware**:
    *   **File**: `backend/routes/adminroute.js`
    *   **Description**: Administrative routes such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack middleware to verify if the requesting user is authenticated and has administrative privileges.
3.  **Sensitive Data Exposure**:
    *   **File**: `backend/routes/adminroute.js` (route `/users`)
    *   **Description**: The response for the users list includes the `password` field for all users.
4.  **Lack of CSRF Protection**:
    *   **Description**: The application uses cookie-based authentication with `withCredentials: true` but does not implement CSRF protection.
5.  **Hardcoded MongoDB Connection String**:
    *   **File**: `backend/index.js`
    *   **Description**: The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of using an environment variable.

## Logic Errors

1.  **Admin Session Overwritten on User Creation**:
    *   **File**: `backend/routes/adminroute.js` (route `/createuser`)
    *   **Description**: When an admin creates a new user, the backend generates a new JWT for the *newly created user* and sets it as the `jwt` cookie, effectively logging the admin out and logging them in as the new user.
2.  **Inconsistent Data Type for `is_admin`**:
    *   **File**: `backend/models/user.js`
    *   **Description**: The `is_admin` field is defined as `String` but has a default value of `false` (boolean) and is used as a boolean in queries (e.g., `is_admin:true` in `/login`).
3.  **Missing File Existence Check in Upload**:
    *   **File**: `backend/routes/routes.js` (route `/profile-upload-single`)
    *   **Description**: The code attempts to access `req.file.filename` without checking if `req.file` exists, which could lead to a server crash if no file is uploaded.
4.  **Poor Error Handling**:
    *   **Files**: `backend/routes/adminroute.js`, `backend/routes/routes.js`
    *   **Description**: Many `catch` blocks are empty or only log to the console without sending an error response to the client, leading to hung requests or opaque failures.

## UI/UX Issues

1.  **Incorrect `HttpClient.post` Usage**:
    *   **Files**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
    *   **Description**: The options object (containing `withCredentials: true`) is passed as the second argument (body) instead of the third argument, causing the request to fail or behave unexpectedly.
2.  **Non-functional Search Input**:
    *   **File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
    *   **Description**: The search input is a static HTML element and is not connected to any logic or NgRx selectors to filter the user list.
3.  **Misspelled Directory**:
    *   **Description**: The frontend directory is misspelled as `frondend` instead of `frontend`.

## Testing State

1.  **Frontend Unit Tests Failing**:
    *   **Description**: Multiple unit tests are failing due to missing providers for `HttpClient` and `Router` in the test setup.
