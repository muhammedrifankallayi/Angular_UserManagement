# Comprehensive Bug Report

This document outlines all identified security vulnerabilities, logic errors, frontend component issues, and test infrastructure deficiencies across the codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** JWT generation (`jwt.sign`) and verification (`jwt.verify`) hardcode `"secret"` instead of reading from `process.env.jwtsecret` (defined in `backend/.env`).
* **Impact:** Anyone with knowledge of the repository can forge arbitrary JWT tokens, leading to full authentication bypass.
* **Recommendation:** Replace `"secret"` with `process.env.jwtsecret` across all route handlers.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
* **Location:** `backend/routes/adminroute.js`
* **Description:** Endpoints such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, `POST /api/admin/editUser`, and `POST /api/admin/createuser` lack middleware to verify the JWT cookie or check if the user has `is_admin` privileges.
* **Impact:** Unauthenticated users or non-admin users can access, create, modify, or delete user records.
* **Recommendation:** Create and apply authentication and admin authorization middleware to guard all administrative routes.

### 1.3 Sensitive Data Exposure in User Listing API
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Description:** `User.find({})` returns full user documents, including bcrypt-hashed passwords, directly to the client.
* **Impact:** Exposes user password hashes to any caller of the API endpoint.
* **Recommendation:** Project out or strip the `password` field before returning user data (e.g. `User.find({}, { password: 0 })`).

### 1.4 CSRF Risk and Unprotected Cookie Authentication
* **Location:** `backend/index.js`
* **Description:** The Express application uses `cookieParser()` and `cors({ credentials: true, origin: ['http://localhost:4200'] })` without Anti-CSRF token protection or Strict `SameSite` cookie attributes.
* **Impact:** Increases vulnerability to Cross-Site Request Forgery (CSRF) attacks for state-modifying requests.
* **Recommendation:** Implement Anti-CSRF tokens or set `SameSite: 'lax'` / `'strict'` on JWT cookies.

---

## 2. Backend Logic & API Errors

### 2.1 Admin Session Overwritten Upon User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Description:** When an admin creates a new user, the route signs a JWT token for the newly created user and attaches it to the response via `res.cookie("jwt", token, ...)`.
* **Impact:** The administrator's active session cookie is immediately overwritten with the newly created user's identity, logging the admin out or demoting their session.
* **Recommendation:** Remove `res.cookie` setting from the `/createuser` admin endpoint so the admin remains logged in.

### 2.2 Mongoose Schema Type Mismatch for `is_admin`
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` schema field is declared as `type: String`, but given a default boolean value `default: false`.
* **Impact:** Inconsistent data types in MongoDB (`"true"`, `true`, `false`) leading to unexpected query behavior when checking admin status (e.g., `is_admin: true`).
* **Recommendation:** Change `is_admin` schema definition to `type: Boolean, default: false`.

### 2.3 Unhandled Null Pointer in Profile Image Upload Route
* **Location:** `backend/routes/routes.js` (`POST /api/profile-upload-single`)
* **Description:** Accesses `req.file.filename` without verifying whether `req.file` was provided by `multer`.
* **Impact:** If a request is sent without a file attachment, Node.js throws a `TypeError: Cannot read properties of undefined (reading 'filename')`.
* **Recommendation:** Add a guard clause checking `if (!req.file)` and return a `400 Bad Request` response.

### 2.4 Silent Failure and Unhandled Exceptions in Express Routes
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Multiple route catch blocks are empty or only `console.log` errors without sending a response back to the client.
* **Impact:** When an exception occurs, the HTTP request hangs until it times out.
* **Recommendation:** Ensure all catch blocks log the error and return an appropriate status code (e.g. `res.status(500).json({ message: 'Internal server error' })`).

---

## 3. Frontend Bugs & UI Issues

### 3.1 Misconfigured `HttpClient.post` Parameter Signature
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`), `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Description:** Calls to `this.http.post(url, { withCredentials: true })` pass `{ withCredentials: true }` as the second argument (`body`) instead of the third argument (`options`).
* **Impact:** The options object is sent as the JSON body payload, while the HTTP request is dispatched without `withCredentials: true`, causing request authorization failures when cookie credentials are required.
* **Recommendation:** Pass `null` or `{}` as the body (second argument) and `{ withCredentials: true }` as the options (third argument): `this.http.post(url, {}, { withCredentials: true })`.

### 3.2 Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
* **Description:** The search input in the Admin User List view is a static HTML element without `[(ngModel)]` binding or filter logic in the component / NgRx state.
* **Impact:** Users cannot filter or search the user list.
* **Recommendation:** Bind search input to a filter term property and implement filtered selector logic in NgRx or the component.

### 3.3 Misspelled Directory Name
* **Location:** Repository root (`frondend/`)
* **Description:** The directory containing the Angular application is named `frondend` instead of `frontend`.
* **Impact:** Misleading project structure name.
* **Recommendation:** Rename `frondend/` to `frontend/` when appropriate.

---

## 4. Testing & Environment Deficiencies

### 4.1 Missing Backend Tests
* **Location:** `backend/package.json`
* **Description:** There are no automated unit or integration tests set up for backend routes, models, or authentication flows.
* **Recommendation:** Add a test runner (e.g., Jest or Supertest) to test API routes and authentication.

### 4.2 Failing Frontend Unit Tests
* **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
* **Description:** 12 of 14 Angular component unit tests fail due to missing dependencies (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in test module setups (`TestBed.configureTestingModule`).
* **Impact:** Automated test suite fails during build/CI checks.
* **Recommendation:** Update spec files to import `HttpClientTestingModule`, `RouterTestingModule`, and mock NgRx store providers.
