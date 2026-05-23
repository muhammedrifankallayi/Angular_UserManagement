# Bug Report - JWT App

This report documents the security vulnerabilities, logic errors, and implementation issues identified in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT signing and verification processes use a hardcoded string `"secret"` instead of the environment variable defined in `.env`.
- **Impact:** Compromises the security of the tokens if the source code is exposed.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Sensitive administrative endpoints such as `/users`, `/deleteUser/:id`, `/editUser`, and `/createuser` lack middleware to verify the user's JWT or check for administrative privileges.
- **Impact:** Any user (or even unauthenticated visitors) can perform administrative actions if they know the endpoint.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (specifically the `/users` endpoint)
- **Issue:** The `/users` endpoint returns the full user objects from the database, including hashed passwords.
- **Impact:** Increases the risk of password cracking if the data is intercepted or accessed by unauthorized parties.

### 1.4 Admin Session Hijacking/Overwriting
- **Location:** `backend/routes/adminroute.js` (specifically the `/createuser` endpoint)
- **Issue:** When an admin creates a new user, the server issues a new JWT cookie for the *newly created user*, overwriting the admin's own session cookie.
- **Impact:** The administrator is effectively logged out and logged in as the new user after creating them.

### 1.5 Missing CSRF Protection
- **Location:** `backend/index.js` (CORS configuration)
- **Issue:** The application uses `credentials: true` with CORS and relies on cookies for authentication, but it does not implement any Anti-CSRF measures (like CSRF tokens).
- **Impact:** Vulnerable to Cross-Site Request Forgery attacks.

## 2. Logic and Implementation Errors

### 2.1 Inconsistent User Model
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a default value of `false` (Boolean).
- **Impact:** Potential type-related bugs during database queries or data manipulation.

### 2.2 Poor Error Handling
- **Location:** Throughout `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Issue:** Many `catch` blocks are empty or only contain `console.log(error.message)`.
- **Impact:** The client is left hanging without a response on failure, and server-side errors are difficult to debug.

### 2.3 Incorrect HttpClient Usage (Frontend)
- **Location:** `frondend/jwtapp/src/app/components/` (various components)
- **Issue:** In several components (e.g., `AdminUserlistComponent`, `AdminUsereditComponent`, `AdminCreateuserComponent`), the `withCredentials: true` option is passed as the *second* argument to `this.http.post()`. For POST requests, the second argument is the request body; options should be the *third* argument.
- **Impact:** Authentication cookies are not sent with these POST requests, leading to "unauthenticated" errors from the backend.

## 3. General Issues

### 3.1 Misspelled Directory Name
- **Location:** Root directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusion and potential path issues.

## 4. Test Suite Status
- **Frontend:** 12 out of 14 unit tests are failing.
  - **Main Reason:** `NullInjectorError: No provider for HttpClient!`. This indicates that the `HttpClientTestingModule` (or a mock provider) is missing from the `TestBed` configuration in the component spec files.
- **Backend:** No tests found in `backend/package.json`.
