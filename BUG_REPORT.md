# Bug Report - JWT Authentication Project

This report documents the security vulnerabilities, logic errors, and infrastructure issues identified in the current state of the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Issue:** The JWT signing and verification processes in `backend/routes/adminroute.js` and `backend/routes/routes.js` use a hardcoded string `"secret"` instead of the environment variable defined in `.env`.
- **Impact:** Compromises the security of the application. If the source code is exposed, anyone can forge valid JWT tokens.
- **Affected Files:**
  - `backend/routes/adminroute.js`
  - `backend/routes/routes.js`

### 1.2 Missing Authentication and Authorization Middleware
- **Issue:** Several administrative routes in `backend/routes/adminroute.js` lack middleware to verify the user's token and ensure they have administrative privileges.
- **Impact:** Any user (or even unauthenticated users for some endpoints) can delete users, edit details, or create new users if they know the endpoint URL.
- **Affected Endpoints:**
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`

### 1.3 Sensitive Data Exposure
- **Issue:** The `/api/admin/users` endpoint returns the entire user object from the database, including the hashed password.
- **Impact:** Exposure of hashed passwords increases the risk of offline brute-force or rainbow table attacks if the data is intercepted or leaked.
- **Affected Endpoint:** `GET /api/admin/users`

### 1.4 Admin Session Overwrite on User Creation
- **Issue:** When an administrator creates a new user via `/api/admin/createuser`, the backend generates a new JWT for the *newly created user* and sets it as the `jwt` cookie.
- **Impact:** This overwrites the administrator's own session cookie, effectively logging them out and logging them in as the new user.
- **Affected Endpoint:** `POST /api/admin/createuser`

## 2. Logic and Frontend Errors

### 2.1 Misplaced `withCredentials` in HttpClient Calls
- **Issue:** In `AdminUserlistComponent.deleteUser` and `AdminUsereditComponent.getusers`, the `withCredentials` option is passed as the second argument to `http.post`. Angular interprets this as the request body rather than the options object.
- **Impact:** The request fails to send the necessary authentication cookies, and the backend receives an object `{withCredentials: true}` as the payload instead of a proper request body.
- **Affected Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`

### 2.2 Missing Search Functionality
- **Issue:** The `AdminUserlistComponent` is missing the search functionality and the `onSearch` method, although it is a common requirement for user management interfaces.
- **Impact:** Poor user experience when managing a large number of users.

### 2.3 Directory Misspelling
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Non-standard naming convention that can lead to confusion and build script errors.

## 3. Infrastructure and Testing Issues

### 3.1 Hardcoded MongoDB Connection String
- **Issue:** The MongoDB connection string is hardcoded in `backend/index.js`.
- **Impact:** Makes the application difficult to deploy across different environments (development, staging, production).

### 3.2 Missing and Failing Tests
- **Issue:**
  - The `backend` lacks any unit or integration tests.
  - The `frondend` unit tests have a high failure rate (e.g., 12 out of 14 failing).
- **Impact:** Lack of confidence in code changes and high risk of regressions.

### 3.3 Improper Model Definition
- **Issue:** In `backend/models/user.js`, `is_admin` is defined as a `String` but defaulted to a boolean `false`.
- **Impact:** Type inconsistency can lead to unexpected behavior during database queries or data validation.
