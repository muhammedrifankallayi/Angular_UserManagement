# Bug Report

## Security Issues

### 1. Password Hash Leak
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `GET /api/admin/users`
- **Description:** The endpoint returns the full user object including the `password` field (hashed password). The code that should exclude the password is currently commented out.
- **Impact:** Administrative users can see the password hashes of all users, which is a security risk.

### 2. Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`
- **Description:** Most administrative endpoints (like `/users`, `/deleteUser/:id`, `/editUser`, etc.) do not have any authentication or authorization middleware.
- **Impact:** Any user or even unauthenticated actors can access and modify user data if they know the endpoints.

### 3. Hardcoded JWT Secrets
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The JWT secret is hardcoded as `"secret"` in multiple places for both signing and verification.
- **Impact:** Hardcoded secrets are easily discoverable and compromise the security of the authentication system. They should be moved to environment variables.

### 4. Admin Session Overwrite during User Creation
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `POST /api/admin/createuser`
- **Description:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, overwriting the administrator's own session cookie.
- **Impact:** The administrator is effectively logged out and "becomes" the newly created user after performing this action.

### 5. Missing CSRF Protection
- **Description:** The application uses cookies for authentication (`withCredentials: true`) but does not implement any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Vulnerable to CSRF attacks where malicious sites can make requests on behalf of an authenticated user.

## Logic and Frontend Errors

### 6. Non-functional Search Filter
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input in the admin user list template is not connected to any component logic or data binding.
- **Impact:** The search functionality does not work; typing in the box has no effect on the displayed list.

### 7. Incorrect HttpClient.post Usage
- **Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (in `deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (in `getusers`)
- **Description:** The code calls `this.http.post(url, { withCredentials: true })`. In Angular's `HttpClient`, the second argument to `post` is the request body. The options (like `withCredentials`) should be the third argument.
- **Impact:** Authentication cookies may not be sent correctly because `withCredentials` is being treated as the request body instead of an option.

## Data Model Inconsistencies

### 8. Type Mismatch for `is_admin`
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** This lead to type inconsistencies and potential issues when querying or updating the field.

## Environment and Testing Issues

### 9. Misspelled Frontend Directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusing directory structure and potential issues with scripts or documentation that expect the standard naming.

### 10. Missing Start Script in Backend
- **File:** `backend/package.json`
- **Description:** There is no `start` script defined in the backend `package.json`.
- **Impact:** Users cannot use `npm start` to run the backend server.

### 11. Failing Angular Unit Tests
- **Description:** Running `ng test` results in 12 out of 14 tests failing.
- **Root Cause:** `NullInjectorError` due to missing providers in the test suites (e.g., `HttpClient`, `Store`, `Router`).
- **Impact:** The project lacks a reliable automated testing suite, making it difficult to verify changes and prevent regressions.
