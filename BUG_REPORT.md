# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Description:** The JWT signing and verification process uses a hardcoded string `"secret"` instead of the environment variable `jwtsecret` defined in `backend/.env`.
- **Impact:** Compromises the security of authentication tokens if the source code is exposed.

### 2. Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative routes (e.g., `/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/editUser`) lack middleware to verify the JWT token and ensure the user has administrative privileges.
- **Impact:** Unauthenticated users can potentially perform administrative actions.

### 3. Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` -> `/api/admin/users`
- **Description:** The endpoint returns the entire user object, including hashed passwords, to the client.
- **Impact:** Exposure of hashed passwords increases the risk of brute-force attacks if the data is intercepted or accessed by unauthorized parties.

### 4. Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` -> `/api/admin/createuser`
- **Description:** When an administrator creates a new user, the backend generates a JWT for the new user and sets it in the `jwt` cookie, effectively logging out the administrator and logging them in as the new user.
- **Impact:** Disrupts administrative workflow and is a logic error in session management.

### 5. Insecure CORS Configuration and Missing CSRF Protection
- **Location:** `backend/index.js`
- **Description:** CORS is configured to allow credentials from `http://localhost:4200`, but there is no CSRF protection (e.g., csurf middleware) implemented.
- **Impact:** Increases vulnerability to Cross-Site Request Forgery attacks.

## Logic Errors

### 1. Incorrect HttpClient usage in Angular
- **Location:** `frondend/jwtapp/src/app/components/` (AdminUserlistComponent, AdminUsereditComponent, AdminCreateuserComponent)
- **Description:** `withCredentials: true` is incorrectly passed as the second argument (request body) in `http.post` calls instead of the third argument (options object).
- **Impact:** Authentication cookies are not sent with these POST requests, leading to authentication failures on the backend.

### 2. Missing Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Description:** The HTML template contains a search input, but the component lacks the corresponding `onSearch` method or any logic to filter the user list.
- **Impact:** The search feature is non-functional.

### 3. Misspelled Frontend Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Minor inconsistency, but can lead to confusion and pathing errors.

### 4. Incorrect Data Type for `is_admin`
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as `String` but is assigned a boolean default value (`false`) and used in logical comparisons.
- **Impact:** Potential for type-related bugs and inconsistent data storage.

## Test Failures

### 1. Frontend Unit Test Failures
- **Location:** `frondend/jwtapp/`
- **Description:** 12 out of 14 unit tests are failing, primarily due to `NullInjectorError` for `HttpClient` and missing Store/Router dependencies in the test environment.
- **Impact:** Lack of reliable automated verification for frontend changes.

### 2. Missing Backend Tests
- **Location:** `backend/`
- **Description:** No tests are defined in the backend `package.json` or present in the directory.
- **Impact:** No automated way to verify backend logic or prevent regressions.
