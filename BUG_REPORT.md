# Bug Report

## Security Vulnerabilities

1.  **Hardcoded JWT Secret**:
    - **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
    - **Issue**: The JWT secret is hardcoded as `"secret"`.
    - **Risk**: Compromises the security of all issued tokens if the source code is exposed.
    - **Recommendation**: Use `process.env.jwtsecret` and ensure it's defined in `.env`.

2.  **Missing Admin Authentication/Authorization Middleware**:
    - **Location**: `backend/routes/adminroute.js`
    - **Issue**: Most admin routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is an authenticated administrator.
    - **Risk**: Any user (or even unauthenticated users for some routes) can perform administrative actions.
    - **Recommendation**: Implement and apply an `isAdmin` middleware.

3.  **Sensitive Data Exposure**:
    - **Location**: `backend/routes/adminroute.js` in the `/users` endpoint.
    - **Issue**: The full user objects, including hashed passwords, are returned to the client.
    - **Risk**: Unnecessary exposure of password hashes.
    - **Recommendation**: Exclude the `password` field from the database query or manually remove it before sending the response.

4.  **Lack of CSRF Protection**:
    - **Issue**: The application uses cookies for authentication but does not implement CSRF protection.
    - **Risk**: Vulnerability to Cross-Site Request Forgery attacks.
    - **Recommendation**: Implement CSRF protection (e.g., using `csurf` middleware for Express).

## Logic Errors

1.  **Session Overwriting in User Creation**:
    - **Location**: `backend/routes/adminroute.js` in the `/createuser` endpoint.
    - **Issue**: When an admin creates a new user, the server generates a new JWT for that user and sets it as a cookie, overwriting the admin's own session cookie.
    - **Risk**: The administrator is effectively logged out and logged in as the newly created user.
    - **Recommendation**: Do not set a JWT cookie when an administrator creates a user.

2.  **Type Inconsistency for `is_admin` Field**:
    - **Location**: `backend/models/user.js`
    - **Issue**: The `is_admin` field is defined as a `String` but its default value is `false` (Boolean).
    - **Risk**: Potential for type-related bugs and confusion.
    - **Recommendation**: Change the type to `Boolean`.

3.  **Poor Error Handling**:
    - **Location**: Throughout `backend/routes/routes.js` and `backend/routes/adminroute.js`.
    - **Issue**: Many `catch` blocks are empty or only log the error without sending a response to the client.
    - **Risk**: The client might hang or receive no feedback when an error occurs.
    - **Recommendation**: Implement consistent error handling and ensure a proper HTTP status code and message are sent to the client.

## Frontend Issues

1.  **Misspelled Directory**:
    - **Issue**: The frontend directory is named `frondend` instead of `frontend`.
    - **Risk**: Non-standard naming, confusing for developers.
    - **Recommendation**: Rename `frondend` to `frontend`.

2.  **Failing Unit Tests**:
    - **Location**: `frondend/jwtapp/`
    - **Issue**: Multiple unit tests (12 of 14) are failing due to missing providers like `HttpClient` and `Router`.
    - **Recommendation**: Update test spec files to include necessary mocks and providers (`HttpClientTestingModule`, `RouterTestingModule`).

3.  **Incorrect `HttpClient.post` Usage**:
    - **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (and potentially elsewhere).
    - **Issue**: `HttpClient.post` is called with request options (like `{withCredentials: true}`) as the second argument instead of the third.
    - **Risk**: The request options are treated as the request body, leading to failed requests.
    - **Recommendation**: Pass `null` or the correct body as the second argument and options as the third.

## Architectural Issues

1.  **Hardcoded MongoDB Connection String**:
    - **Location**: `backend/index.js`
    - **Issue**: The database URL is hardcoded as `mongodb://127.0.0.1:27017/jwtproject`.
    - **Recommendation**: Move the connection string to an environment variable.
