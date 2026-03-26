# BUG REPORT

## Security Vulnerabilities

### 1. Password Leak in Admin User List
- **Location:** `backend/routes/adminroute.js`
- **Endpoint:** `GET /api/admin/users`
- **Issue:** The logic to exclude passwords from the user list is commented out. As a result, the API returns the entire user object, including hashed passwords, to the frontend.
- **Impact:** Exposed hashed passwords could be vulnerable to offline cracking if the endpoint is accessed by an attacker.

### 2. Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Issue:** Both files use the hardcoded string `"secret"` as the JWT secret key for signing and verifying tokens.
- **Impact:** Attackers who know the hardcoded secret can forge valid JWTs, potentially gaining unauthorized access to the system.

### 3. Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware. The `backend/middleware/auth.js` file is completely missing.
- **Impact:** Any user, or even an unauthenticated attacker, could potentially access administrative functions if they know the endpoint URLs.

### 4. Session Overwrite in User Creation
- **Location:** `backend/routes/adminroute.js`
- **Endpoint:** `POST /createuser`
- **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the *created user*, overwriting the administrator's existing session cookie.
- **Impact:** The administrator is effectively logged out and logged in as the newly created user after performing the action.

---

## Logic Errors

### 1. Broken Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input in the admin user list template is a static HTML element that is not bound to any component logic or data filtering mechanism.
- **Impact:** Users cannot filter the user list using the search bar.

### 2. Incorrect HttpClient.post Usage
- **Location:** `AdminUserlistComponent` and `AdminUsereditComponent` in the frontend.
- **Issue:** `HttpClient.post` calls incorrectly pass `withCredentials: true` as the second argument (the body) instead of the third argument (the options).
- **Impact:** Authentication cookies may not be sent with these POST requests, leading to potential authorization failures.

### 3. Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** Inconsistent data types can lead to unexpected behavior during database queries or logical checks.

---

## Infrastructure and Test Issues

### 1. Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** This inconsistency can cause confusion and may lead to broken paths in scripts or documentation.

### 2. Missing Backend Start Script
- **Location:** `backend/package.json`
- **Issue:** The `scripts` section lacks a `start` script to launch the server.
- **Impact:** Users must manually run `node index.js` instead of using the standard `npm start` command.

### 3. Widespread Angular Test Failures
- **Location:** `frondend/jwtapp/`
- **Issue:** 12 out of 14 unit tests fail, primarily due to `NullInjectorError: No provider for HttpClient!`.
- **Impact:** The test suite is currently unreliable for verifying code changes and preventing regressions.
