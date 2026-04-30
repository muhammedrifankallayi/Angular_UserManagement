# BUG REPORT

## Security Vulnerabilities

### 1. Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The JWT signing and verification processes use a hardcoded secret string `"secret"`.
- **Impact:** An attacker who knows this secret can forge valid JWT tokens, potentially gaining unauthorized access to any user account.
- **Suggested Fix:** Move the JWT secret to an environment variable and use `process.env.JWT_SECRET`.

### 2. Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Most administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is an authenticated administrator. While some routes check for a `jwt` cookie internally, others do not.
- **Impact:** Unauthorized users may be able to perform administrative actions, such as deleting or editing other users.
- **Suggested Fix:** Implement a robust authentication and authorization middleware and apply it to all protected routes.

### 3. Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (specifically the `/users` endpoint)
- **Description:** The `/api/admin/users` endpoint returns the entire user object, including the hashed password.
- **Impact:** Exposure of hashed passwords increases the risk of brute-force or rainbow table attacks if the hashes are leaked.
- **Suggested Fix:** Explicitly exclude the `password` field from the query results or the response object.

### 4. Session Overwrite Vulnerability
- **Location:** `backend/routes/adminroute.js` (specifically the `/createuser` endpoint)
- **Description:** When an administrator creates a new user via the `/createuser` endpoint, the server issues a new JWT token for the newly created user and sets it in the administrator's `jwt` cookie.
- **Impact:** The administrator's session is overwritten by the new user's session, effectively logging the administrator out and into the new account.
- **Suggested Fix:** Remove the logic that issues and sets a new JWT cookie upon user creation by an administrator.

## Logic and Configuration Errors

### 5. `is_admin` Field Type Mismatch
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as a `String` with a default value of `false` (a boolean).
- **Impact:** This inconsistency can lead to unexpected behavior during queries and logical checks, especially since `"false"` (string) is truthy in JavaScript.
- **Suggested Fix:** Change the type of `is_admin` to `Boolean`.

### 6. Directory Misspelling
- **Location:** Root directory
- **Description:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** This is unprofessional and can cause confusion for developers. It also requires paths in scripts and configuration files to use the incorrect spelling.
- **Suggested Fix:** Rename the directory to `frontend` and update all relevant path references.

## Test Results Summary

### Frontend Tests (frondend/jwtapp)
- **Status:** FAILED
- **Results:** 12 Failed, 2 Success
- **Key Issues:** Most failures are `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` or a similar provider is missing in the test configurations.

### Backend Tests (backend)
- **Status:** NO TESTS SPECIFIED
- **Results:** N/A
- **Key Issues:** The `npm test` script only echoes an error message.
