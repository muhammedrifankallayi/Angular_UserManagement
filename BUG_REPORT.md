# Comprehensive Bug and Security Audit Report

## 1. Executive Summary
This report documents security vulnerabilities, backend/frontend logic bugs, configuration errors, and test failures identified across the application stack.

---

## 2. Security Vulnerabilities

### 2.1 Hardcoded JWT Secrets
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** JWT signing (`jwt.sign`) and verification (`jwt.verify`) use a hardcoded fallback string `"secret"` instead of reading from `process.env.jwtsecret` configured in `.env`.
* **Impact:** Anyone with knowledge of the repository source code can forge valid JWT tokens to bypass authentication.

### 2.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Critical administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not enforce authentication or verify if the requesting user possesses administrative privileges (`is_admin`).
* **Impact:** Unauthenticated attackers can query user records, modify existing user details, delete accounts, or create new accounts.

### 2.3 Sensitive Data Exposure (Password Hashes in API Response)
* **Location:** `backend/routes/adminroute.js` (`GET /users`)
* **Description:** The `/users` endpoint returns full user documents directly via `res.send(user)` without stripping the `password` field.
* **Impact:** Exposes user bcrypt password hashes over the network to any consumer of the endpoint.

### 2.4 Admin Session Overwriting upon User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
* **Description:** When an administrator creates a user via `/createuser`, the route generates a JWT token for the newly created user and sets it in the HTTP response cookie (`res.cookie("jwt", token, ...)`).
* **Impact:** The administrator's session cookie is immediately overwritten with the new user's credentials, logging the administrator out and switching their identity.

---

## 3. Backend Logic & Schema Issues

### 3.1 Mismatched Data Type in User Schema (`is_admin`)
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field is defined as `type: String` but assigned a default boolean value `default: false`.
* **Impact:** Causes type inconsistencies when performing queries or type checks across MongoDB operations.

### 3.2 Unhandled File Upload Exception
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description:** The handler directly accesses `req.file.filename` without verifying if `req.file` exists.
* **Impact:** If a request is sent without a file attachment, `TypeError: Cannot read property 'filename' of undefined` is thrown.

### 3.3 Silent Exception Catching & Missing HTTP Responses
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Several catch blocks log errors to `console.log` or remain entirely empty without returning an error response (e.g., status 500) to the client.
* **Impact:** Clients experience hanging requests or unhandled standard errors.

---

## 4. Frontend Logic & Design Deficiencies

### 4.1 HttpClient POST Option Misplacement
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `admin-useredit.component.ts`
* **Description:** `HttpClient.post` calls pass `{ withCredentials: true }` as the second argument (body) instead of the third argument (options): `http.post(url, { withCredentials: true })`.
* **Impact:** Cookies are not transmitted with the request, and the empty object `{ withCredentials: true }` is sent as the request payload.

### 4.2 Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element (`<input type="text" placeholder="Search" class="input">`) is purely static and lacks model binding, event listeners, or NgRx selector integration.
* **Impact:** Users cannot search or filter the user list.

### 4.3 Directory Naming Misspelling
* **Location:** Repository root
* **Description:** The Angular project directory is named `frondend/` instead of `frontend/`.

---

## 5. Test Suite & Infrastructure

### 5.1 Frontend Unit Test Failures
* **Location:** `frondend/jwtapp/`
* **Description:** 12 out of 14 Angular component spec tests fail due to missing mock providers in `TestBed` configurations (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, `No provider for Store!`).
* **Impact:** Frontend build/test pipeline fails during execution of `./node_modules/.bin/ng test`.

### 5.2 Missing Backend Test Suite
* **Location:** `backend/package.json`
* **Description:** The backend repository contains no test framework or test scripts defined.
