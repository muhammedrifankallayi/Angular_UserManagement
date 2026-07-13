# Bug Report - JWT Project

This document outlines identified security vulnerabilities, logic errors, code quality issues, and functional gaps in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
JWT tokens are signed and verified using a hardcoded string `"secret"` in both `backend/routes/routes.js` and `backend/routes/adminroute.js`.
- **Impact:** Compromises token integrity if the secret is leaked.
- **Recommendation:** Use `process.env.jwtsecret` as intended (referenced in some files but not consistently used).

### 1.2 Sensitive Data Exposure
The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user fields, including the hashed `password`.
- **Impact:** Exposure of sensitive authentication data.
- **Recommendation:** Filter out the `password` field before sending the response.

### 1.3 Missing Authentication and Authorization Middleware
Most routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not have any middleware to verify the JWT token or check if the user is an admin.
- **Impact:** Any client can access or modify administrative data.
- **Recommendation:** Implement and apply `auth` and `admin` middleware to these routes.

### 1.4 Missing CSRF Protection
The application uses cookies for authentication (`credentials: true` in CORS and `httpOnly` cookies) but lacks CSRF protection.
- **Impact:** Potential for Cross-Site Request Forgery attacks.
- **Recommendation:** Implement CSRF tokens.

## 2. Logic Errors

### 2.1 Admin Session Overwrite
In `backend/routes/adminroute.js`, the `/createuser` endpoint issues a new JWT cookie for the *newly created user* upon success.
- **Impact:** If an administrator creates a user, their own admin session cookie is overwritten by the new user's token.
- **Recommendation:** Do not set a cookie when an admin creates a user.

### 2.2 Incorrect HttpClient.post Usage (Frontend)
In `AdminUserlistComponent` (deleteUser method) and `AdminUsereditComponent` (getusers method), `this.http.post` is called with the options object (containing `withCredentials`) as the second argument.
- **Context:** `post(url, body, options)`. Passing options as the body causes the request to fail or behave unexpectedly as `withCredentials` won't be applied correctly.
- **Recommendation:** Pass an empty object `{}` or the actual body as the second argument, and move options to the third.

### 2.3 Unchecked File Upload
The `/profile-upload-single` route in `backend/routes/routes.js` accesses `req.file.filename` without checking if `req.file` exists.
- **Impact:** Potential server crash (TypeError) if a request is made without a file.

## 3. Code Quality & Consistency

### 3.1 Data Model Inconsistency
In `backend/models/user.js`, the `is_admin` field is defined as `type: String` with a default of `false` (a boolean).
- **Recommendation:** Change type to `Boolean`.

### 3.2 Poor Error Handling
Numerous routes have empty `catch` blocks or only `console.log` errors without sending a response to the client (e.g., `adminrouter.post('/logout')`, `adminrouter.post('/deleteUser/:id')`).
- **Impact:** Client requests may hang or fail silently.

### 3.3 Directory Naming
The frontend root directory is misspelled as `frondend`.

## 4. Functional Gaps & Tests

### 4.1 Non-functional Search
The search input in `AdminUserlistComponent` is a static HTML element. There is no logic in the component or NgRx state to handle filtering the user list.

### 4.2 Unit Test Failures
Many frontend unit tests are currently failing, largely due to missing providers for `HttpClient` and `Router` in the test setup.
