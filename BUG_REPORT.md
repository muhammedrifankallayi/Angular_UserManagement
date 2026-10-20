# Bug Report

## Overview
This document details identified bugs, security vulnerabilities, architectural flaws, and testing issues discovered within the backend (Node.js/Express/MongoDB) and frontend (Angular) applications.

---

## 1. Security Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Routes
* **File:** `backend/routes/adminroute.js`
* **Description:** Endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack middleware to verify if the requesting user is authenticated and possesses admin permissions (`is_admin: true`). Unauthenticated users can access or perform administrative operations.

### 1.2 User Password Hashes Returned in User List API Response
* **File:** `backend/routes/adminroute.js`
* **Description:** The `/users` endpoint executes `User.find({})` and returns raw user documents directly to the client, including hashed passwords (`password` field). Password hashes should be excluded from responses.

### 1.3 Hardcoded Secret Key for JWT Signing and Verification
* **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** JWTs are signed and verified using a hardcoded string literal `"secret"` instead of referencing environment variables (`process.env.jwtsecret`).

### 1.4 Unhandled Profile Image Upload Missing `req.file` Check
* **File:** `backend/routes/routes.js`
* **Description:** In the `/profile-upload-single` endpoint, `req.file.filename` is accessed directly without checking whether `req.file` exists. Sending a request without a file attachment causes an unhandled exception or server error.

---

## 2. Backend Logic Errors & Schema Flaws

### 2.1 Inconsistent `is_admin` Field Definition in User Schema
* **File:** `backend/models/user.js`
* **Description:** `is_admin` is defined with type `String` but has a boolean default value `default: false`. Queries checking `is_admin: true` rely on type coercion or loose comparison, leading to unexpected query behavior.

### 2.2 Admin Session Overwritten Upon Creating User
* **File:** `backend/routes/adminroute.js`
* **Description:** When an admin creates a new user via `/api/admin/createuser`, the route issues a new JWT cookie corresponding to the newly created user ID. This overwrites the admin's active JWT session cookie, logging the administrator out and switching their active session.

### 2.3 Silent Catch Blocks & Poor Error Handling
* **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Multiple routes feature empty catch blocks or catch blocks that log errors without sending an appropriate HTTP error status/response to the client, leading to hanging HTTP requests or silent client failures.

---

## 3. Frontend Logic Errors & Bugs

### 3.1 Incorrect `HttpClient.post` Options Argument Signature
* **Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Description:** Angular's `HttpClient.post(url, body, options)` expects the request payload as its second parameter and configuration options (e.g., `{ withCredentials: true }`) as its third parameter. Passing options as the second parameter results in sending `{ withCredentials: true }` as the request body rather than configuring request headers/options.

### 3.2 Non-Functional User Search Input
* **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input box (`<input type="text" placeholder="Search" class="input">`) is purely static HTML and lacks event bindings, Angular directives (`ngModel`), or component logic to filter the displayed user list.

---

## 4. Testing & Project Setup Issues

### 4.1 Missing Test Bed Providers in Frontend Spec Files
* **Files:** Component spec files in `frondend/jwtapp/src/app/components/`
* **Description:** Angular unit test suite components fail with `NullInjectorError` (e.g., missing providers for `HttpClient`, `Router`, or NgRx Store) because `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore` are missing from `TestBed` configurations.

### 4.2 Frontend Root Directory Naming
* **Directory:** `frondend/`
* **Description:** The root directory for the frontend application is misspelled as `frondend` instead of `frontend`.
