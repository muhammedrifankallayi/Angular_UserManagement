# Bug Report - JWT Project

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Location**: `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue**: The JWT secret is hardcoded as the string `"secret"` in multiple places instead of using the environment variable `process.env.jwtsecret`.
- **Impact**: Security risk; the secret is easily discoverable if the code is leaked.
- **Suggested Fix**: Use `process.env.jwtsecret` for signing and verifying tokens.

### 2. Missing Authentication/Authorization Middleware for Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Issue**: Routes such as `/users`, `/deleteUser/:id`, and `/createuser` do not have middleware to verify if the requesting user is authenticated and has administrative privileges.
- **Impact**: Unauthorized users can potentially perform administrative actions if they know the endpoints.
- **Suggested Fix**: Implement a middleware that verifies the JWT and checks the `is_admin` flag of the user.

### 3. Exposure of Sensitive Data (Passwords) in API Response
- **Location**: `backend/routes/adminroute.js` (GET `/users`)
- **Issue**: The endpoint returns the full user objects from the database, including hashed passwords.
- **Impact**: Security risk; hashed passwords should never be sent to the client.
- **Suggested Fix**: Exclude the `password` field from the result of the `User.find()` query or manually remove it before sending the response.

## Logic Errors

### 4. Admin Session Overwritten on User Creation
- **Location**: `backend/routes/adminroute.js` (POST `/createuser`)
- **Issue**: When an admin creates a new user, the backend generates a new JWT for the *newly created user* and sets it as the `jwt` cookie.
- **Impact**: The administrator is effectively logged out or their session is replaced by the new user's session.
- **Suggested Fix**: Do not set a new JWT cookie when an administrator is creating a user.

### 5. Inconsistent Data Type for `is_admin`
- **Location**: `backend/models/user.js`
- **Issue**: The `is_admin` field is defined with `type: String`, but it is assigned a default value of `false` (boolean).
- **Impact**: Potential type-related bugs and confusion during database queries.
- **Suggested Fix**: Change the type to `Boolean`.

## Frontend Issues

### 6. Misspelled Frontend Directory
- **Location**: Root directory
- **Issue**: The frontend directory is named `frondend` instead of `frontend`.
- **Impact**: Non-standard naming, potential confusion.
- **Suggested Fix**: Rename `frondend` to `frontend`.

### 7. Broken Search Functionality
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue**: The search input exists in the HTML (`admin-userlist.component.html`) but has no corresponding logic in the TypeScript file or any data binding.
- **Impact**: Users cannot search for other users in the admin panel.
- **Suggested Fix**: Implement a search filter using a pipe or by filtering the `userdata$` observable.

### 8. Incorrect `HttpClient.post` Argument Order
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Issue**: In `deleteUser`, the request options (containing `withCredentials: true`) are passed as the second argument to `http.post`. Since `post` expects the body as the second argument, the options are being treated as the request body, and the actual options (third argument) are undefined.
- **Impact**: `withCredentials` might not be applied correctly, leading to authentication failures if the backend requires cookies.
- **Suggested Fix**: Pass an empty object `{}` as the second argument and the options as the third.

## Other Observations

### 9. Poor Error Handling
- **Location**: Backend routes
- **Issue**: Many `catch` blocks are empty or only `console.log` the error without sending an appropriate error response to the client.
- **Impact**: The frontend might hang or receive no feedback when an error occurs on the server.
- **Suggested Fix**: Always return a status code and error message in `catch` blocks.
