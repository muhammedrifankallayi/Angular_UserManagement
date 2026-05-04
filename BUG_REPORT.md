# Bug Report - JWT App Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` in both `jwt.sign()` and `jwt.verify()` calls.
- **Impact:** Compromises the security of the entire authentication system.

### 1.2 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` - `GET /api/admin/users`
- **Issue:** The endpoint returns all user records including hashed passwords. The code to exclude passwords is commented out.
- **Impact:** Potential for password cracking if an attacker gains access to this endpoint.

### 1.3 Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`) do not verify if the requester is an authenticated administrator.
- **Impact:** Unauthorized users can view, edit, or delete user accounts.

## 2. Logic Errors

### 2.1 Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` - `POST /api/admin/createuser`
- **Issue:** When an admin creates a new user, the backend generates a JWT for the *newly created user* and sets it as the "jwt" cookie.
- **Impact:** The administrator is effectively logged out and logged in as the new user after creating them.

### 2.2 Incorrect HttpClient Usage in Frontend
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** `http.post` calls are passing `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (options).
- **Impact:** Cookies are not sent with these POST requests, leading to authentication failures if the backend were to check them.

### 2.3 Non-functional Search in User List
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field has no `ngModel` or event binding to filter the displayed users.
- **Impact:** Users cannot search/filter the list.

## 3. Architectural and Naming Issues

### 3.1 Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.

### 3.2 Inconsistent Schema Types
- **Location:** `backend/models/user.js`
- **Issue:** `is_admin` is defined as a `String` but initialized with a boolean `false`.

## 4. Test Failures

### 4.1 Angular Unit Test Failures
- **Status:** 12 out of 14 tests failing.
- **Primary Cause:** `NullInjectorError: No provider for HttpClient!` in almost all component specs.
- **Resolution:** Need to import `HttpClientTestingModule` or provide a mock for `HttpClient` in `TestBed.configureTestingModule`.
