# Comprehensive Bug Report

This document details all discovered security vulnerabilities, backend logic errors, frontend bugs, structural/architectural issues, and test failures across the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
* **File(s)**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description**: JWT tokens are signed and verified using the string literal `"secret"` (e.g., `jwt.sign({_id:...}, "secret")`) instead of loading secret keys securely from environment variables (`process.env.jwtsecret`).
* **Impact**: High. Anyone with knowledge of the codebase can forge JWT authentication tokens and impersonate any user or admin.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **File(s)**: `backend/routes/adminroute.js`
* **Description**: Admin management endpoints such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, `POST /api/admin/editUser`, and `POST /api/admin/createuser` do not verify JWT cookies or check whether the requesting user has administrative privileges (`is_admin: true`).
* **Impact**: Critical. Unauthenticated attackers can query, edit, create, or delete user accounts without credentials.

### 1.3 Exposure of Sensitive Password Hashes in API Responses
* **File(s)**: `backend/routes/adminroute.js` (`GET /users`)
* **Description**: `adminrouter.get('/users')` returns raw MongoDB user objects without omitting or stripping the `password` property.
* **Impact**: High. User password hashes are exposed to clients querying the `/users` endpoint.

### 1.4 Misconfigured User Schema Type for Admin Flag
* **File(s)**: `backend/models/user.js`
* **Description**: The `is_admin` field in `userSchema` is defined with type `String` with a default value of `false` (boolean).
* **Impact**: Medium. Type inconsistency can lead to unexpected evaluation when querying or checking user admin status (e.g., `"false"` string evaluating as truthy in JavaScript).

---

## 2. Backend Logic Errors & Quality Issues

### 2.1 Admin Account Overwrite / Session Hijacking on User Creation
* **File(s)**: `backend/routes/adminroute.js` (`POST /createuser`)
* **Description**: When an administrator creates a new user via `/api/admin/createuser`, the route issues a new `jwt` cookie for the newly created user ID, overwriting the administrator's own session cookie.
* **Impact**: High. Creating a user immediately logs out the administrator and logs them in as the newly created user.

### 2.2 Unhandled File Upload Exception
* **File(s)**: `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description**: The route attempts to access `req.file.filename` directly without checking if `req.file` exists. If a request is sent without a file payload, an unhandled exception (`TypeError: Cannot read properties of undefined`) is thrown.
* **Impact**: Medium. Leads to crashes or unhandled promise rejections on malformed requests.

### 2.3 Poor Error Handling and Swallowed Exceptions
* **File(s)**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description**: Multiple try/catch blocks either swallow exceptions silently without sending a response (e.g., `catch (error) {}` in `/profile-upload-single` or `/logout`) or log error messages to stdout without returning HTTP error status codes to the client, leaving HTTP requests hanging.
* **Impact**: Medium. Causes client timeouts and makes debugging difficult.

---

## 3. Frontend Bugs & Limitations

### 3.1 Incorrect HttpClient Request Parameter Passing
* **File(s)**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Description**: `http.post` calls pass HTTP options (such as `{ withCredentials: true }`) as the second argument instead of the third argument (body). For example: `http.post('http://localhost:5000/api/admin/deleteUser/' + id, { withCredentials: true })`.
* **Impact**: High. Angular sends `{ withCredentials: true }` as the HTTP POST body payload, while options (and credential sending) are neglected.

### 3.2 Unimplemented Search Functionality
* **File(s)**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`, `admin-userlist.component.ts`
* **Description**: The user search input element in `admin-userlist` is purely presentational and lacks binding or event listeners to filter user lists.
* **Impact**: Low. Feature is incomplete for admin users.

### 3.3 Misspelled Root Directory
* **File(s)**: Root directory (`frondend/`)
* **Description**: The frontend project directory is named `frondend` instead of `frontend`.
* **Impact**: Minor developer experience and naming consistency issue.

---

## 4. Test Failures & Missing Providers

### 4.1 Unit Test Execution Failures
* **File(s)**: `frondend/jwtapp/src/app/**/*.spec.ts`
* **Description**: 12 of 14 unit tests fail when executing `./node_modules/.bin/ng test --no-watch --no-progress --browsers=ChromeHeadless` due to missing Angular testing imports:
  * `NullInjectorError: No provider for HttpClient!`
  * `NullInjectorError: No provider for Router!`
  * `NullInjectorError: No provider for Store!`
* **Impact**: High. Test suite is broken out-of-the-box. Needs `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` configured in component spec files.
