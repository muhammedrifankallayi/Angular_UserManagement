# Comprehensive Bug Report

## Overview
This document outlines security vulnerabilities, backend logic errors, API issues, and frontend bugs identified in the JWT project.

---

## 1. Security Vulnerabilities & Authentication Issues

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Severity:** High
* **Description:** JWT signing and verification use a hardcoded string `"secret"` instead of reading from `process.env.jwtsecret` (or `process.env.JWT_SECRET`).
* **Impact:** Insecure key management; signing key exposed in code repositories.

### 1.2 Unprotected Admin Routes (Missing Authentication & Authorization Middleware)
* **Location:** `backend/routes/adminroute.js`
* **Severity:** Critical
* **Description:** Endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` do not verify the user's JWT token or admin privileges before executing administrative operations.
* **Impact:** Unauthenticated users can access, modify, or delete user accounts directly by making HTTP requests to these endpoints.

### 1.3 Sensitive Password Exposure in User Listing API
* **Location:** `backend/routes/adminroute.js` (`/users` endpoint)
* **Severity:** Critical
* **Description:** `User.find({})` returns user objects including hashed password strings to the client without stripping the `password` field.
* **Impact:** Exposes user password hashes to anyone calling the `/users` API endpoint.

### 1.4 Admin Session Overwrite when Creating Users
* **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
* **Severity:** High
* **Description:** When an admin creates a user via `/api/admin/createuser`, the route generates a new JWT token for the newly created user and sets it as the `jwt` HTTP-only cookie.
* **Impact:** Overwrites the administrator's authentication cookie, effectively logging out the admin and authenticating them as the newly created user.

### 1.5 Missing File Upload Handling & Validation
* **Location:** `backend/routes/routes.js` (`/profile-upload-single` endpoint)
* **Severity:** Medium
* **Description:** Accessing `req.file.filename` assumes `req.file` is always defined. If a request is submitted without a file attached, `req.file` is undefined, throwing an unhandled exception.
* **Impact:** Application crash or unhandled server error when uploading files without attached media.

---

## 2. Backend Schema & Logic Bugs

### 2.1 Inconsistent `is_admin` Field Schema Definition
* **Location:** `backend/models/user.js`
* **Severity:** Medium
* **Description:** The `is_admin` property in the User schema is defined with `type: String`, but defaults to boolean `false`. Queries like `User.findOne({ email, is_admin: true })` check against boolean values.
* **Impact:** Schema type mismatch leads to inconsistent querying and potential unexpected boolean casting behavior.

### 2.2 Hardcoded Database Connection String
* **Location:** `backend/index.js`
* **Severity:** Low
* **Description:** Connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of using environment variables.
* **Impact:** Reduced portability across development, testing, and production environments.

### 2.3 Poor Error Handling and Exception Suppression
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Severity:** Medium
* **Description:** Multiple empty `catch (error) {}` blocks exist across routes (e.g., `/profile-upload-single`, `/logout`, `/deleteUser/:id`). Errors fail silently without sending appropriate HTTP response status codes back to clients.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1 Incorrect HTTP POST Options Parameter Passing
* **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Severity:** High
* **Description:** `HttpClient.post(url, options)` passes `{ withCredentials: true }` as the second argument (the request payload) instead of passing `(url, body, options)`.
* **Impact:** Requests fail to send required payload/options correctly or fail on server validation.

### 3.2 Non-Functional User Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
* **Severity:** Low
* **Description:** The search input in the Admin User List template is a static HTML element without Angular two-way binding (`[(ngModel)]`) or search filtering logic in the component / NgRx state store.

### 3.3 Misspelled Directory Name
* **Location:** `frondend/`
* **Severity:** Low
* **Description:** The frontend folder is misspelled as `frondend` instead of `frontend`.

### 3.4 Missing Spec Test Mock Dependencies
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Severity:** Medium
* **Description:** Unit tests fail due to missing providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in test suite TestBed setup.
