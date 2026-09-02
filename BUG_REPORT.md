# Bug Report and Security Audit

## Executive Summary
This report details critical security vulnerabilities, backend logic errors, frontend UI/runtime defects, and test suite deficiencies identified across the JWT User Management application (`backend` and `frondend/jwtapp`).

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets (High Severity)
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: JWT signing and verification calls explicitly hardcode the secret string `"secret"` (e.g. `jwt.sign({ _id: user._id }, "secret")` and `jwt.verify(cookie, "secret")`) instead of loading secret keys from environment variables (`process.env.jwtsecret`).
- **Impact**: Anyone with knowledge of the repository can forge JWT authentication cookies for any user or administrator ID.

### 1.2 Unprotected Administrative API Endpoints (Critical Severity)
- **Location**: `backend/routes/adminroute.js`
- **Description**: Several admin endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`) lack authentication and authorization verification. No JWT verification or `is_admin` check is performed on incoming requests.
- **Impact**: Any unauthenticated attacker can view, edit, or delete any user account in the database by sending HTTP requests directly to these endpoints.

### 1.3 Sensitive Data Leakage / Password Exposure (High Severity)
- **Location**: `backend/routes/adminroute.js` - GET `/users`
- **Description**: The `/users` route executes `User.find({})` and directly returns all user documents without stripping sensitive fields.
- **Impact**: Hashed user passwords (`password` field) are exposed in cleartext JSON to any client querying the `/users` route.

### 1.4 Admin Session Hijacking / Cookie Overwrite on User Creation (High Severity)
- **Location**: `backend/routes/adminroute.js` - POST `/createuser`
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the handler generates a new JWT token for the newly created user and sets it as `res.cookie("jwt", token)`.
- **Impact**: This immediately overwrites the administrator's `jwt` session cookie with the new standard user's token, unexpectedly downgrading/logging out the admin.

### 1.5 Missing Anti-CSRF Protection (Medium Severity)
- **Location**: `backend/index.js`
- **Description**: CORS allows `http://localhost:4200` with `credentials: true` and cookie-based authentication, but no CSRF tokens or SameSite strict enforcement are implemented.
- **Impact**: Susceptible to Cross-Site Request Forgery attacks if users visit malicious third-party origins.

---

## 2. Backend Logic & Database Issues

### 2.1 Mismatched Field Type in User Model
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined with `type: String, default: false`.
- **Impact**: Storing a boolean `false` as a default on a String field causes type inconsistency and potential unexpected query results when filtering (e.g., `User.findOne({ email, is_admin: true })`).

### 2.2 Unhandled File Upload Exceptions
- **Location**: `backend/routes/routes.js` - POST `/profile-upload-single`
- **Description**: The route directly accesses `req.file.filename`. If a client posts to this endpoint without attaching a file or with an incorrect field name, `req.file` is `undefined`, causing a `TypeError`.
- **Impact**: The exception is caught by an empty `catch (error) {}` block without sending an HTTP response, causing client connections to hang indefinitely until timeout.

### 2.3 Silent Exception Suppression & Lack of Client Error Responses
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Multiple routes contain empty `catch` blocks or fail to send response status codes when database operations fail or invalid params are provided.
- **Impact**: Clients receive no feedback or standard HTTP status codes (e.g., 500 / 400) when server errors occur.

---

## 3. Frontend Bugs & UI Logic Defects

### 3.1 Incorrect `HttpClient.post` Parameter Signature
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: `this.http.post` is invoked as `this.http.post(url, { withCredentials: true })`. Angular's `HttpClient.post` signature is `post(url, body, options)`.
- **Impact**: `{ withCredentials: true }` is sent as the request payload body instead of HTTP request options. As a result, cookies/credentials are not sent with the request, and backend authentication fails.

### 3.2 Null Pointer Exception on Profile Image Upload
- **Location**: `frondend/jwtapp/src/app/components/profile/profile.component.ts` (`onSubmit`)
- **Description**: `this.selectedFile.name` is accessed directly during form payload construction without validating whether `this.selectedFile` is non-null.
- **Impact**: Submitting the profile form without picking a file throws an unhandled JS runtime `TypeError: Cannot read properties of null (reading 'name')`.

### 3.3 Non-Functional Search Input
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input element (`<input type="text" placeholder="Search" class="input">`) is purely static HTML without `[(ngModel)]` binding, event listeners, or NgRx selector filtering logic.
- **Impact**: Admin users cannot search or filter the user list.

### 3.4 Missing Angular Route Guards
- **Location**: `frondend/jwtapp/src/app/app-routing.module.ts` & `admin.routing.ts`
- **Description**: Frontend routes lack `canActivate` guards.
- **Impact**: Unauthenticated users can navigate directly to protected route URLs (e.g., `/profile`, `/admin/dashboard`, `/admin/userlist`).

---

## 4. Environment & Repository Issues

### 4.1 Misspelled Directory Name
- **Location**: Root repository structure (`frondend/` instead of `frontend/`)
- **Impact**: Non-standard naming convention that may break automated build scripts or CI pipelines expecting `frontend/`.

### 4.2 Missing/Failing Unit Tests
- **Location**: `frondend/jwtapp/src/app/` spec files
- **Description**: Component spec files lack test mock imports (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Impact**: Running `ng test` results in widespread `NullInjectorError` failures.

---

## Summary Matrix

| Issue | Severity | Category | Affected File(s) |
|---|---|---|---|
| Hardcoded Secret `"secret"` | High | Security | `backend/routes/routes.js`, `adminroute.js` |
| Unprotected Admin Endpoints | Critical | Security | `backend/routes/adminroute.js` |
| Sensitive Data Exposure (`password`) | High | Security | `backend/routes/adminroute.js` |
| Admin Cookie Overwrite on Create User | High | Security / Logic | `backend/routes/adminroute.js` |
| `is_admin` Schema Type Mismatch | Medium | Database | `backend/models/user.js` |
| Unhandled Upload Null Pointer | Medium | Backend Logic | `backend/routes/routes.js` |
| `HttpClient.post` Signature Misuse | High | Frontend | `admin-userlist.component.ts`, `admin-useredit.component.ts` |
| Uncaught Null Pointer on File Upload | Medium | Frontend | `profile.component.ts` |
| Non-Functional Search Bar | Low | Frontend UI | `admin-userlist.component.html` |
| Missing Route Guards | Medium | Frontend Security | `app-routing.module.ts`, `admin.routing.ts` |
| Misspelled `frondend` Directory | Low | Repository | Root folder structure |
