# Comprehensive Bug Report

## Executive Summary
This document provides a detailed breakdown of security vulnerabilities, backend logic errors, frontend bugs, and architecture/configuration issues identified in the codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Issue:** The string `"secret"` is hardcoded directly into JWT signing (`jwt.sign`) and verification (`jwt.verify`) calls instead of utilizing `process.env.jwtsecret` defined in `backend/.env`.
* **Impact:** High risk of secret leakage, impossible to rotate secrets per environment, vulnerability to token forgery.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Issue:** Sensitive administrative routes (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not inspect JWT cookies or verify that the requesting user is an administrator (`is_admin: true`).
* **Impact:** Critical privilege escalation. Any unauthenticated user or external caller can view, edit, create, or delete arbitrary user accounts.

### 1.3 Sensitive Data Exposure in User Lists
* **Location:** `backend/routes/adminroute.js` (`/users` endpoint)
* **Issue:** `User.find({})` returns full user documents, including bcrypt password hashes, directly in the HTTP JSON response.
* **Impact:** Exposure of password hashes allows offline dictionary/brute-force attacks against user credentials.

### 1.4 Admin Session Overwritten Upon User Creation
* **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
* **Issue:** When an admin creates a new user, the route signs a JWT for the newly created user and sets it in the client's `jwt` cookie response header.
* **Impact:** The administrator's active session cookie is immediately overwritten by the new user's session token.

### 1.5 Missing CSRF Protection & Broad CORS Configuration
* **Location:** `backend/index.js`
* **Issue:** Cross-Site Request Forgery (CSRF) protection is absent while `withCredentials: true` is enabled on the frontend and backend.

---

## 2. Backend Logic & Schema Issues

### 2.1 Inconsistent `is_admin` Field Definition in Schema
* **Location:** `backend/models/user.js`
* **Issue:** The `is_admin` field is defined as `type: String` with `default: false` (a boolean).
* **Impact:** Type inconsistency in Mongoose queries (e.g. querying `{ is_admin: true }` vs string comparison).

### 2.2 Unchecked File Access in Profile Upload
* **Location:** `backend/routes/routes.js` (`/profile-upload-single` endpoint)
* **Issue:** `req.file.filename` is accessed directly without verifying whether `req.file` exists.
* **Impact:** If a request is made without an attached file payload, the server throws an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`.

### 2.3 Poor Error Handling and Swallowed Exceptions
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Issue:** Multiple route handlers contain empty `catch (error) {}` blocks or catch errors without returning an HTTP error status (e.g., 500 Internal Server Error) to the client.
* **Impact:** Client HTTP requests hang indefinitely when exceptions occur on the backend.

---

## 3. Frontend Issues

### 3.1 Misplaced HTTP Request Options Parameter
* **Location:** `frondend/jwtapp/src/app/components/` (`AdminUserlistComponent`, `AdminUsereditComponent`)
* **Issue:** `HttpClient.post` calls pass options objects (such as `{ withCredentials: true }`) as the second argument (request body) rather than the third argument.
* **Impact:** Request bodies are sent as options metadata instead of actual payloads, causing backend endpoints to receive empty payloads.

### 3.2 Non-Functional User Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
* **Issue:** The search input element in the template is static HTML and lacks event bindings, component properties, or NgRx selector integrations.
* **Impact:** Search feature is non-responsive to user interaction.

### 3.3 Failing Frontend Unit Test Suite
* **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
* **Issue:** Angular unit tests fail due to missing dependencies in test setup (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
* **Impact:** Automated CI/CD test execution fails.

---

## 4. Repository Structure & Naming Issues

### 4.1 Misspelled Top-Level Frontend Directory
* **Location:** `./frondend/`
* **Issue:** Top-level directory is misspelled as `frondend` instead of `frontend`.
