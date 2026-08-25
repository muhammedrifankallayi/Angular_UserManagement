# Bug Report & Vulnerability Analysis

## Overview

This report details security vulnerabilities, logic errors, architectural flaws, and test suite failures identified across the backend and frontend components of the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Token generation (`jwt.sign`) and verification (`jwt.verify`) hardcode `"secret"` as the secret key instead of referencing environment variables (`process.env.jwtsecret`).
* **Impact:** High. Secret key exposure allows attackers to forge valid JWT tokens and bypass authentication entirely.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
* **Location:** `backend/routes/adminroute.js`
* **Description:** Several administrative routes (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack JWT authentication and role verification middleware.
* **Impact:** Critical. Unauthenticated users can perform administrative operations, including querying all user records and deleting or modifying user accounts.

### 1.3 Exposure of Passwords in API Responses
* **Location:** `backend/routes/adminroute.js` (`/users`)
* **Description:** The `GET /api/admin/users` endpoint returns raw database user objects without stripping the `password` field.
* **Impact:** High. Exposes password hashes of all registered users to any caller.

### 1.4 Lack of Cross-Site Request Forgery (CSRF) Protection
* **Location:** `backend/index.js`
* **Description:** CORS permits `http://localhost:4200` with `credentials: true` using `httpOnly` cookies, but no CSRF protection (tokens or SameSite cookie attributes) is configured.
* **Impact:** Medium-High. Attackers can perform unauthorized actions on behalf of authenticated users via cross-site requests.

---

## 2. Backend Logic & Reliability Errors

### 2.1 Admin Session Overwrite on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
* **Description:** When an administrator creates a new user, the route signs a new JWT token for the created user and sets it as the `jwt` cookie in the response.
* **Impact:** High. Overwrites the active administrator session cookie with the newly created user's session.

### 2.2 Mongoose Schema Type Mismatch
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field is defined with `type: String` but given a boolean default value (`default: false`).
* **Impact:** Medium. Leads to type inconsistencies when querying or comparing admin status.

### 2.3 Unhandled Missing File Exception in Upload Endpoint
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description:** Accesses `req.file.filename` directly without checking if `req.file` exists.
* **Impact:** Medium. If a request is sent without a file payload, an unhandled exception causes an application error.

### 2.4 Silent Exception Suppression and Hanging Requests
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Multiple endpoints contain empty `catch (error) {}` blocks or fail to return HTTP responses upon failure.
* **Impact:** Medium. Client requests hang indefinitely or fail silently without diagnostic messages.

---

## 3. Frontend Bugs & UI Issues

### 3.1 Incorrect `HttpClient.post` Parameter Ordering
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`) and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Description:** Calls to `http.post(url, { withCredentials: true })` pass request options as the second argument (`body`) instead of the third argument (`options`).
* **Impact:** High. Options like `withCredentials` are sent as request body data rather than HTTP request settings, causing authentication failures or invalid payload errors.

### 3.2 Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element (`<input type="text" placeholder="Search" class="input">`) lacks model bindings, event listeners, or supporting logic in `AdminUserlistComponent`.
* **Impact:** Low-Medium. UI presents interactive elements that do not perform filtering or searching.

### 3.3 Misspelled Directory Name
* **Location:** Root directory
* **Description:** The frontend folder is named `frondend` instead of `frontend`.
* **Impact:** Low. Inconvenience in project structure and potential path resolution issues in scripts.

---

## 4. Test Suite Issues

### 4.1 Unconfigured Angular Unit Test Providers
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:** Unit test spec files fail to provide mock instances or modules (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in `TestBed` setups, raising `NullInjectorError` errors during execution.
* **Impact:** Medium. Prevents automated verification of frontend components.
