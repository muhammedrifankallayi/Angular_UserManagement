# Bug Report

## Security Issues

### 1. Password Leak in Admin Users List
- **Description**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user documents from the database, including the hashed passwords. The exclusion logic is currently commented out.
- **Location**: `backend/routes/adminroute.js`, line 69.
- **Impact**: Exposure of hashed passwords can lead to offline brute-force attacks.

### 2. Unprotected Administrative Routes
- **Description**: Several administrative endpoints lack authentication and authorization middleware. There is no `auth.js` middleware to verify tokens or admin status for these routes.
- **Location**: `backend/routes/adminroute.js` (endpoints: `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`).
- **Impact**: Unauthorized users can view, edit, delete, or create users by directly calling these APIs.

### 3. Hardcoded JWT Secret
- **Description**: The JWT signing secret is hardcoded as `"secret"` in both `backend/routes/adminroute.js` and `backend/routes/routes.js`, despite a `.env` file existing.
- **Location**:
  - `backend/routes/adminroute.js`: lines 24, 57, 137.
  - `backend/routes/routes.js`: lines 33, 56, 75, 96, 117.
- **Impact**: Hardcoded secrets are easily compromised, allowing for token forgery.

### 4. Session Overwrite on User Creation
- **Description**: The `/api/admin/createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the administrator's session cookie.
- **Location**: `backend/routes/adminroute.js`, lines 139-142.
- **Impact**: The administrator is automatically logged out and replaced by the newly created user session immediately after creation.

## Logic Issues

### 1. Broken Search Functionality
- **Description**: The search input in the Admin User List component is not connected to any logic or data binding in the component.
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`, line 4.
- **Impact**: The search filter is completely non-functional.

### 2. Incorrect HttpClient.post Usage
- **Description**: `http.post` is called with options (like `withCredentials`) as the second argument (the body) instead of the third argument.
- **Location**:
  - `AdminUserlistComponent.deleteUser` in `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`.
  - `AdminUsereditComponent.getusers` in `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`.
- **Impact**: Authentication cookies are not sent with these requests, which would cause failures if the backend had proper authentication checks.

### 3. Type Inconsistency in User Model
- **Description**: The `is_admin` field is defined as a `String` but given a `Boolean` default value.
- **Location**: `backend/models/user.js`, line 18.
- **Impact**: Leads to type confusion and potential issues during database queries or data manipulation.

## Environment Issues

### 1. Misspelled Frontend Directory
- **Description**: The frontend directory is named `frondend` instead of `frontend`.
- **Location**: Root directory.
- **Impact**: Inconsistent naming convention and potential breakages in CI/CD pipelines.

### 2. Missing Backend Start Script
- **Description**: `backend/package.json` does not contain a `start` script.
- **Location**: `backend/package.json`.
- **Impact**: Developers cannot use `npm start` to run the backend server.

### 3. Broken Frontend Unit Tests
- **Description**: Multiple Angular unit tests fail with `NullInjectorError` because required providers like `Store`, `HttpClient`, and `Router` are not properly mocked or provided in the test suites.
- **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`.
- **Impact**: Prevents reliable automated testing of frontend components.
