# Bug Report & System Security Audit

## Executive Summary
This document details identified security vulnerabilities, logic bugs, schema inconsistencies, UI defects, and test failures across the application codebase (Backend Express Node.js API and Frontend Angular 16 application).

---

## 1. Backend Vulnerabilities & Logic Issues

### 1.1. Hardcoded JWT Secret Key
* **Severity:** High
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** JWT verification and signing operations hardcode the secret string `"secret"` instead of reading from `process.env.jwtsecret` (configured in `backend/.env`).
* **Impact:** Inability to rotate secrets securely and potential compromise if secret is leaked in source code.
* **Recommendation:** Replace `"secret"` with `process.env.jwtsecret` across all JWT methods.

### 1.2. Missing Authentication & Authorization Middleware on Admin Endpoints
* **Severity:** Critical
* **Location:** `backend/routes/adminroute.js`
* **Description:** Endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication verification and role-based access control (admin check).
* **Impact:** Any unauthenticated user or guest can view user lists, delete accounts, or modify user details by calling API endpoints directly.
* **Recommendation:** Add an authentication/authorization middleware that verifies the JWT token cookie and ensures `is_admin === true`.

### 1.3. Sensitive Password Hashes Returned in API Responses
* **Severity:** High
* **Location:** `backend/routes/adminroute.js` (`/users`)
* **Description:** The `User.find({})` query returns full user documents, including password hashes, to the client.
* **Impact:** Password hash exposure allows offline brute-forcing attacks on user credentials.
* **Recommendation:** Exclude the `password` field from user query projections (e.g., `User.find({}, { password: 0 })`).

### 1.4. Admin User Creation Cookie Overwrite Logic Bug
* **Severity:** High
* **Location:** `backend/routes/adminroute.js` (`/createuser`)
* **Description:** When an admin creates a user via `/api/admin/createuser`, the route generates a new JWT token for the newly created user and sets it in the response cookie (`res.cookie("jwt", token)`).
* **Impact:** Overwrites the current logged-in administrator's active session cookie, forcing them out of their admin session.
* **Recommendation:** Do not issue or set a new JWT cookie upon administrative user creation.

### 1.5. Unhandled Null Check on File Upload (`req.file`)
* **Severity:** Medium
* **Location:** `backend/routes/routes.js` (`/profile-upload-single`)
* **Description:** Accesses `req.file.filename` directly without checking if `req.file` exists.
* **Impact:** Server crashes with an unhandled TypeError (`Cannot read properties of undefined`) if a user submits a POST request without attaching a file.
* **Recommendation:** Validate `req.file` before proceeding with database updates.

### 1.6. Poor Error Handling & Empty Catch Blocks
* **Severity:** Medium
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Multiple endpoints catch errors with empty catch blocks or console log without sending error responses (e.g., status 500) to the client.
* **Impact:** Client requests hang indefinitely or timeout without receiving an HTTP response when server errors occur.
* **Recommendation:** Implement standard error response handling (`res.status(500).json({ message: "Internal server error" })`) in all catch blocks.

### 1.7. Database Schema Field Type Inconsistency
* **Severity:** Medium
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` schema field is typed as `String` (`type: String, default: false`), but assigned boolean defaults and used with boolean comparisons in queries (`is_admin: true`).
* **Impact:** Inconsistent querying behavior in Mongoose depending on string vs. boolean coercion.
* **Recommendation:** Update `userSchema` to type `is_admin` as `Boolean` (`type: Boolean, default: false`).

---

## 2. Frontend Bugs & Defects

### 2.1. Incorrect `HttpClient.post` Options Parameter Index
* **Severity:** High
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
* **Description:** HTTP POST calls pass `{ withCredentials: true }` as the second parameter (`body`) instead of the third parameter (`options`). For example: `http.post(url, { withCredentials: true })`.
* **Impact:** Sends `{ withCredentials: true }` as request payload body while failing to send session cookies with credentials.
* **Recommendation:** Pass proper request body as 2nd argument and options object as 3rd argument (`http.post(url, body, { withCredentials: true })`).

### 2.2. Non-Functional Search Bar Implementation
* **Severity:** Medium
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element in the Admin User List view is a static HTML template element lacking `[(ngModel)]`, event bindings, or state selector filtering logic.
* **Impact:** Users are unable to filter or search users in the administration view.
* **Recommendation:** Connect search input to component search term state and implement user filtering logic or NgRx selectors.

### 2.3. Misspelled Frontend Directory Name
* **Severity:** Low
* **Location:** Repository Root
* **Description:** Frontend folder is named `frondend` instead of `frontend`.
* **Impact:** Potential confusion and inconsistent pathing across script tooling.

---

## 3. Frontend Unit Test Failures

### 3.1. Missing Testing Module / Provider Dependencies
* **Severity:** Medium
* **Location:** Component spec files (`*.spec.ts`) in `frondend/jwtapp/src/app/components/`
* **Description:** 12 out of 14 unit tests fail execution due to missing providers (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, missing NgRx Store providers).
* **Impact:** CI/CD test suites fail to run cleanly.
* **Recommendation:** Update `TestBed.configureTestingModule` in spec files to import `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore({})`.
