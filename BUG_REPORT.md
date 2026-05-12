# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The application uses a hardcoded secret string `"secret"` for signing and verifying JSON Web Tokens.
- **Severity:** High

### 2. Missing Authentication/Authorization Middleware
- **Location:** `backend/`
- **Description:** There is no centralized middleware to protect administrative or user-specific routes. Each route manually checks for cookies and verifies tokens, leading to potential inconsistencies and code duplication.
- **Severity:** Medium

### 3. Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` - `/api/admin/users` endpoint.
- **Description:** The endpoint returns all user data from the database, including hashed passwords, because the exclusion logic is commented out.
- **Severity:** High

### 4. Admin Session Overwritten on User Creation
- **Location:** `backend/routes/adminroute.js` - `/api/admin/createuser` endpoint.
- **Description:** When an administrator creates a new user, the backend issues a new JWT for the created user and sets it in the `jwt` cookie. This overwrites the administrator's own session cookie, effectively logging them out.
- **Severity:** Medium

## Logic Errors

### 5. Incorrect Data Type for `is_admin`
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as a `String` but initialized with a boolean default value `false`. It should ideally be a `Boolean`.
- **Severity:** Low

### 6. Incorrect `HttpClient` POST Request Parameters
- **Location:** Multiple frontend components (e.g., `AdminUserlistComponent`, `AdminUsereditComponent`).
- **Description:** In several `http.post` calls, `{ withCredentials: true }` is passed as the second argument (the request body) instead of the third argument (the options object). This results in the option being ignored by Angular and an empty/incorrect body being sent.
- **Severity:** Medium

## UI / Functional Bugs

### 7. Non-functional User Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field is present in the UI but is not bound to any logic in the component, making it non-functional.
- **Severity:** Low

## Test Failures

### 8. Extensive Unit Test Failures
- **Component:** Frontend (`frondend/jwtapp/`)
- **Description:** 12 out of 14 unit tests are failing. The primary cause is `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` or similar providers are missing from the test configurations for multiple components.
- **Severity:** Medium
