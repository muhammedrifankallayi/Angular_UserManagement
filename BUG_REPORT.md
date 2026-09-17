# Comprehensive Bug & Security Report

## Overview
This document details identified security vulnerabilities, backend logic errors, frontend bugs, and architectural issues across the application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Secret key `"secret"` is hardcoded directly into `jwt.sign()` and `jwt.verify()` calls instead of referencing `process.env.jwtsecret`.
* **Impact:** Insecure key management; keys can easily be leaked or exposed in source control.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
* **Location:** `backend/routes/adminroute.js`
* **Description:** Routes such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication checks and role verification (`is_admin`).
* **Impact:** Unauthenticated or non-admin users can view, edit, create, or delete user accounts via direct API calls.

### 1.3 Sensitive Password Data Exposure
* **Location:** `backend/routes/adminroute.js` (`GET /users`)
* **Description:** The `/users` endpoint returns raw Mongoose user documents without stripping out hashed `password` fields.
* **Impact:** Exposes user password hashes to client-side responses.

---

## 2. Backend Logic & Implementation Issues

### 2.1 Admin Session Hijacking / Cookie Overwriting on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
* **Description:** When an administrator creates a new user, the endpoint signs a JWT token for the newly created user ID and sets it in the `jwt` HTTP cookie on the response.
* **Impact:** Overwrites the administrator's session cookie with the new user's session, effectively logging out the administrator.

### 2.2 Missing Request Body Validation in File Uploads
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description:** Accesses `req.file.filename` directly without checking if `req.file` exists.
* **Impact:** Uploading without a file payload causes a TypeError (`Cannot read properties of undefined (reading 'filename')`).

### 2.3 Silent Exception Handling & Empty Catch Blocks
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Several endpoint catch blocks (e.g., `/profile-upload-single`, `/deleteUser/:id`, `/logout`) are empty or omit sending an error HTTP response status to the client.
* **Impact:** Errors fail silently, causing HTTP requests to hang without completing or returning informative status codes.

### 2.4 Inconsistent Mongoose Schema Definition for `is_admin`
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field type is defined as `String`, but its default value is set to boolean `false`.
* **Impact:** Data type mismatch causing inconsistent queries across backend endpoints (e.g., querying `{ is_admin: true }` vs `{ is_admin: "true" }`).

### 2.5 Hardcoded Database Connection String
* **Location:** `backend/index.js`
* **Description:** MongoDB URI (`mongodb://127.0.0.1:27017/jwtproject`) is hardcoded.
* **Impact:** Hinders deployment flexibility across different environments (staging, production).

---

## 3. Frontend Logic & UI Issues

### 3.1 Incorrect `HttpClient.post` Argument Signature
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Description:** Angular `HttpClient.post()` calls pass options (`{ withCredentials: true }`) as the second argument (body position) rather than the third argument position (`http.post(url, body, options)`).
* **Impact:** API requests send option objects as the request body and omit valid options, causing backend processing failures.

### 3.2 Non-Functional User Search Filter Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element in the admin user list view is static HTML lacking `[(ngModel)]` bindings, input event handlers, or integration with state selectors.
* **Impact:** Search bar functionality is non-operational for administrative users.

### 3.3 Failing Component Unit Tests
* **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
* **Description:** Multiple Angular component spec tests fail with `NullInjectorError` due to missing `HttpClientTestingModule`, `RouterTestingModule`, or NgRx `provideMockStore()` in test module configurations.
* **Impact:** Automated test suite fails, preventing continuous integration verification.

---

## 4. Architectural & Naming Issues

### 4.1 Misspelled Root Directory Name
* **Location:** Root directory structure
* **Description:** Frontend directory is named `frondend` instead of `frontend`.
* **Impact:** Causes developer confusion and naming inconsistency in repository structure and build scripts.
