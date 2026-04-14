# Bug Report

This document outlines the identified security vulnerabilities, logic errors, and environment issues within the application.

## 1. Security Vulnerabilities

### 1.1. Password Leak in Admin API
- **Location:** `backend/routes/adminroute.js`
- **Issue:** The `/users` endpoint returns the complete user objects from the database, including hashed passwords. The code to exclude the password is currently commented out.
- **Impact:** Administrative users (or anyone with access to this endpoint) can see hashed passwords of all users.

### 1.2. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, `backend/.env`
- **Issue:** The JWT secret is hardcoded as `"secret"` across multiple files.
- **Impact:** Easily guessable or discoverable secrets compromise the security of the entire authentication system.

### 1.3. Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have adequate authentication or authorization middleware.
- **Impact:** Unauthorized users may be able to perform administrative actions if they know the endpoint URLs.

## 2. Logic Errors

### 2.1. Admin Session Overwrite during User Creation
- **Location:** `backend/routes/adminroute.js`
- **Issue:** The `/createuser` endpoint issues a new JWT cookie for the newly created user.
- **Impact:** When an administrator creates a new user, their own session cookie is overwritten by the new user's token, effectively logging the admin out and into the new user's account.

### 2.2. Broken Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
- **Issue:** The search input in the user list template is not bound to any property or logic in the component class.
- **Impact:** The search bar is purely cosmetic and does not filter the user list.

### 2.3. Incorrect `HttpClient.post` Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (method `deleteUser`) and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (method `getusers`)
- **Issue:** The `withCredentials: true` option is passed as the second argument to `this.http.post()`. In Angular's `HttpClient`, the second argument is the request body, and the third argument is the options object.
- **Impact:** The request body is incorrectly set to `{"withCredentials": true}`, and the actual options (like credentials) are not applied.

### 2.4. Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** This lead to confusing behavior and potential issues when querying or updating the `is_admin` status.

## 3. Environment and Configuration Issues

### 3.1. Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Inconsistent naming convention and potential confusion for developers.

### 3.2. Missing Backend Start Script
- **Location:** `backend/package.json`
- **Issue:** There is no `"start"` script defined in `package.json`.
- **Impact:** Standard commands like `npm start` will fail in the backend directory.

## 4. Test Failures

### 4.1. Angular Unit Test Failures
- **Location:** `frondend/jwtapp/`
- **Issue:** Running `ng test` results in 12 failures out of 14 tests.
- **Primary Cause:** Most failures are `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` or a manual provider for `HttpClient` is missing in the test configurations.
