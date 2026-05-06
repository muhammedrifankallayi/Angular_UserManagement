# Bug Report

This report documents the security vulnerabilities, logic errors, and UI issues identified in the JWT application.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** Both admin and user routes use a hardcoded string `"secret"` for signing and verifying JWT tokens.
- **Severity:** High
- **Recommendation:** Use environment variables (e.g., `process.env.JWT_SECRET`) to store sensitive secrets.

### 1.2 Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Admin endpoints do not consistently use a centralized middleware to verify if the requester is an authenticated administrator.
- **Severity:** High
- **Recommendation:** Implement a middleware to verify the JWT and the `is_admin` status before allowing access to admin routes.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Endpoint: `/users`)
- **Description:** The logic to exclude password hashes from the user list is commented out. Consequently, hashed passwords are sent to the frontend.
- **Severity:** High
- **Recommendation:** Uncomment or implement logic to exclude sensitive fields like `password` from the response.

## 2. Logic Errors

### 2.1 Admin Session Overwritten on User Creation
- **Location:** `backend/routes/adminroute.js` (Endpoint: `/createuser`)
- **Description:** When an admin creates a new user, the backend issues a new JWT cookie for the newly created user, overwriting the admin's session cookie and effectively logging them out.
- **Severity:** Medium
- **Recommendation:** Do not issue a new JWT cookie when an administrator creates a user.

### 2.2 Incorrect `withCredentials` Usage in Frontend
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** In several `http.post` calls, `{withCredentials: true}` is passed as the second argument (the request body) instead of the third argument (request options). This prevents authentication cookies from being sent.
- **Severity:** Medium
- **Recommendation:** Move the options object to the third argument: `this.http.post(url, body, { withCredentials: true })`.

## 3. UI and Structural Issues

### 3.1 Misspelled Frontend Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Severity:** Low
- **Recommendation:** Rename the directory to `frontend`.

### 3.2 Non-functional Search Bar
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field in the admin user list is not bound to any filtering logic in the component.
- **Severity:** Low
- **Recommendation:** Implement a filter pipe or search logic in the component to filter the user list.

## 4. Test Failures
- **Status:** 12 out of 14 tests are failing.
- **Primary Issue:** `NullInjectorError: No provider for HttpClient!` in multiple component tests.
- **Severity:** Medium
- **Recommendation:** Update test suites to include `HttpClientTestingModule` or provide a mock for `HttpClient`.
