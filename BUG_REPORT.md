# Comprehensive Bug Report

## Executive Summary
This document provides a comprehensive report on security vulnerabilities, logic bugs, test failures, and structural issues identified across the application's Node.js/Express backend and Angular frontend.

---

## 1. Security Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication and authorization checks. Any unauthenticated user or guest can make direct requests to perform administrative actions.

### 1.2 Sensitive Password Exposure in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /users`)
* **Description:** The `/users` endpoint returns raw user objects from MongoDB without excluding or sanitizing the `password` field (hashed passwords), exposing sensitive credentials in response payloads.

### 1.3 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** JWT signing and verification calls hardcode the string `'secret'` directly in code (e.g., `jwt.sign(..., "secret")`) instead of loading `process.env.jwtsecret` defined in `backend/.env`.

### 1.4 Missing CSRF Protection & Permissive CORS Configuration
* **Location:** `backend/index.js`
* **Description:** The backend enables CORS credentials for `http://localhost:4200` and relies on `httpOnly` cookies without CSRF protection tokens or anti-CSRF headers, leaving cookie-authenticated routes vulnerable to CSRF attacks.

---

## 2. Backend Logic and Data Model Errors

### 2.1 Mongoose User Schema `is_admin` Field Type Inconsistency
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field is defined with type `String` but initialized with default value `false` (boolean). When querying `findOne({ email, is_admin: true })`, type coercion issues can occur depending on stored values.

### 2.2 Unhandled Missing File in Profile Upload Route
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
* **Description:** The route directly accesses `req.file.filename` without checking if `req.file` exists. If a request is submitted without a file attached, an unhandled `TypeError` is thrown.

### 2.3 Admin User Creation Overwrites Admin Session Cookie
* **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
* **Description:** Upon creating a new user, the admin route signs a new JWT token for the newly created user and attaches it to the response cookies (`res.cookie("jwt", token)`), overwriting the administrator's own session cookie.

### 2.4 Silent Failure and Missing Client Responses in Catch Blocks
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Description:** Multiple route handlers contain empty or logging-only `catch` blocks (e.g. `adminrouter.post('/deleteUser/:id')`), which results in requests hanging indefinitely or failing silently without responding with appropriate HTTP error status codes.

---

## 3. Frontend Bugs and Unit Test Failures

### 3.1 Incorrect `HttpClient.post` Options Parameter Usage
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
* **Description:** Calls to `http.post` pass options objects (`{ withCredentials: true }`) as the second argument (the request body) rather than the third argument, sending `{ withCredentials: true }` as the request body payload.

### 3.2 Non-Functional UI Components
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:** The search input element in the admin user list view is static HTML and is not bound to component state, NgRx selectors, or filtering logic.

### 3.3 Angular Spec Unit Test Failures
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:** Unit tests fail across multiple components due to missing providers in `TestBed` setups (e.g., `NullInjectorError: No provider for HttpClient!`, missing `RouterTestingModule`, and missing NgRx mock store setups).

---

## 4. Repository & Structure Issues

### 4.1 Frontend Directory Misspelling
* **Location:** Root repository directory (`frondend/`)
* **Description:** The frontend application directory is misspelled as `frondend` instead of `frontend`.
