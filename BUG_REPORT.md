# Comprehensive Bug Report & Security Audit

This document provides a detailed breakdown of security vulnerabilities, application bugs, architectural flaws, and test failures identified across the codebase.

---

## 1. Critical Security Vulnerabilities

### 1.1. Missing Authentication & Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization verification.
* **Impact:** Any unauthenticated user or client can call administrative endpoints to list all users, modify account details, delete users, or create accounts without admin credentials.
* **Remediation:** Implement and apply middleware that verifies the user's JWT token and ensures `is_admin` is `true` before processing admin requests.

### 1.2. Sensitive Password Hashes Exposed in User List
* **Location:** `backend/routes/adminroute.js` (`/users` endpoint)
* **Description:** The `/users` route executes `User.find({})` and directly returns the raw user objects, including hashed passwords (`password` field).
* **Impact:** Exposes password hashes to API consumers, increasing vulnerability to offline brute-force and dictionary attacks.
* **Remediation:** Exclude the `password` field from queries or strip it before sending responses (e.g., `User.find({}, { password: 0 })`).

### 1.3. Hardcoded JWT Secret & Environment Variable Mismatch
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** The `.env` file defines `jwtsecret="secret"`, but backend routes hardcode `"secret"` as a literal string in `jwt.sign()` and `jwt.verify()` calls instead of referencing `process.env.jwtsecret`.
* **Impact:** Secret management cannot be configured per environment, and production secrets could be committed to source control.
* **Remediation:** Replace hardcoded `"secret"` strings with `process.env.jwtsecret`.

### 1.4. Lack of CSRF Protection
* **Location:** `backend/index.js`
* **Description:** The application uses cookie-based authentication with `cors` set to `credentials: true`, but does not implement CSRF tokens or `SameSite` cookie policies.
* **Impact:** Vulnerable to Cross-Site Request Forgery (CSRF) attacks where authenticated browser requests are forged by third-party sites.
* **Remediation:** Implement CSRF protection middleware (or `SameSite` cookie attributes) and validate tokens on state-changing requests.

### 1.5. Hardcoded Database Connection String
* **Location:** `backend/index.js`
* **Description:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
* **Impact:** Inflexibility across deployment environments (dev, staging, production).
* **Remediation:** Move the database URI to `process.env.MONGO_URI` with a sensible fallback.

---

## 2. Backend Logic & Runtime Bugs

### 2.1. Admin Session Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
* **Description:** When an admin creates a new user via `/api/admin/createuser`, the route issues `res.cookie("jwt", token)` for the newly created user ID.
* **Impact:** The logged-in administrator's cookie is overwritten by the newly created user's token, logging out the admin.
* **Remediation:** Remove cookie setting logic from user creation endpoints intended for administrators.

### 2.2. Schema Type Mismatch in User Model
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field in `userSchema` is typed as `String`, but its default value is specified as `false` (boolean).
* **Impact:** Inconsistent data types in MongoDB and potential type conversion bugs when performing strict comparisons or database queries.
* **Remediation:** Change `type: String` to `type: Boolean` in `userSchema`.

### 2.3. Unhandled Null Check on Single Profile Image Upload
* **Location:** `backend/routes/routes.js` (`/profile-upload-single` endpoint)
* **Description:** The route accesses `req.file.filename` assuming a file was uploaded. If a request is submitted without a file payload, `req.file` is `undefined`.
* **Impact:** Unhandled `TypeError: Cannot read property 'filename' of undefined`, causing server error responses.
* **Remediation:** Validate `if (!req.file)` before accessing `req.file.filename` and return a `400 Bad Request`.

### 2.4. Suppressed Exceptions & Poor Error Handling
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Multiple routes contain empty `catch` blocks or catch errors without returning HTTP response status codes or messages to the client.
* **Impact:** Requests hang or fail silently on server errors, leaving the client without status feedback.
* **Remediation:** Log errors properly and return appropriate HTTP status codes (e.g., `500 Internal Server Error`).

---

## 3. Frontend Application & Testing Issues

### 3.1. Misspelled Root Frontend Directory Name
* **Location:** `frondend/`
* **Description:** The directory name is misspelled as `frondend` instead of `frontend`.
* **Impact:** Developer confusion and tooling script mismatches.
* **Remediation:** Rename directory from `frondend/` to `frontend/` (if appropriate for repository structure).

### 3.2. Incorrect Parameter Order in Angular HttpClient Post Requests
* **Location:** `AdminUserlistComponent` and `AdminUsereditComponent`
* **Description:** Calls to `HttpClient.post()` pass options object `{ withCredentials: true }` as the 2nd argument instead of the 3rd argument (body payload).
* **Impact:** Causes empty payloads to be transmitted or options to be misinterpreted as request body payloads.
* **Remediation:** Ensure `HttpClient.post(url, body, options)` is called with 3 arguments (e.g., `this.http.post(url, {}, { withCredentials: true })`).

### 3.3. Non-Functional Search Bar in Admin User List
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
* **Description:** The search input element in the template is static HTML and lacks event bindings, model binding (`ngModel`), or NgRx state integration.
* **Impact:** Users cannot search or filter the user list.
* **Remediation:** Implement search state filtering in NgRx selectors/actions and bind search input.

### 3.4. Failing Frontend Unit Tests
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:** 12 out of 14 Angular component unit tests fail due to missing module imports (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
* **Impact:** Test suite fails during automated CI/CD runs.
* **Remediation:** Add `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` to component spec `TestBed` setup.
