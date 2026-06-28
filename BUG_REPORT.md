# Bug Report

This document outlines the security vulnerabilities, logic errors, and architectural issues identified in the JWT project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
The JWT signing and verification secret is hardcoded as `"secret"` in:
- `backend/routes/routes.js`
- `backend/routes/adminroute.js`
- `backend/.env` (though present, it is not consistently used via `process.env`)

### 1.2 Missing Authentication/Authorization Middleware
Administrative routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not have centralized middleware to verify if the requester is an authenticated administrator. Some routes manually check the cookie, but others do not.

### 1.3 Exposure of Sensitive Data
The `/api/admin/users` endpoint returns the entire user document from MongoDB, including the hashed `password` field, exposing it to the frontend.

### 1.4 Type Inconsistency for `is_admin`
In `backend/models/user.js`, the `is_admin` field is defined as a `String` but has a default value of `false` (boolean). It is also queried as a boolean in `adminroute.js`.

### 1.5 Missing CSRF Protection
The application uses cookies for authentication but lacks CSRF protection, making it vulnerable to Cross-Site Request Forgery attacks.

---

## 2. Logic Errors

### 2.1 Admin Session Overwritten on User Creation
In `backend/routes/adminroute.js`, the `/createuser` endpoint generates a new JWT for the newly created user and sets it in the `jwt` cookie. This overwrites the administrator's own session cookie, effectively logging them out after creating a user.

### 2.2 Unsafe File Upload
In `backend/routes/routes.js`, the `/profile-upload-single` route attempts to access `req.file.filename` without checking if `req.file` exists, which will cause the server to crash if no file is uploaded.

### 2.3 Poor Error Handling
Many routes in the backend have empty `catch` blocks or only `console.log` the error without sending an appropriate error response to the client, leading to hung requests or silent failures.

---

## 3. Frontend Issues

### 3.1 Incorrect HttpClient usage
In `AdminUserlistComponent.deleteUser` and `AdminUsereditComponent.getusers`, the `http.post` call passes the options object (containing `withCredentials`) as the second argument (the body), which is incorrect for POST requests.

### 3.2 Non-functional Search
The search input in `AdminUserlistComponent` is a static HTML element with no implementation in the component logic or state management.

### 3.3 Failing Unit Tests
The majority of frontend unit tests are failing due to `NullInjectorError` (missing `HttpClient`, `Router`, or `Store` providers).

### 3.4 Misspelled Directory
The frontend directory is misspelled as `frondend` in the repository root.

---

## 4. Infrastructure

### 4.1 Hardcoded Database Connection
The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded in `backend/index.js` instead of being configurable via environment variables.
