# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secrets
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` instead of using the `process.env.jwtsecret` defined in the `.env` file.
- **Impact:** Critical security risk; anyone with access to the source code can forge tokens.

### 2. Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Most administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is an authenticated administrator.
- **Impact:** Unauthorized users can perform administrative actions if they know the endpoints.

### 3. Exposed Sensitive Data (Passwords)
- **Location:** `backend/routes/adminroute.js` - `/api/admin/users` endpoint
- **Issue:** The user list endpoint returns full user objects, including the hashed `password` field.
- **Impact:** High; exposes password hashes of all users to anyone who can access the endpoint.

### 4. Permissive CORS and Lack of CSRF Protection
- **Location:** `backend/index.js`
- **Issue:** CORS is configured to allow credentials from `http://localhost:4200`, but there is no CSRF protection (e.g., using `csurf` or similar).
- **Impact:** Medium; potential for Cross-Site Request Forgery attacks.

## Logic Errors

### 5. Session Overwriting in User Creation
- **Location:** `backend/routes/adminroute.js` - `/api/admin/createuser`
- **Issue:** After creating a new user, the backend signs a new JWT for that user and sets it in the `jwt` cookie.
- **Impact:** If an administrator creates a user, their own session cookie is overwritten by the new user's token, effectively logging them out as admin and in as the new user.

### 6. Data Type Inconsistency
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as `type: String` but has a default value of `false` (boolean).
- **Impact:** Potential for unexpected behavior when querying or updating the `is_admin` status.

### 7. Suppressed Exceptions
- **Location:** Multiple routes in `backend/routes/`
- **Issue:** Many `try-catch` blocks are either empty or only `console.log` the error without sending an error response to the client.
- **Impact:** Clients might hang or receive no feedback when an error occurs on the server.

## Frontend Issues

### 8. Incorrect HttpClient Parameter Usage
- **Location:** `AdminUserlistComponent`
- **Issue:** Calls to `http.post` (e.g., in `deleteUser`) pass the request options object as the second argument (which is expected to be the request body).
- **Impact:** Requests fail to send proper credentials or bodies, leading to 401 or 400 errors.

### 9. Failing Unit Tests
- **Location:** `frondend/jwtapp/`
- **Issue:** Many Angular unit tests fail due to `NullInjectorError` (missing `HttpClient`, `Router`, or `MockStore` providers).
- **Impact:** Unreliable test suite; difficult to verify new changes.

### 10. Non-functional Search Input
- **Location:** `AdminUserlistComponent`
- **Issue:** The search input in the UI is static HTML and lacks implementation in the component logic.
- **Impact:** Poor user experience; unable to filter the user list.

## Architectural Issues

### 11. Misspelled Directory
- **Location:** Root directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Minor, but unprofessional and can lead to confusion in build scripts or documentation.
