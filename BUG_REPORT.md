# Bug Report - JWT Authentication Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue**: The JWT secret is hardcoded as `"secret"` in multiple places, even though it is defined in the `.env` file.
- **Impact**: Compromises the security of the tokens if the source code is exposed.

### 1.2 Missing Middleware on Admin Routes
- **Location**: `backend/routes/adminroute.js`
- **Issue**: Admin routes such as `/users`, `/deleteUser/:id`, and `/editUser` do not use any authentication or authorization middleware.
- **Impact**: Any user can potentially perform administrative actions.

### 1.3 Sensitive Information Exposure
- **Location**: `backend/routes/adminroute.js` (e.g., `/users` endpoint)
- **Issue**: The `/users` endpoint returns the full user objects from the database, including hashed passwords.
- **Impact**: Exposing hashed passwords is a security risk and unnecessary for the frontend.

### 1.4 Hardcoded Database Connection String
- **Location**: `backend/index.js`
- **Issue**: The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact**: Difficult to manage across different environments.

## 2. Logic Errors & Bugs

### 2.1 Incorrect Angular HttpClient Usage
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (and others)
- **Issue**: `this.http.post(url, options)` is used instead of `this.http.post(url, body, options)`.
- **Impact**: `withCredentials: true` is being passed as the body, not the options, causing requests to lack credentials.

### 2.2 Schema Type Mismatch
- **Location**: `backend/models/user.js`
- **Issue**: The `is_admin` field is defined as `type: String` but has a default value of `false` (boolean).
- **Impact**: Inconsistency in data types within the database.

### 2.3 Empty/Inadequate Error Handling
- **Location**: `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue**: Many `catch` blocks are empty or only contain `console.log`.
- **Impact**: Backend failures are silenced, and the frontend may not receive appropriate error responses.

## 3. Incomplete Features

### 3.1 Search Bar Placeholder
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue**: The search input field in the UI is not functional.
- **Impact**: Misleading UI for the end-user.

## 4. Maintenance & Quality Issues

### 4.1 Misspelled Directory Name
- **Location**: Root directory
- **Issue**: The frontend directory is named `frondend`.
- **Impact**: Professionalism and potential confusion.

### 4.2 Use of `any` Type
- **Location**: Frontend components
- **Issue**: Widespread use of the `any` type in TypeScript files.
- **Impact**: Loss of type safety benefits.

## 5. Test Failures

### 5.1 Failing Frontend Unit Tests
- **Status**: 12 out of 14 tests failing.
- **Cause**: Missing providers (HttpClient, Router, Store) in test spec files.
- **Impact**: Unreliable test suite.
