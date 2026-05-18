# Bug Report

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** The application uses a hardcoded secret string `"secret"` for signing and verifying JWT tokens.
- **Impact:** If an attacker discovers this secret, they can forge valid JWT tokens and gain unauthorized access to any user account.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not use any middleware to verify the requester's identity or administrative privileges.
- **Impact:** Any client can access, modify, or delete user data by sending requests directly to these endpoints.

### 1.3 Exposure of Sensitive Data
- **Location:** `backend/routes/adminroute.js` (line 84)
- **Description:** The `/api/admin/users` endpoint returns full user objects from the database, including hashed passwords, because the exclusion logic is commented out.
- **Impact:** Hashed passwords for all users are leaked to the client-side, increasing the risk of offline brute-force attacks.

## 2. Logical Errors

### 2.1 Admin Logout on User Creation
- **Location:** `backend/routes/adminroute.js` (lines 173-176)
- **Description:** When an administrator creates a new user via the `/createuser` endpoint, the server generates a new JWT for the *newly created user* and sets it as a cookie.
- **Impact:** This overwrites the administrator's existing JWT cookie, effectively logging the administrator out and replacing their session with that of the new user.

### 2.2 Incorrect is_admin Type Definition
- **Location:** `backend/models/user.js` (line 18)
- **Description:** The `is_admin` field is defined as a `String` in the Mongoose schema, but it is initialized with a boolean `false` as its default value.
- **Impact:** Inconsistent data types can lead to unexpected behavior during queries or when performing logical checks (e.g., `"false"` vs `false`).

### 2.3 Incorrect HttpClient Argument Order
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (line 44), `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (line 104)
- **Description:** In Angular's `HttpClient.post` method, the second argument is the request body and the third argument is the options object. The code incorrectly passes `{ withCredentials: true }` as the second argument.
- **Impact:** Authentication cookies are not sent with these requests because the options object is missing, and the backend receives an object containing `withCredentials` as the request body.

### 2.4 Silent Failures in Catch Blocks
- **Location:** Multiple locations in `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Many asynchronous route handlers use `try...catch` blocks that either remain empty or only perform `console.log(error.message)` without sending an error response (e.g., `res.status(500)`) to the client.
- **Impact:** The client is left hanging or receives a success status even when an internal server error occurs, making debugging and error reporting difficult.

## 3. UI/UX Issues

### 3.1 Non-functional Search Bar
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Description:** The search input field in the administrator's user list view is not bound to any filtering logic in the corresponding TypeScript component.
- **Impact:** Typing in the search box has no effect on the displayed list of users.

### 3.2 Frontend Directory Misspelling
- **Location:** Project Root
- **Description:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** This is unprofessional and can cause confusion for developers or automated scripts expecting standard directory names.

## 4. System Configuration and Testing

### 4.1 Missing Backend Tests
- **Location:** `backend/`
- **Description:** The backend `package.json` does not have any tests defined, and no test directory exists.
- **Impact:** There is no automated way to verify backend logic or prevent regressions.

### 4.2 Broken Frontend Tests
- **Location:** `frondend/jwtapp/`
- **Description:** Running Angular unit tests reveals significant failures (12 out of 14 tests failing). Most failures are due to `NullInjectorError: No provider for HttpClient!`.
- **Impact:** The existing test suite is unreliable and provides no confidence in the frontend's stability.
