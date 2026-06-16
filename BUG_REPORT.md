# Bug Report - JWT Project

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: The JWT secret is hardcoded as `"secret"` in several places instead of using the environment variable `process.env.jwtsecret`.
- **Impact**: Significant security risk; anyone with access to the source code can forge tokens.

### 2. Missing Authentication/Authorization Middleware on Admin Routes
- **File**: `backend/routes/adminroute.js`
- **Description**: Most admin routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is an authenticated administrator.
- **Impact**: Any user (or even unauthenticated users in some cases) could potentially access or modify user data by calling these endpoints directly.

### 3. Sensitive Data Exposure
- **File**: `backend/routes/adminroute.js`
- **Endpoint**: `GET /api/admin/users`
- **Description**: The endpoint returns the entire user object, including the hashed `password` field.
- **Impact**: Hashed passwords should never be sent to the client.

### 4. Lack of CSRF Protection
- **File**: `backend/index.js`
- **Description**: The application uses cookies for authentication with `credentials: true` but does not implement CSRF protection.
- **Impact**: Users could be vulnerable to Cross-Site Request Forgery attacks.

## Logic Errors

### 1. Admin Session Overwrite
- **File**: `backend/routes/adminroute.js`
- **Endpoint**: `POST /api/admin/createuser`
- **Description**: When an admin creates a new user, the backend generates a new JWT for the *created user* and sets it as the `jwt` cookie, effectively logging the admin out and logging them in as the new user.
- **Impact**: Disruptive user experience for administrators.

### 2. Incorrect HttpClient Usage in Frontend
- **File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Method**: `deleteUser`
- **Description**: `this.http.post(url, { withCredentials: true })` passes the options object as the *body* of the POST request instead of the third argument (options).
- **Impact**: The `withCredentials` option is ignored, which may cause requests to fail in production if cookies are not sent.

## Code Quality & Consistency

### 1. Type Mismatch for `is_admin`
- **File**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined as `type: String` but has a default value of `false` (Boolean). It is also used as a boolean in `adminroute.js`.
- **Impact**: Potential for unexpected behavior or database query issues.

### 2. Poor Error Handling
- **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Many `try...catch` blocks are either empty or only `console.log` the error without sending a response to the client.
- **Impact**: The client might hang or receive a confusing error if something goes wrong on the server.

### 3. Misspelled Directory Name
- **Directory**: `frondend/`
- **Description**: The frontend directory is misspelled as `frondend` instead of `frontend`.

## Test Failures
- **Status**: Multiple unit tests are failing in the Angular frontend due to missing dependencies in test configurations (e.g., `HttpClientTestingModule`, `RouterTestingModule`).
