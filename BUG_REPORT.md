# Comprehensive Bug Report

## Overview
This document details identified security vulnerabilities, logical bugs, schema inconsistencies, error handling flaws, and test setup issues across the backend and frontend components of the application.

---

## 1. Backend Security Vulnerabilities & Misconfigurations

### 1.1 Hardcoded JWT Secret Key
- **File:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** JWT signing and verification calls use the hardcoded string `"secret"` rather than reading `process.env.jwtsecret` from the configuration environment.
- **Impact:** Compromises security by hardcoding sensitive signing keys in source code.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **File:** `backend/routes/adminroute.js`
- **Issue:** Administrative endpoints including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack JWT authentication check and admin role validation.
- **Impact:** Unauthenticated users can view, edit, create, or delete user records.

### 1.3 Sensitive Data Exposure (Password Hashes in API Responses)
- **File:** `backend/routes/adminroute.js` (`/users` route)
- **Issue:** `adminrouter.get('/users')` returns raw user records directly from Mongoose (`res.send(user)`), exposing user password hashes.
- **Impact:** Exposes password hashes over the API.

### 1.4 Hardcoded Database Connection String
- **File:** `backend/index.js`
- **Issue:** MongoDB connection URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact:** Prevents dynamic configuration across different deployment environments.

---

## 2. Backend Logic Errors & Schema Flaws

### 2.1 Admin User Creation Session Hijacking / Cookie Overwrite
- **File:** `backend/routes/adminroute.js` (`/createuser` route)
- **Issue:** Upon creating a new user, `adminrouter.post('/createuser')` issues a new JWT cookie (`res.cookie("jwt", token)`) for the created user ID instead of retaining the active admin session.
- **Impact:** Admin user is automatically logged out and replaced by the newly created user session.

### 2.2 Schema Type Inconsistency (`is_admin`)
- **File:** `backend/models/user.js` vs `backend/routes/adminroute.js`
- **Issue:** Schema defines `is_admin` with type `String` and default `false` (boolean). `adminroute.js` queries `{ is_admin: true }`.
- **Impact:** Type mismatch causes queries to fail or return unexpected results.

### 2.3 Unhandled File Upload Exceptions & Empty Catch Blocks
- **File:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:**
  - In `/profile-upload-single`, `req.file.filename` is accessed without verifying if `req.file` exists.
  - Several routes have empty `catch (error) {}` blocks or only `console.log` error messages without returning an HTTP error status.
- **Impact:** Server crashes or client requests hang indefinitely on runtime errors.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1 Misspelled Frontend Directory Name
- **File System:** Root folder `frondend/`
- **Issue:** The directory is named `frondend` instead of `frontend`.

### 3.2 Incorrect `HttpClient.post` Argument Placement
- **File:** `AdminUserlistComponent`, `AdminUsereditComponent`
- **Issue:** Options such as `{ withCredentials: true }` are passed as the 2nd argument (request body) instead of the 3rd argument.
- **Impact:** Request bodies are sent incorrectly or HTTP options are ignored.

### 3.3 Non-Functional UI Components (Search Bar)
- **File:** Frontend `AdminUserlistComponent`
- **Issue:** Search input element exists in template HTML but lacks dynamic data binding and filtering logic.

---

## 4. Test Suite Failures

### 4.1 Missing Providers in Angular Unit Tests
- **File:** `frondend/jwtapp/src/app/**/*.spec.ts`
- **Issue:** Component specs lack test providers for `HttpClient`, `Router`, and NgRx store (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Impact:** Unit test suite fails with `NullInjectorError` across multiple test files.
