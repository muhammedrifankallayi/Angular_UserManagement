# Bug Report - JWT App Project

This report documents the security vulnerabilities, logic errors, and infrastructure issues identified in the JWT application.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
*   **Description:** The application uses a hardcoded string `"secret"` for signing and verifying JSON Web Tokens (JWT), instead of using the environment variable defined in `backend/.env`.
*   **Affected Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
*   **Risk:** High. If the source code is exposed, an attacker can easily forge valid JWTs and gain unauthorized access.

### 1.2 Missing Authentication and Authorization Middleware
*   **Description:** Several administrative endpoints in `backend/routes/adminroute.js` lack middleware to verify the user's identity and administrative privileges.
*   **Affected Files:** `backend/routes/adminroute.js` (Endpoints: `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
*   **Risk:** Critical. Any user (or even unauthenticated persons) can perform administrative actions like deleting users or viewing all user data.

### 1.3 Sensitive Data Exposure
*   **Description:** The `/api/admin/users` endpoint returns the entire user object from the database, including the hashed passwords.
*   **Affected Endpoint:** `GET /api/admin/users`
*   **Risk:** High. Hashed passwords should never be sent to the client.

### 1.4 Admin Session Overwrite
*   **Description:** When an administrator creates a new user via the `/api/admin/createuser` endpoint, the server generates a new JWT for the *newly created user* and sets it as the `jwt` cookie.
*   **Affected Endpoint:** `POST /api/admin/createuser`
*   **Risk:** Medium. This logs the administrator out and logs them in as the new user, which is unexpected behavior for an administrative tool.

### 1.5 Missing CSRF Protection
*   **Description:** The application uses cookies for session management but does not implement Cross-Site Request Forgery (CSRF) protection.
*   **Risk:** Medium. Users could be tricked into performing unintended actions if they visit a malicious website while logged in.

---

## 2. Logic Errors

### 2.1 Inconsistent Data Types in User Model
*   **Description:** The `is_admin` field in the User model is defined as a `String` but has a boolean default value (`false`).
*   **Affected File:** `backend/models/user.js`

### 2.2 Incorrect HttpClient Options Usage
*   **Description:** In several frontend components, `withCredentials: true` is incorrectly passed as the second argument (the request body) for `POST` requests, instead of the third argument (the options object).
*   **Affected Files:**
    *   `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
    *   `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
    *   `frondend/jwtapp/src/app/components/admin-createuser/admin-createuser.component.ts`

### 2.3 Missing Search Functionality
*   **Description:** The user list view includes a search input field, but the functionality to filter users is not implemented in the component.
*   **Affected File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`

---

## 3. Infrastructure and Maintenance Issues

### 3.1 Misspelled Directory Name
*   **Description:** The main frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Failing Unit Tests
*   **Description:** 12 out of 14 Angular unit tests are failing. The primary cause is the `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` (or a mock) is missing from the test configurations.
*   **Status:** 12 Failed, 2 Success.

### 3.3 Inadequate Error Handling
*   **Description:** Many backend route handlers use empty `catch` blocks or only `console.log` errors. This can lead to silent failures where the client receives no response or an incorrect success message when an operation fails.
*   **Affected Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
