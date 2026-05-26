# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Both files use the hardcoded string `"secret"` for signing and verifying JWT tokens instead of using the environment variable `jwtsecret` defined in `backend/.env`.
* **Severity:** High

### 1.2 Missing Authentication and Authorization Middleware
* **Location:** `backend/routes/adminroute.js`
* **Description:** Most administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack any middleware to verify if the requester is authenticated or has administrator privileges.
* **Severity:** High

### 1.3 Sensitive Data Exposure
* **Location:** `backend/routes/adminroute.js` (Endpoint: `/users`)
* **Description:** The `/api/admin/users` endpoint returns the full user object from the database, including the `password` (hashed). This sensitive information should be excluded from the response.
* **Severity:** High

### 1.4 Admin Session Overwrite
* **Location:** `backend/routes/adminroute.js` (Endpoint: `/createuser`)
* **Description:** When an administrator creates a new user, the backend generates a new JWT for the *created* user and sets it as the `jwt` cookie. This overwrites the administrator's session, effectively logging them out and into the new user's account.
* **Severity:** Medium

### 1.5 Lack of CSRF Protection
* **Description:** The application uses cookie-based authentication and has CORS enabled with `credentials: true`, but does not implement CSRF (Cross-Site Request Forgery) protection.
* **Severity:** Medium

---

## 2. Logic and Architectural Issues

### 2.1 Directory Misspelling
* **Description:** The frontend directory is misspelled as `frondend` throughout the repository.
* **Severity:** Low

### 2.2 Silent Error Handling
* **Location:** Various backend routes.
* **Description:** Several route handlers (e.g., `/deleteUser/:id`, `/profile-upload-single`) have empty `catch` blocks or only use `console.log`, which can lead to swallowed errors and difficult debugging.
* **Severity:** Low

### 2.3 User Model Field Type
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field is defined as a `String` but has a boolean default value (`false`). It should ideally be a `Boolean` type.
* **Severity:** Low

---

## 3. Frontend Issues

### 3.1 Incorrect HttpClient Usage
* **Location:** `AdminUserlistComponent`, `AdminUsereditComponent`, `AdminCreateuserComponent`
* **Description:** `HttpClient.post` calls incorrectly pass `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (the options object).
* **Severity:** Medium

### 3.2 Missing Search Functionality
* **Location:** `AdminUserlistComponent`
* **Description:** The UI contains a search input field, but there is no corresponding logic in the component or backend to filter the user list.
* **Severity:** Low

---

## 4. Test Execution Results

### 4.1 Frontend Unit Tests
* **Execution Summary:** 12 FAILED, 2 SUCCESS
* **Primary Cause:** `NullInjectorError: No provider for HttpClient!`. This occurs because the tests do not provide `HttpClientTestingModule` or a mock HttpClient in their `TestBed` configuration.
* **Impacted Components:** `AdminNavComponent`, `AdminLoginComponent`, `AdminUserlistComponent`, `AdminUsereditComponent`, `HomeComponent`, `DashboardComponent`, `LoginComponent`, etc.
