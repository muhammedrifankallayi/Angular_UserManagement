# Bug Report

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: The JWT signing and verification processes use a hardcoded string `"secret"` instead of using the environment variable `jwtsecret` defined in `backend/.env`.
- **Impact**: Security risk as the secret is easily discoverable in the source code.

### 1.2 Missing Authentication/Authorization Middleware
- **Location**: `backend/routes/adminroute.js`
- **Description**: Many administrative endpoints are not properly protected. While some `GET` endpoints check for a JWT cookie manually, `POST` endpoints like `/deleteUser/:id`, `/editUser`, and `/createuser` lack any authentication or authorization checks.
- **Impact**: Any unauthenticated user can delete users, edit user details, or create new users if they know the endpoint URL.

### 1.3 Sensitive Data Exposure
- **Location**: `backend/routes/adminroute.js` (endpoint `/api/admin/users`)
- **Description**: The endpoint returns all user records from the database. The logic to exclude sensitive fields like passwords is commented out.
- **Impact**: Exposure of hashed passwords for all users in the system.

### 1.4 Missing CSRF Protection
- **Location**: `backend/index.js`
- **Description**: The backend uses `cookie-parser` and `cors` with `credentials: true`, but does not implement any CSRF (Cross-Site Request Forgery) protection.
- **Impact**: Authenticated users could be tricked into performing actions on the backend without their consent.

## 2. Logic and Implementation Errors

### 2.1 Admin Session Overwrite on User Creation
- **Location**: `backend/routes/adminroute.js` (endpoint `/api/admin/createuser`)
- **Description**: When an admin creates a new user, the backend issues a new JWT cookie for the newly created user.
- **Impact**: This overwrites the admin's own JWT cookie, effectively logging the admin out and logging them in as the new user.

### 2.2 Data Type Inconsistency
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined as `type: String`, but its default value is `false` (a boolean).
- **Impact**: Potential issues during data retrieval or comparison if the type is not handled consistently.

### 2.3 Angular HttpClient Usage
- **Location**: Various components in `frondend/jwtapp/src/app/components/`
- **Description**: Some `HttpClient.post` calls were initially missing the options object for `withCredentials: true`, which is required for the browser to send/receive authentication cookies. (Note: some of these may have been partially addressed in the past according to memory, but should be verified).

## 3. Project Structure and Maintenance

### 3.1 Directory Name Typo
- **Location**: Root directory
- **Description**: The frontend directory is named `frondend` instead of `frontend`.
- **Impact**: Minor confusion and inconsistency with standard naming conventions.

### 3.2 Extensive Unit Test Failures
- **Location**: `frondend/jwtapp/`
- **Description**: Running `ng test` reveals a high number of failures (e.g., 12 out of 14 tests failing). Most failures are due to `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` or similar mocks are missing from the test configurations.
- **Impact**: Difficulty in verifying changes and ensuring code quality through automated testing.
