# Bug Report - JWT Project

This report documents the identified security vulnerabilities, logic errors, and implementation gaps in the application.

## 1. Security Vulnerabilities

### 1.1 Hardcoded Secrets
- **Description**: The JWT secret is hardcoded as `"secret"` in both `backend/routes/routes.js` and `backend/routes/adminroute.js`.
- **Impact**: Compromises the security of the authentication system. If the secret is known, attackers can forge valid JWT tokens.
- **Location**:
    - `backend/routes/routes.js`
    - `backend/routes/adminroute.js`

### 1.2 Missing Authentication/Authorization Middleware
- **Description**: Admin routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`) do not consistently use a robust authentication middleware. While some routes check for a cookie, others rely on client-side state or lack proper protection.
- **Impact**: Unauthorized users could potentially perform administrative actions.

### 1.3 Sensitive Data Exposure
- **Description**: The `/api/admin/users` route returns the entire user object, including the hashed `password` field.
- **Impact**: Unnecessary exposure of sensitive user data.
- **Location**: `backend/routes/adminroute.js`

### 1.4 Hardcoded MongoDB Connection String
- **Description**: The database connection string is hardcoded in `backend/index.js`.
- **Location**: `backend/index.js`
- **Impact**: Makes the application less configurable and exposes potential credentials in the source code.

### 1.5 Lack of CSRF Protection
- **Description**: The backend uses cookie-based authentication with `credentials: true` but lacks CSRF (Cross-Site Request Forgery) protection.
- **Impact**: Users may be vulnerable to CSRF attacks.

## 2. Logic Errors

### 2.1 Admin Create User Session Overwrite
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the backend generates a new JWT for the *created* user and sets it as a cookie.
- **Impact**: This overwrites the administrator's own session cookie, effectively logging them out and logging them in as the newly created user.
- **Location**: `backend/routes/adminroute.js`

### 2.2 Missing File Existence Check
- **Description**: The `/profile-upload-single` route attempts to access `req.file.filename` without first verifying if `req.file` exists.
- **Impact**: If a request is sent without a file, the server will crash or throw an error.
- **Location**: `backend/routes/routes.js`

### 2.3 Type Inconsistency for `is_admin`
- **Description**: The `is_admin` field in the User model is defined as a `String`, but it is initialized with a boolean `false` default and queried using boolean values.
- **Location**: `backend/models/user.js`

### 2.4 Poor Error Handling
- **Description**: Multiple routes contain empty `catch` blocks or only `console.log(error.message)` without sending an appropriate error response to the client.
- **Location**: Throughout `backend/routes/routes.js` and `backend/routes/adminroute.js`.

## 3. Frontend Issues

### 3.1 Misspelled Directory
- **Description**: The main frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Incorrect HttpClient Usage
- **Description**: In `AdminUserlistComponent` and `AdminUsereditComponent`, `http.post` calls pass options (like `{ withCredentials: true }`) as the second argument (the body) instead of the third.
- **Impact**: Requests may fail or not include the necessary credentials/headers correctly.
- **Location**:
    - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
    - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`

### 3.3 Non-functional Search UI
- **Description**: The user list page has a search input field that is static HTML and has no backing logic in the component.
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`

## 4. Test Failures

### 4.1 Angular Unit Tests
- **Description**: A majority of Angular unit tests (12 out of 14) are failing.
- **Cause**: Primarily due to `NullInjectorError` because `HttpClient`, `Router`, and `MockStore` are not properly provided in the test suites.
