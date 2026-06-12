# Bug Report - JWT Project

## Security Vulnerabilities

1.  **Hardcoded JWT Secret**: The backend uses a hardcoded string `"secret"` for signing and verifying JWT tokens in `backend/routes/routes.js` and `backend/routes/adminroute.js`. This should be retrieved from environment variables (`process.env.jwtsecret`).
2.  **Missing Authentication/Authorization Middleware**: Several routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have any middleware to verify the user's identity or admin status. This allows unauthorized access to administrative functions.
3.  **Sensitive Data Exposure**:
    *   The `adminrouter.get('/users')` route returns all user documents, including hashed passwords.
    *   Some error blocks log error messages to the console but don't provide proper feedback or might leak internal info if not handled carefully (though currently they just log).

## Database Schema Issues

1.  **Incorrect Type for `is_admin`**: In `backend/models/user.js`, the `is_admin` field is defined as `type: String`, but its default value is `false` (a boolean). This can lead to type inconsistencies.

## Logic and Frontend Bugs

1.  **Incorrect `HttpClient.post` Usage**: In `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, the `deleteUser` method calls `this.http.post` with the options object as the second argument. In Angular's `HttpClient.post`, the second argument is the request body. This causes the options (like `withCredentials`) to be sent as the body, and the actual options to be default.
    ```typescript
    // Current (Incorrect)
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
      withCredentials: true
    })

    // Should be
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, null, {
      withCredentials: true
    })
    ```
2.  **Unimplemented Search Functionality**: The Search bar in `AdminUserlistComponent` is present in the HTML but lacks any implementation in the TypeScript component.
3.  **Empty Catch Blocks**: Many route handlers in `backend/routes/routes.js` and `backend/routes/adminroute.js` have empty `catch` blocks, which silences errors and makes debugging difficult.

## Test Failures

1.  **Frontend Unit Tests**: 12 out of 14 frontend unit tests are currently failing. Most failures are due to `NullInjectorError: No provider for HttpClient!` or missing `Router` dependencies in the test suites.

## Miscellaneous

1.  **Typo in Directory Name**: The frontend directory is misspelled as `frondend` instead of `frontend`.
