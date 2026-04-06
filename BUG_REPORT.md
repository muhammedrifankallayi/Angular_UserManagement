# Bug Report

This document outlines the identified bugs, security vulnerabilities, and logic errors found in the project.

## Environment and Configuration Issues

### 1. Misspelled Frontend Directory
- **Location**: Root directory
- **Description**: The frontend directory is named `frondend` instead of `frontend`.
- **Impact**: This leads to confusion and potential errors in deployment scripts or developer workflows.

### 2. Missing Backend Start Script
- **Location**: `backend/package.json`
- **Description**: The `scripts` section is missing a `start` script to run the application.
- **Impact**: Developers must manually run `node index.js` or `node backend/index.js`, which is non-standard.

---

## Security Vulnerabilities

### 3. Password Leak in Admin Users Endpoint
- **Location**: `backend/routes/adminroute.js` (GET `/users`)
- **Description**: The endpoint returns all user documents from the database without excluding the `password` field.
- **Impact**: Hashed passwords are exposed to anyone who can access the admin API.

### 4. Hardcoded JWT Secret
- **Location**: `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Description**: The JWT signing and verification processes use a hardcoded secret string `"secret"`.
- **Impact**: The security of the authentication system is compromised if the source code is leaked.

### 5. Unprotected Administrative Routes
- **Location**: `backend/routes/adminroute.js`
- **Description**: Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack proper authentication and authorization checks.
- **Impact**: Any user or unauthenticated entity could potentially perform administrative actions.

### 6. Admin Session Overwrite on User Creation
- **Location**: `backend/routes/adminroute.js` (POST `/createuser`)
- **Description**: After creating a new user, the endpoint issues a new JWT for the *newly created user* and sets it in the `jwt` cookie.
- **Impact**: This overwrites the administrator's session cookie, logging them out of their administrative session and potentially into the new user's session.

---

## Logic Errors

### 7. Incorrect `HttpClient.post` Usage in Angular
- **Location**: `AdminUserlistComponent` and `AdminUsereditComponent`
- **Description**: The `http.post` calls incorrectly pass the options object (containing `withCredentials: true`) as the second argument (request body) instead of the third.
- **Impact**: Since `withCredentials` is not correctly set, authentication cookies are not sent with these requests, leading to `401 Unauthenticated` errors if authentication were enforced.

### 8. Broken Search Functionality
- **Location**: `AdminUserlistComponent` (`admin-userlist.component.html`)
- **Description**: The search input field in the template is not bound to any property or event in the component logic.
- **Impact**: Users cannot filter the user list using the search bar.

### 9. Type Inconsistency for `is_admin`
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean).
- **Impact**: This causes data type inconsistency in the database and may lead to unexpected behavior during queries or updates.

---

## Testing Failures

### 10. Failing Angular Unit Tests
- **Location**: `frondend/jwtapp/src/app/*.spec.ts`
- **Description**: 12 out of 14 unit tests fail with `NullInjectorError`.
- **Impact**: The codebase lacks a reliable test suite to verify changes and prevent regressions. These tests require proper `TestBed` configuration with necessary providers (`HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, and `provideMockStore`).
