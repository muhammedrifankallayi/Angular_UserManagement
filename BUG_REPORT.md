# Bug Report & Security Audit Document

This document outlines the identified security vulnerabilities, logic errors, schema flaws, frontend issues, and configuration defects within the repository.

---

## 1. Backend Security Vulnerabilities & Misconfigurations

### 1.1 Hardcoded JWT Secret Key
- **File(s):** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** JWT signing (`jwt.sign`) and verification (`jwt.verify`) use a hardcoded string fallback `"secret"` instead of pulling from environment variables (`process.env.jwtsecret`).
- **Impact:** Hardcoded secrets allow anyone with source code access to forge JWT tokens and bypass authentication.

### 1.2 Missing Authentication and Authorization Middleware on Administrative Routes
- **File(s):** `backend/routes/adminroute.js`
- **Description:** Administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and admin role authorization checks. Any unauthenticated HTTP client can issue requests to these endpoints.
- **Impact:** Unauthorized users can view, edit, create, or delete user accounts without valid admin credentials.

### 1.3 Exposure of Sensitive Password Hashes in API Responses
- **File(s):** `backend/routes/adminroute.js` (`GET /users`)
- **Description:** The `/users` endpoint fetches all user records (`User.find({})`) and returns them directly in the JSON response without stripping the `password` field.
- **Impact:** Sensitive hashed passwords are leaked to API consumers.

### 1.4 Admin Session Cookie Overwrite on User Creation
- **File(s):** `backend/routes/adminroute.js` (`POST /createuser`)
- **Description:** When an administrator creates a new user account via `/createuser`, the route generates a JWT token for the newly created user and sets the `jwt` cookie.
- **Impact:** The logged-in administrator's active session cookie is overwritten by the newly created user's session cookie.

### 1.5 Unhandled Missing File Upload (`req.file`)
- **File(s):** `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Description:** The endpoint accesses `req.file.filename` directly without verifying whether `req.file` exists (e.g., if no file was uploaded in the request).
- **Impact:** Causes an unhandled TypeError runtime exception when an invalid or empty upload request is made.

---

## 2. Backend Model & Data Schema Issues

### 2.1 Inconsistent `is_admin` Field Type
- **File(s):** `backend/models/user.js`
- **Description:** The `is_admin` field in the Mongoose schema is defined with `type: String`, but given a default value of boolean `false`.
- **Impact:** Inconsistent data types in MongoDB records causing potential query anomalies and unexpected type coercion when querying `is_admin`.

---

## 3. Frontend Bugs & Architectural Defects

### 3.1 Angular `HttpClient.post` Parameter Mismatch
- **File(s):**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description:** In `HttpClient.post(url, body, options)`, the options object `{ withCredentials: true }` is passed as the second argument (`body`) instead of the third argument (`options`).
- **Impact:** The request body is populated with `{ withCredentials: true }` while actual request options (cookies/credentials) are omitted, causing CORS/auth cookie failures.

### 3.2 Non-Functional User Search Input
- **File(s):** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input `<input type="text" placeholder="Search" class="input">` is static HTML and is not bound to any component model, event listener, or state filter.
- **Impact:** Users cannot filter or search through the list of users in the admin dashboard.

### 3.3 Misspelled Directory Name
- **File(s):** Root directory structure (`frondend/`)
- **Description:** The frontend folder is misspelled as `frondend` instead of `frontend`.
- **Impact:** Potential confusion in project structure, deployment scripts, and developer tooling.

---

## 4. Environment & Package Configuration Issues

### 4.1 Missing Start Script in Backend
- **File(s):** `backend/package.json`
- **Description:** `backend/package.json` does not include a `"start"` script in `scripts`.
- **Impact:** Standard npm launch commands (`npm start`) fail for the backend service.
