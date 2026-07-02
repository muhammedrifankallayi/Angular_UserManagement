# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, and miscellaneous issues identified in the JWT Project.

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The JWT signing and verification process uses a hardcoded string `"secret"` instead of an environment variable.
- **Impact:** Compromises the security of the authentication system; if the source code is exposed, tokens can be easily forged.

### 2. Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative routes lack any form of authentication or authorization checks.
    - `GET /api/admin/users`: Returns all users without checking if the requester is an admin.
    - `POST /api/admin/deleteUser/:id`: Deletes a user without authentication.
    - `POST /api/admin/editDetails/:id`: Returns user details (including potentially sensitive info) without authentication.
    - `POST /api/admin/editUser`: Updates user info without authentication.
- **Impact:** Unauthorized users can view, edit, or delete user accounts.

### 3. Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Route: `GET /users`)
- **Description:** The `/api/admin/users` endpoint returns the full user object, including the hashed password.
- **Impact:** Potential for password cracking if an attacker gains access to this endpoint.

### 4. Lack of CSRF Protection
- **Location:** `backend/index.js`
- **Description:** The backend uses cookies for authentication (`httpOnly: true`) but does not implement CSRF protection.
- **Impact:** Users could be vulnerable to Cross-Site Request Forgery attacks.

---

## Logic Errors

### 1. Administrator Session Overwrite
- **Location:** `backend/routes/adminroute.js` (Route: `POST /createuser`)
- **Description:** When an administrator creates a new user, the server generates a JWT for the *newly created user* and sets it as the `jwt` cookie.
- **Impact:** The administrator is effectively logged out and logged in as the new user after creating them.

### 2. Unchecked File Upload
- **Location:** `backend/routes/routes.js` (Route: `POST /profile-upload-single`)
- **Description:** The code accesses `req.file.filename` without verifying if a file was actually uploaded.
- **Impact:** The server will crash if the request does not contain a file.

### 3. Schema Type Inconsistency
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as `String` but is initialized with a boolean default value (`false`).
- **Impact:** Potential for type-related bugs and confusing database state.

### 4. Incorrect HttpClient Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** Angular's `HttpClient.post` is called with options (like `{ withCredentials: true }`) as the second argument. The second argument is intended to be the request body.
- **Impact:** Request options are sent as the body, and the actual options (like `withCredentials`) are not applied, leading to auth failures or empty bodies where not expected.

---

## UI/UX & Miscellaneous

### 1. Misspelled Frontend Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Minor annoyance and inconsistency with standard naming conventions.

### 2. Non-functional Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Description:** The user list UI contains a search input, but there is no corresponding logic in the component to filter the users.
- **Impact:** Users cannot search for specific accounts in the admin panel.

### 3. Poor Error Handling
- **Location:** Backend routes
- **Description:** Many `catch` blocks are empty or only `console.log` the error without sending an appropriate error response to the client.
- **Impact:** The client may hang or receive no feedback when a server-side error occurs.

---

## Testing State

### 1. Frontend Test Failures
- **Location:** `frondend/jwtapp/`
- **Description:** 12 out of 14 frontend unit tests are currently failing.
- **Primary Reason:** `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
- **Impact:** The frontend codebase lacks reliable automated verification for its components.
