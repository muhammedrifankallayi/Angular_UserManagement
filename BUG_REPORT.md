# Comprehensive Bug Report

This document details identified security vulnerabilities, backend logic/error-handling flaws, and frontend issues across the application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** The application signs and verifies JWT tokens using a hardcoded string `"secret"` instead of reading from `process.env.jwtsecret` configured in `.env`.
* **Impact:** Anyone with access to the source code can forge valid JWT tokens and bypass authentication.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js` (Endpoints: `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
* **Description:** Administrative endpoints lack verification middleware to ensure the requester is authenticated and has administrative privileges (`is_admin: true`).
* **Impact:** Unauthenticated or non-admin users can view user lists, edit details, create users, or delete accounts.

### 1.3 Exposure of Sensitive Password Hashes in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Description:** The `/users` endpoint fetches all user documents (`User.find({})`) and returns them directly without stripping out the `password` property.
* **Impact:** Exposes user password hashes to anyone calling the endpoint.

### 1.4 Admin Cookie Overwrite on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Description:** When an admin creates a new user, the backend signs a JWT for the newly created user and sets it as the `jwt` cookie in the response.
* **Impact:** Overwrites the administrator's session cookie with the newly created user's token, logging out the admin.

---

## 2. Backend Logic & Error Handling Issues

### 2.1 Mongoose Schema Type Mismatch (`is_admin`)
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field is defined with `type: String` but defaults to boolean `false` (`default: false`). In `adminroute.js`, queries search for `{ is_admin: true }`.
* **Impact:** Type inconsistency across queries and user document instances can lead to unexpected query behavior.

### 2.2 Unchecked `req.file` Access in File Upload Endpoint
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description:** The route accesses `req.file.filename` directly without verifying whether `req.file` exists.
* **Impact:** If a request is sent without an attached file, a TypeError (`Cannot read property 'filename' of undefined`) is thrown.

### 2.3 Empty Catch Blocks & Suppressed Exceptions
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Description:** Several endpoints (e.g., `/profile-upload-single`, `/logout`, `/deleteUser/:id`) have empty or unhandled `catch` blocks.
* **Impact:** Errors cause request timeouts/hanging responses for clients without appropriate HTTP status codes or error messages.

### 2.4 Hardcoded MongoDB Connection URI
* **Location:** `backend/index.js`
* **Description:** Database connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of loaded from environment variables.

---

## 3. Frontend Bugs & Testing Issues

### 3.1 Directory Naming Typo
* **Location:** Repository Root
* **Description:** The Angular frontend root directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The user search input element is static HTML and lacks component bindings or state selector integration.

### 3.3 Incorrect `HttpClient.post` Parameter Ordering
* **Location:** `AdminUserlistComponent` / `AdminUsereditComponent`
* **Description:** `HttpClient.post` calls pass options objects as the second argument (payload body) instead of the third argument.

### 3.4 Unit Test Setup Failures
* **Location:** Frontend component spec files (`frondend/jwtapp/src/app/components/**/*.spec.ts`)
* **Description:** Multiple Angular component unit tests fail with `NullInjectorError` due to missing providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
