# Bug Report

This document details the security vulnerabilities, backend logic errors, data structure inconsistencies, frontend issues, and testing failures identified across the codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Authentication routes sign and verify JWT tokens using a hardcoded string `"secret"` (e.g., `jwt.sign({_id: user._id}, "secret")`) instead of loading secret key from environment variables (`process.env.jwtsecret`).
* **Impact:** Exposes JWT signing secret if repository access is compromised and prevents environment-based secret rotation.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Admin endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack JWT authentication checks and role-based access checks (`is_admin`).
* **Impact:** Unauthenticated users or non-admin users can view, edit, create, or delete arbitrary user records by making direct API requests.

### 1.3 Exposure of Sensitive Fields in API Responses
* **Location:** `backend/routes/adminroute.js` (`/users` route)
* **Description:** The `/users` endpoint returns raw user objects from MongoDB using `User.find({})` without stripping out password hashes.
* **Impact:** Password hashes are leaked to client applications over the network.

### 1.4 Unhandled Null File Upload in Profile Route
* **Location:** `backend/routes/routes.js` (`/profile-upload-single` route)
* **Description:** The route attempts to access `req.file.filename` directly without checking if `req.file` exists.
* **Impact:** Upload requests sent without a file payload cause uncaught type errors (`Cannot read property 'filename' of undefined`), crashing or hanging the request handler.

### 1.5 Session Cookie Overwrite during Admin User Creation
* **Location:** `backend/routes/adminroute.js` (`/createuser` route)
* **Description:** When an admin creates a new user via `/createuser`, the backend generates a new JWT token for the newly created user and sets it in the `jwt` cookie response header.
* **Impact:** Overwrites the administrator's session cookie with the new user's session cookie, demoting/logging out the admin upon creating a user.

---

## 2. Backend Logic and Schema Inconsistencies

### 2.1 Inconsistent `is_admin` Schema Data Type
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` schema property is defined as type `String` with default value `false` (boolean):
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
* **Impact:** Causes type inconsistency when querying or setting admin status (e.g., querying `{ is_admin: true }` vs string comparisons).

### 2.2 Suppressed Exceptions and Poor Error Handling
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Description:** Multiple route handlers use empty `catch (error) {}` blocks or log errors without returning HTTP responses to the client (e.g., `/deleteUser/:id`, `/profile-upload-single`).
* **Impact:** Requests hang or fail silently on the client side without returning appropriate HTTP error codes (e.g., 500 Internal Server Error).

---

## 3. Frontend Bugs and Architecture Issues

### 3.1 Incorrect Options Argument Position in HttpClient Calls
* **Location:** `AdminUserlistComponent` and `AdminUsereditComponent`
* **Description:** Several Angular `HttpClient.post()` calls pass request options (such as `{ withCredentials: true }`) as the second parameter (body) instead of the third parameter (options).
* **Impact:** Request bodies are sent as `{ withCredentials: true }` instead of the actual data payload, causing backend processing failures.

### 3.2 Non-Functional Search Input in User List
* **Location:** `AdminUserlistComponent` (`admin-userlist.component.html`)
* **Description:** The search input in the user list template is static HTML and lacks two-way data binding (`[(ngModel)]`), event handlers, or integration with state management/selectors.
* **Impact:** Filtering functionality is broken/unimplemented in the admin dashboard UI.

### 3.3 Misspelled Frontend Root Directory Name
* **Location:** Repository root (`frondend/`)
* **Description:** The frontend application directory is named `frondend` instead of `frontend`.
* **Impact:** Inconsistency in project structure and build script pathing.

---

## 4. Frontend Unit Testing Failures

### 4.1 Missing Providers in Spec Files
* **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
* **Description:** Unit tests fail with `NullInjectorError: No provider for HttpClient!` and `No provider for Router!` due to missing test module imports.
* **Impact:** 12 out of 14 unit test suites fail during `ng test`.
* **Resolution Requirement:** Spec files must import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` in `TestBed.configureTestingModule()`.
