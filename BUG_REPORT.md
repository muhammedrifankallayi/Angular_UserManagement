# Comprehensive Bug & Vulnerability Report

## Executive Summary
This document provides a detailed bug report for the repository, covering security vulnerabilities, backend architecture/logic issues, frontend component bugs, and unit testing failures.

---

## 1. Backend Security Vulnerabilities & Bugs (`backend/`)

### 1.1 Hardcoded JWT Secret Key
* **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Issue**: JWT signing and verification (`jwt.sign`, `jwt.verify`) use the hardcoded string `"secret"` instead of reading from `process.env.jwtsecret` (configured in `.env`).
* **Impact**: Critical security vulnerability allowing token forgery if source code is exposed.

### 1.2 Missing Authentication / Authorization Middleware on Admin Routes
* **Location**: `backend/routes/adminroute.js`
* **Issue**: Admin endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication and admin check middleware. Anyone can issue requests to these endpoints without being logged in or holding admin privileges.
* **Impact**: Unauthorized users can view, edit, create, or delete any user account.

### 1.3 Sensitive Information Exposure (Password Leak in User List)
* **Location**: `backend/routes/adminroute.js` (Endpoint: `GET /users`)
* **Issue**: The `GET /users` endpoint returns raw user documents from MongoDB (`await User.find({})`) including hashed passwords.
* **Impact**: Hashed user passwords are exposed in the JSON response payload.

### 1.4 Session Overwrite in Admin User Creation
* **Location**: `backend/routes/adminroute.js` (Endpoint: `POST /createuser`)
* **Issue**: When an admin creates a new user via `/api/admin/createuser`, the route creates a new JWT for the newly created user and sets the `jwt` cookie in the response (`res.cookie("jwt", token)`).
* **Impact**: Admin's own session cookie gets overwritten with the newly created user's identity, logging the admin out.

### 1.5 Unhandled Uncaught Exception in File Upload
* **Location**: `backend/routes/routes.js` (Endpoint: `POST /profile-upload-single`)
* **Issue**: Accesses `req.file.filename` directly without checking if `req.file` exists. If a user posts without attaching an image file, `req.file` is `undefined` causing a runtime TypeError exception.
* **Impact**: Application crashes or unhandled server error occurs when no file is uploaded.

### 1.6 Data Schema Type Mismatch (`is_admin`)
* **Location**: `backend/models/user.js`
* **Issue**: `is_admin` is declared with `type: String, default: false`. Mixing string type definition with a boolean default value leads to unpredictable Mongoose queries and type inconsistency.
* **Impact**: Mongoose queries filtering on `is_admin: true` may fail or behave inconsistently.

### 1.7 Silent Error Handling & Missing HTTP Responses
* **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Issue**: Multiple `catch` blocks in routes are empty or only call `console.log(error.message)` without returning an HTTP response to the client (e.g., `res.status(500).json(...)`).
* **Impact**: Client requests hang until timeout if an internal server error occurs.

---

## 2. Frontend Bugs & Architectural Issues (`frondend/jwtapp/`)

### 2.1 Misspelled Frontend Directory Name
* **Location**: Root directory (`frondend/`)
* **Issue**: The directory containing the Angular application is misspelled as `frondend` instead of `frontend`.
* **Impact**: Inconsistent directory naming across the project structure.

### 2.2 Incorrect HTTP Post Option Ordering in Admin Components
* **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Issue**: Calls to `HttpClient.post` pass `{ withCredentials: true }` as the second argument (request body) instead of the third argument (options): `http.post(url, body, options)`.
* **Impact**: Requests send `{ withCredentials: true }` as payload to the backend while failing to send actual credentials cookies in the request headers.

### 2.3 Non-Functional Search Input
* **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `admin-userlist.component.ts`
* **Issue**: The search input field in the admin user list component is static HTML and lacks two-way binding (`[(ngModel)]`), event listeners, or NgRx state filtering logic.
* **Impact**: Users cannot search or filter the list of users in the admin dashboard.

---

## 3. Unit Test Failures

### 3.1 Angular Component Spec Failures
* **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Issue**: 12 of 14 Angular unit tests fail due to missing dependencies in `TestBed.configureTestingModule`. Spec files miss imports for `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
* **Impact**: Automated unit test suites fail to run and verify component behavior.
