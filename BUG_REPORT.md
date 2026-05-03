# Bug Report - JWT App

This document outlines identified security vulnerabilities, logic errors, and architectural issues within the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` in multiple places.
- **Risk:** High. If discovered, attackers can forge valid JWT tokens and impersonate any user, including administrators.
- **Recommendation:** Use environment variables (e.g., `process.env.JWT_SECRET`) and ensure they are loaded via `dotenv`.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/editUser`) do not have any authentication or authorization checks. Furthermore, endpoints that do verify the JWT (like `/api/admin/active`) do not check if the user has `is_admin: true`.
- **Risk:** High. Any unauthenticated user can list, edit, or delete all users in the system.
- **Recommendation:** Implement a robust authentication middleware and an `isAdmin` authorization middleware to protect all administrative routes.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (specifically the `/users` endpoint)
- **Issue:** The `/api/admin/users` endpoint returns the entire user object, including hashed passwords, because the exclusion logic is commented out.
- **Risk:** High. Exposure of password hashes facilitates offline cracking attacks.
- **Recommendation:** Ensure sensitive fields like `password` are always excluded from the response.

### 1.4 Inconsistent Data Types for `is_admin`
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as a `String`, but its default value is set to `false` (a boolean).
- **Risk:** Medium. Can lead to unexpected behavior in database queries and application logic when checking for administrative privileges.
- **Recommendation:** Define `is_admin` as a `Boolean`.

---

## 2. Logic Errors

### 2.1 Non-functional Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field exists in the UI but is not bound to any filtering logic in the component.
- **Recommendation:** Implement a search filter using a pipe or by filtering the data in the component's TypeScript file.

### 2.2 Incorrect `HttpClient.post` Options
- **Location:** `AdminUserlistComponent`, `AdminUsereditComponent`
- **Issue:** Calls to `this.http.post` incorrectly pass `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (options).
- **Risk:** Low/Medium. Authentication cookies are not sent with these requests, causing them to fail when backend authentication is enforced.
- **Recommendation:** Correct the `post` calls to: `this.http.post(url, body, { withCredentials: true })`.

### 2.3 Session Overwriting in `createuser`
- **Location:** `backend/routes/adminroute.js`
- **Issue:** When an admin creates a new user via `/api/admin/createuser`, the backend issues a new JWT cookie for the *newly created user*.
- **Risk:** Medium. This effectively logs out the administrator and logs them in as the new user they just created.
- **Recommendation:** Administrative user creation should not issue a new session cookie.

---

## 3. Architectural and Environmental Issues

### 3.1 Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Recommendation:** Rename the directory to `frontend` and update any related configuration files.

### 3.2 Widespread Angular Test Failures
- **Location:** `frondend/jwtapp/`
- **Issue:** Most unit tests (12 out of 14) are failing, primarily due to `NullInjectorError: No provider for HttpClient!`.
- **Recommendation:** Update the test suites to include necessary providers like `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
