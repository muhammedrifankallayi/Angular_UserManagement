# Bug Report - JWT App

This report documents security vulnerabilities, logic errors, and maintenance issues identified in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
*   **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
*   **Description:** The application uses a hardcoded string `"secret"` for JWT signing and verification instead of the `jwtsecret` environment variable defined in `.env`.
*   **Impact:** Compromises the security of authentication tokens.

### 1.2 Missing Authentication and Authorization Middleware
*   **Location:** `backend/routes/adminroute.js`
*   **Description:** Several sensitive administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`) lack middleware to verify if the requester is authenticated and has administrator privileges.
*   **Impact:** Unauthorized users could perform administrative actions like deleting or editing other users.

### 1.3 Sensitive Data Exposure
*   **Location:** `backend/routes/adminroute.js` (Endpoint: `/api/admin/users`)
*   **Description:** The `/users` endpoint returns the full user objects from the database, including hashed passwords.
*   **Impact:** Exposure of hashed passwords increases the risk of successful brute-force or rainbow table attacks if the data is intercepted.

### 1.4 Admin Session Overwriting
*   **Location:** `backend/routes/adminroute.js` (Endpoint: `/createuser`)
*   **Description:** When an administrator creates a new user, the server generates a new JWT for the *newly created user* and sets it in the `jwt` cookie.
*   **Impact:** This overwrites the administrator's own session cookie, effectively logging them out or switching their session to the new user.

---

## 2. Logic & Functional Errors

### 2.1 Incorrect Angular HttpClient Usage
*   **Location:** `AdminUserlistComponent`, `AdminUsereditComponent`, `AdminCreateuserComponent`
*   **Description:** `HttpClient.post()` calls are incorrectly structured. For example, in `AdminUserlistComponent.deleteUser()`, the `withCredentials` option is passed as the second argument (the request body) instead of the third argument (the options object).
*   **Impact:** Requests may fail or not include necessary credentials, and the server receives unexpected data in the request body.

### 2.2 Missing Search Functionality
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
*   **Description:** The user list UI includes a search input field, but the `AdminUserlistComponent` lacks any implementation (e.g., `onSearch` method or filtering logic) to make it functional.
*   **Impact:** The search feature is present in the UI but does not work.

### 2.3 User Model Inconsistency
*   **Location:** `backend/models/user.js`
*   **Description:** The `is_admin` field is defined with `type: String` but assigned a default value of `false` (Boolean).
*   **Impact:** Potential type mismatches or unexpected behavior when querying or updating the `is_admin` status.

---

## 3. Maintenance & Environment Issues

### 3.1 Misspelled Frontend Directory
*   **Description:** The main frontend directory is misspelled as `frondend` instead of `frontend`.
*   **Impact:** Non-standard project structure and potential confusion for developers.

### 3.2 Improper Error Handling
*   **Location:** Backend Route Handlers
*   **Description:** Many `try-catch` blocks in the backend routes are either empty or only use `console.log()`, failing to return appropriate error responses to the client.
*   **Impact:** Difficulties in debugging and poor user experience when errors occur.

### 3.3 Failing Frontend Unit Tests
*   **Status:** 12 Failed, 2 Success
*   **Description:** Most tests fail with `NullInjectorError: No provider for HttpClient!`.
*   **Impact:** The test suite is currently unreliable and does not provide proper coverage or regression testing.
