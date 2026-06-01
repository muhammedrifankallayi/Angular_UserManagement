# Bug Report

This document outlines the bugs and security vulnerabilities identified in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Description:** The JWT secret key is hardcoded as `"secret"` in both `backend/routes/routes.js` and `backend/routes/adminroute.js`.
- **Impact:** Compromises the security of authentication tokens. An attacker can easily forge valid JWTs.
- **Recommended Fix:** Use environment variables (e.g., `process.env.JWT_SECRET`) and ensure the secret is unique and strong.

### 1.2 Missing Authentication and Authorization on Admin Routes
- **Description:** Several routes in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is authenticated and has administrative privileges.
- **Impact:** Unauthorized users can list, create, edit, or delete users.
- **Recommended Fix:** Implement and apply `verifyToken` and `isAdmin` middleware to all administrative routes.

### 1.3 Sensitive Data Exposure
- **Description:** The `/api/admin/users` route returns all user data, including hashed passwords.
- **Impact:** Exposes password hashes to anyone who can access the admin user list.
- **Recommended Fix:** Exclude the `password` field from the database query or manually remove it before sending the response.

### 1.4 Insecure File Uploads
- **Description:** Files are uploaded to `./file` without validation of file types or sizes.
- **Impact:** Potential for Remote Code Execution (RCE) if an attacker uploads a malicious script.
- **Recommended Fix:** Implement file type validation and use a more secure storage solution.

## 2. Logic and Schema Issues

### 2.1 Inconsistent `is_admin` Type
- **Description:** In `backend/models/user.js`, `is_admin` is defined as `String`, but its default value is `false` (Boolean).
- **Impact:** Can lead to unexpected behavior during truthiness checks or comparisons.
- **Recommended Fix:** Change the type to `Boolean`.

## 3. Code Quality and Maintenance

### 3.1 Misspelled Frontend Directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusing for developers and can lead to pathing errors.
- **Recommended Fix:** Rename `frondend` to `frontend` and update all relevant paths.

### 3.2 Poor Error Handling
- **Description:** Many backend routes have empty `catch` blocks or only use `console.log` for error reporting.
- **Impact:** Makes debugging difficult and can leave the application in an inconsistent state or return cryptic errors to the user.
- **Recommended Fix:** Implement consistent error handling and return appropriate HTTP status codes and messages.

## 4. Test Failures

### 4.1 Frontend Unit Test Failures
- **Description:** 12 out of 14 Angular unit tests are failing. Most failures are `NullInjectorError: No provider for HttpClient!`.
- **Impact:** The application's stability cannot be verified through automated tests.
- **Recommended Fix:** Update the component spec files to include `HttpClientTestingModule` and other necessary dependencies.
