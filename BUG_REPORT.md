# Bug Report - JWT Authentication Project

This report documents the identified security vulnerabilities, logic errors, and code quality issues found in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
JWT secrets are hardcoded as strings instead of being managed through environment variables, posing a significant security risk.
- **Location**: `backend/routes/routes.js` (multiple instances)
- **Location**: `backend/routes/adminroute.js` (multiple instances)
- **Note**: Although `backend/.env` exists with `jwtsecret="secret"`, the code often uses the literal string `"secret"`.

### 1.2 Missing Authentication and Authorization Middleware
Administrative endpoints in the backend lack proper middleware to verify if the requester is authenticated and has administrative privileges.
- **Location**: `backend/routes/adminroute.js`
- **Affected Endpoints**: `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`.

### 1.3 Exposure of Sensitive User Data
The endpoint that retrieves all users returns the entire user object, including hashed passwords, to the client.
- **Location**: `backend/routes/adminroute.js`: `adminrouter.get('/users', ...)`
- **Impact**: Exposure of password hashes facilitates offline brute-force attacks if the data is intercepted or leaked.

## 2. Logic and Data Type Errors

### 2.1 Session Cookie Overwriting during User Creation
When an administrator creates a new user, the backend generates a new JWT for the *newly created* user and sets it in the session cookie, effectively logging the administrator out and logging them in as the new user.
- **Location**: `backend/routes/adminroute.js`: `adminrouter.post('/createuser', ...)`

### 2.2 Incorrect Data Type for `is_admin` Field
The `is_admin` field in the User schema is defined as a `String` instead of a `Boolean`.
- **Location**: `backend/models/user.js`
- **Default value**: `false` (string)

## 3. Frontend Issues

### 3.1 Incorrect HttpClient usage
Several components incorrectly pass the `withCredentials` option as the second argument (body) instead of the third argument (options) in `http.post` calls.
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`: `deleteUser` method.
- **Location**: `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`: `getusers` and `submit` methods.
- **Location**: `frondend/jwtapp/src/app/components/admin-createuser/admin-createuser.component.ts`: `submit` method.

### 3.2 Misspelled Frontend Directory
The frontend directory is misspelled as `frondend` instead of `frontend` in the project root.

## 4. Code Quality and Maintenance

### 4.1 Silent Failures in Backend
Backend route handlers frequently use empty `catch` blocks or only `console.log` for error reporting, which can lead to silenced failures and difficult debugging.
- **Location**: Throughout `backend/routes/routes.js` and `backend/routes/adminroute.js`.

### 4.2 Test Failures
A significant number of frontend unit tests are currently failing.
- **Current State**: 12 out of 14 tests failed in `frondend/jwtapp/`.
- **Primary Cause**: `NullInjectorError: No provider for HttpClient!`, indicating missing module imports in test suites.
