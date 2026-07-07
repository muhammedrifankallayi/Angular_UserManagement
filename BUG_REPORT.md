# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, architectural issues, and test failures identified in the project.

## 1. Backend Vulnerabilities (Node.js/Express)

### 1.1 Security Issues
- **Hardcoded JWT Secret**: The secret string `"secret"` is hardcoded in `backend/routes/routes.js` and `backend/routes/adminroute.js` for both signing and verifying tokens, ignoring the `jwtsecret` defined in the `.env` file.
- **Missing Admin Authorization**: Several sensitive administrative routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the user is an authenticated administrator.
- **Sensitive Data Exposure**: The `/api/admin/users` endpoint returns the full user objects, including hashed passwords, to the client.
- **Lack of CSRF Protection**: The application does not implement any CSRF protection, which is particularly risky as it uses cookie-based authentication.
- **Hardcoded Database URI**: The MongoDB connection string is hardcoded in `backend/index.js` as `mongodb://127.0.0.1:27017/jwtproject`.

### 1.2 Logic Errors
- **Admin Session Overwrite**: In `backend/routes/adminroute.js`, the `/createuser` endpoint generates a new JWT for the newly created user and sets it in the `jwt` cookie. This action overwrites the administrator's own session cookie, effectively logging them out or switching their session.
- **User Model Inconsistency**: In `backend/models/user.js`, the `is_admin` field is defined with `type: String` but has a boolean default `false`.
- **Unsafe File Upload**: The `/profile-upload-single` route in `backend/routes/routes.js` attempts to access `req.file.filename` without first verifying that `req.file` exists, which could lead to a server crash if a request is sent without a file.

### 1.3 Code Quality
- **Poor Error Handling**: Both `routes.js` and `adminroute.js` contain multiple empty `catch` blocks or blocks that only `console.log` errors without sending an appropriate error response to the client.

## 2. Frontend Issues (Angular)

### 2.1 Functional Bugs
- **Non-functional Search**: The search input in the Admin User List component is static HTML and has no logic implemented for filtering the user list.
- **Incorrect HttpClient usage**: In `AdminUserlistComponent` (deleteUser method) and `AdminUsereditComponent` (getusers method), the `HttpClient.post` call passes the options object as the second argument (the body) instead of the third.
  ```typescript
  // Incorrect usage found:
  this.http.post(url, { withCredentials: true })
  // Correct usage:
  this.http.post(url, {}, { withCredentials: true })
  ```

### 2.2 Architectural Issues
- **Misspelled Directory**: The root directory for the frontend is misspelled as `frondend/`.

## 3. Test Failures

### 3.1 Frontend Tests
- **Status**: 12 out of 14 tests failing.
- **Primary Root Cause**: `NullInjectorError`. The component spec files do not provide necessary mocks or modules such as `HttpClientTestingModule`, `RouterTestingModule`, or NgRx `provideMockStore`.

### 3.2 Backend Tests
- **Status**: No tests found. The `backend/package.json` does not have any test scripts or test files defined.
