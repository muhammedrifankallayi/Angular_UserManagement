# Bug Report

This report documents the security vulnerabilities, logic errors, and UI/UX issues found in the JWT application.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Description**: The JWT signing and verification processes use a hardcoded secret string `"secret"` instead of environment variables.
- **Location**:
  - `backend/routes/routes.js`
  - `backend/routes/adminroute.js`
- **Risk**: High. Hardcoded secrets are easily discoverable and compromise the entire authentication system.

### 1.2 Missing Authentication/Authorization Middleware
- **Description**: Administrative routes in `backend/routes/adminroute.js` lack middleware to verify if the requesting user is an authenticated administrator.
- **Location**: `backend/routes/adminroute.js`
- **Risk**: Critical. Any user (or even unauthenticated attackers) can potentially access administrative actions like deleting or editing users.

### 1.3 Sensitive Data Exposure (Hashed Passwords)
- **Description**: The `/api/admin/users` endpoint returns the entire user object, including hashed passwords, because the exclusion logic is commented out.
- **Location**: `backend/routes/adminroute.js` (line 78)
- **Risk**: High. Hashed passwords should never be sent to the frontend.

## 2. Logic Errors

### 2.1 Admin Session Overwrite on User Creation
- **Description**: When an admin creates a new user, the backend issues a new JWT cookie for the created user. This overwrites the admin's session cookie, effectively logging them out as the administrator and logging them in as the new user.
- **Location**: `backend/routes/adminroute.js` (lines 139-143)

### 2.2 Incorrect `withCredentials` placement in `HttpClient.post`
- **Description**: In several frontend components, the `withCredentials: true` option is passed as the second argument (body) instead of the third argument (options) for POST requests.
- **Location**:
  - `AdminUserlistComponent.deleteUser`
  - `AdminUsereditComponent.getusers`
  - `AdminUsereditComponent.submit` (some calls)
- **Impact**: Authentication cookies are not sent with these requests, causing them to fail on the backend.

### 2.3 Inconsistent Data Type for `is_admin`
- **Description**: The `is_admin` field is defined as a `String` in the Mongoose schema but is initialized with a boolean `false`.
- **Location**: `backend/models/user.js`

## 3. UI/UX Issues

### 3.1 Non-functional Search
- **Description**: The search input field in the User List page is not bound to any component logic and does not filter the displayed users.
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`

## 4. Test Failures

### 4.1 Frontend Unit Tests
- **Status**: 12 out of 14 tests are failing.
- **Primary Cause**: `NullInjectorError: No provider for HttpClient!`.
- **Details**: Most component specs are missing necessary providers like `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
