# Bug Report

## Overview
This report documents several security vulnerabilities, logic errors, and UI inconsistencies found in the JWT Project.

## Component: Backend

### 1. Hardcoded JWT Secret
- **File**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Severity**: Critical
- **Description**: The JWT signing and verification process uses a hardcoded string `"secret"` instead of the `jwtsecret` environment variable defined in the `.env` file. This compromises the security of the tokens.

### 2. Lack of Authentication and Authorization on Admin Routes
- **File**: `backend/routes/adminroute.js`
- **Severity**: Critical
- **Description**: Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/createuser`) do not have any middleware to verify the user's token or check if they have admin privileges. This allows unauthorized access to sensitive administrative functions.

### 3. Exposure of Sensitive Information
- **File**: `backend/routes/adminroute.js` (Endpoint: `/users`)
- **Severity**: High
- **Description**: The `/api/admin/users` route returns the entire user object from the database, including hashed passwords, which should never be exposed to the frontend.

### 4. Inconsistent Data Type for `is_admin`
- **File**: `backend/models/user.js`
- **Severity**: Low
- **Description**: The `is_admin` field is defined as a `String` in the Mongoose schema, but it has a boolean default value (`false`). It should consistently be a `Boolean`.

### 5. Poor Error Handling
- **File**: Multiple files in `backend/routes/`
- **Severity**: Moderate
- **Description**: Many route handlers use empty `catch` blocks or only `console.log` for error reporting, which can lead to silenced failures and make debugging difficult.

## Component: Frontend

### 1. Misspelled Frontend Directory
- **Location**: Root directory
- **Severity**: Low
- **Description**: The frontend directory is named `frondend/` instead of `frontend/`.

### 2. Incorrect Usage of `HttpClient.post`
- **File**: Multiple components in `frondend/jwtapp/src/app/components/`
- **Severity**: High
- **Description**: The `HttpClient.post` method is called with the request options (like `{ withCredentials: true }`) as the second argument (the `body`) instead of the third argument. This will cause requests to fail as the server will not receive the expected body data and credentials will not be sent correctly.

### 3. Unimplemented Search Bar Logic
- **File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
- **Severity**: Moderate
- **Description**: A search input is present in the admin user list UI, but there is no corresponding logic in the component to handle search filtering.

## Test Results
*(To be updated after running frontend tests)*

## Test Execution Results (Frontend)

- **Date**: Mon Jun  8 15:53:07 UTC 2026
- **Total Tests**: 14
- **Passed**: 2
- **Failed**: 12
- **Success Rate**: 14.3%

### Major Test Failures
1. **Missing Dependency Injection Providers**: 11 components failed with `NullInjectorError: No provider for HttpClient!`. This indicates that `HttpClientTestingModule` or a mock provider for `HttpClient` is missing in the test configuration (`spec.ts` files).
2. **AppComponent Rendering Failure**: `AppComponent should render title` failed. Expected undefined to contain 'jwtapp app is running!'.

### Recommendations
- Update component spec files to include necessary providers and modules (`HttpClientTestingModule`, `RouterTestingModule`, etc.).
- Fix the `AppComponent` test case or the component template to match expectations.
