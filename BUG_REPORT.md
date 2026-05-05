# Bug Report - JWT App

This report documents the security vulnerabilities, logic errors, and infrastructure issues identified in the JWT application.

## 1. Security Vulnerabilities

### 1.1 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/users` endpoint returns the entire user object from the database, including hashed passwords. The logic to exclude sensitive fields is currently commented out.
- **Impact:** Attackers could potentially use hashed passwords for offline brute-force attacks if they gain access to an administrative session.

### 1.2 Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** JWT signing and verification use a hardcoded secret string `"secret"`. While a `.env` file exists with `jwtsecret="secret"`, it is not being utilized in the code.
- **Impact:** Simplifies session hijacking and token forgery.

### 1.3 Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** There is no middleware to verify if the requester is an authenticated administrator before processing requests for sensitive operations (listing users, deleting users, etc.).
- **Impact:** Unauthorized users could potentially perform administrative actions.

### 1.4 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Issue:** The backend does not implement any CSRF (Cross-Site Request Forgery) protection despite using cookies for authentication.
- **Impact:** Users could be tricked into performing unintended actions on the application.

---

## 2. Logic and Functional Errors

### 2.1 Administrative Session Overwrite
- **Location:** `backend/routes/adminroute.js` (endpoint: `/createuser`)
- **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, which overwrites the administrator's own session cookie.
- **Impact:** Administrators are automatically logged out every time they create a user.

### 2.2 Non-functional Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue:** The search input field in `admin-userlist.component.html` is not bound to any logic in `admin-userlist.component.ts`.
- **Impact:** Users cannot filter the user list.

### 2.3 Incorrect HttpClient Post Configuration
- **Location:** `AdminUserlistComponent`, `AdminUsereditComponent`
- **Issue:** `http.post` calls are incorrectly passing `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (request options).
- **Impact:** Authentication cookies are not sent with these requests, leading to "unauthenticated" errors even when a valid session exists.

### 2.4 Model Type Mismatch
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as a `String` but is assigned a boolean `false` as a default value.
- **Impact:** Potential inconsistencies in database queries and application logic.

---

## 3. Infrastructure and Testing Issues

### 3.1 Misspelled Frontend Directory
- **Location:** Root directory
- **Issue:** The frontend directory is misspelled as `frondend`.

### 3.2 Failing Unit Tests
- **Location:** `frondend/jwtapp/`
- **Issue:** 12 out of 14 Angular unit tests are failing, primarily due to `NullInjectorError` (missing `HttpClient` and `Store` providers).

### 3.3 Hardcoded Database URI
- **Location:** `backend/index.js`
- **Issue:** The MongoDB connection string is hardcoded.
- **Impact:** Difficult to manage different environments (development, staging, production).
