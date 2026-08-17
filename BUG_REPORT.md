# Comprehensive Bug Report

This document details security vulnerabilities, logic errors, architectural concerns, and test failure issues present in the project.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: JWT tokens are signed and verified using a hardcoded string `"secret"` (e.g., `jwt.sign({ _id }, "secret")` and `jwt.verify(cookie, "secret")`). Although a `.env` file exists with `jwtsecret`, it is not being utilized.
- **Impact**: Anyone with knowledge of the repository or source code can forge JWT tokens and impersonate any user or admin.

### 1.2 Missing Authentication / Authorization Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Administrative endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication or admin-role verification middleware.
- **Impact**: Unauthenticated users or regular users can access and perform administrative actions (e.g., deleting or editing user accounts, viewing all user records).

### 1.3 Sensitive User Data (Passwords) Exposed in API Responses
- **Location**: `backend/routes/adminroute.js` - `GET /users`
- **Description**: The `/users` endpoint returns raw database documents (`User.find({})`) without excluding the hashed `password` field.
- **Impact**: Password hashes are leaked to clients calling the user list endpoint.

### 1.4 Missing CSRF Protection & Permissive CORS Configuration
- **Location**: `backend/index.js`
- **Description**: CORS is configured with `credentials: true` for `http://localhost:4200`, and authentication tokens are stored in HTTP cookies (`jwt`). However, there is no CSRF token mechanism implemented.
- **Impact**: The application is vulnerable to Cross-Site Request Forgery (CSRF) attacks.

---

## 2. Backend Logic Errors & Bugs

### 2.1 Inconsistent `is_admin` Schema Definition
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field in Mongoose schema is typed as `String` (`type: String, default: false`), while default value is boolean `false` and query in `adminroute.js` checks `is_admin: true`.
- **Impact**: Query mismatch or unexpected casting behavior when looking up admin users.

### 2.2 Admin User Creation Overwrites Admin's Session Cookie
- **Location**: `backend/routes/adminroute.js` - `POST /createuser`
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the route generates a new JWT token for the newly created user and sets it as the `jwt` cookie in the response.
- **Impact**: The logged-in administrator is immediately logged out / switched to the newly created user session upon user creation.

### 2.3 Unhandled Errors and Empty Catch Blocks
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Multiple routes contain empty `catch (error) {}` blocks (e.g., `profile-upload-single`, `deleteUser`) or catch blocks that log without returning an HTTP response to the client.
- **Impact**: Unhandled errors result in hung requests (client waiting indefinitely for response timeout) or masked failures.

### 2.4 Missing File Validation in Upload Route
- **Location**: `backend/routes/routes.js` - `POST /profile-upload-single`
- **Description**: The handler directly accesses `req.file.filename` without checking whether `req.file` exists.
- **Impact**: If a request is submitted without an uploaded file, the application throws an uncaught exception (`Cannot read properties of undefined (reading 'filename')`).

---

## 3. Frontend Bugs & Issues

### 3.1 Misspelled Directory Name
- **Location**: Repository root directory (`frondend/`)
- **Description**: The frontend folder is named `frondend` instead of `frontend`.

### 3.2 Incorrect `HttpClient.post` Options Argument in Admin Components
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit/admin-useredit.component.ts`
- **Description**: In HTTP POST requests, options like `{ withCredentials: true }` are passed as the second argument instead of the third argument (e.g. `http.post(url, { withCredentials: true })` instead of `http.post(url, body, { withCredentials: true })`).
- **Impact**: HTTP POST requests send option objects as request payload bodies instead of configuring headers/credentials.

### 3.3 Non-Functional Search Input
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Description**: The user search input element in the Admin User List template is static HTML and lacks event bindings, component properties, or NgRx selector filtering logic.
- **Impact**: The search bar in the admin dashboard does not function.

### 3.4 Unit Test Failures
- **Location**: `frondend/jwtapp/src/app/**/*.spec.ts`
- **Description**: 12 out of 14 Angular component unit test specs fail due to missing provider configurations (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx MockStore setup).
- **Impact**: Automated frontend testing is broken.
