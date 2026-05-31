# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
The application uses the hardcoded string `"secret"` for JWT signing and verification in `backend/routes/routes.js` and `backend/routes/adminroute.js`, ignoring the `jwtsecret` defined in `backend/.env`.

### 1.2 Sensitive Data Exposure
The `/api/admin/users` and `/api/admin/editDetails/:id` endpoints return full user objects, including hashed passwords, to the client.

### 1.3 Missing Authorization Middleware
Administrative routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is authenticated and has administrative privileges.

### 1.4 Insecure CORS Configuration
While CORS is configured to allow credentials for `http://localhost:4200`, the application does not appear to have CSRF protection, which is critical when using cookies for authentication.

## 2. Logic and Functional Issues

### 2.1 Admin Session Overwrite
In `backend/routes/adminroute.js`, the `/createuser` endpoint generates a new JWT for the newly created user and sets it in the `jwt` cookie. This overwrites the administrator's session cookie, effectively logging them out and logging them in as the new user.

### 2.2 Incorrect HttpClient Usage
In the frontend (`AdminUserlistComponent` and `AdminUsereditComponent`), `HttpClient.post` calls incorrectly pass `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (the options object).

### 2.3 Missing Search Functionality
The search input in `AdminUserlistComponent` is present in the HTML but is not functional, as the `onSearch` method and corresponding logic are missing.

### 2.4 Incorrect Schema Type
The `is_admin` field in `backend/models/user.js` is defined as a `String` but has a `Boolean` default value (`false`).

## 3. Structural and Maintenance Issues

### 3.1 Misspelled Directory
The frontend directory is misspelled as `frondend`.

### 3.2 Poor Error Handling
Backend route handlers frequently use empty catch blocks or only `console.log`, which can lead to silenced failures and difficult debugging.

## 4. Testing Failures

### 4.1 Frontend Unit Tests
Most frontend unit tests (12 of 14) are failing, primarily due to `NullInjectorError` because `HttpClient`, `Router`, and `@ngrx/store` mocks are not correctly provided in the test suites.
