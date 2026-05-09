# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, and infrastructure issues identified in the codebase.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret is hardcoded as `"secret"`. While a `.env` file exists with `jwtsecret="secret"`, the code does not consistently use `process.env`.
- **Risk:** High. If the source code is compromised, tokens can be easily forged.

### 1.2 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js`, endpoint `GET /api/admin/users`
- **Issue:** The code that excludes passwords from the user list is commented out.
- **Risk:** High. Admin users can see hashed passwords of all users.

### 1.3 Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`) do not have any middleware to verify if the requester is actually an authenticated administrator. They rely on the frontend for protection, which is insecure.
- **Risk:** Critical. Anyone can access or modify user data by calling the API directly.

### 1.4 CSRF Vulnerability
- **Location:** `backend/index.js`
- **Issue:** `withCredentials: true` is enabled for CORS, but there is no CSRF protection (like synchronized tokens or Double Submit Cookie).
- **Risk:** Medium. Users could be tricked into performing actions on the application via malicious sites.

## 2. Logic Errors

### 2.1 Admin Logout on User Creation
- **Location:** `backend/routes/adminroute.js`, endpoint `POST /createuser`
- **Issue:** When an admin creates a new user, the backend generates a new JWT for the *newly created user* and sets it as a cookie. This overwrites the admin's session cookie, effectively logging the admin out and logging them in as the new user.
- **Risk:** Medium (Usability/Security).

### 2.2 Incorrect HttpClient Usage (Angular)
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** `this.http.post(url, { withCredentials: true })` is used. In Angular's `HttpClient.post`, the second argument is the request body. `withCredentials` should be in the options (third argument).
- **Result:** Authentication cookies are not sent with these POST requests.

### 2.3 Non-functional Search Feature
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field has no `ngModel` or event binding. It does nothing.

## 3. Infrastructure & Consistency Issues

### 3.1 Directory Misspelling
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Inconsistent Data Types
- **Location:** `backend/models/user.js`
- **Issue:** `is_admin` is defined as `type: String` but defaulted to `false` (boolean).

### 3.3 Failing Unit Tests
- **Location:** `frondend/jwtapp/`
- **Issue:** 12 out of 14 Angular unit tests are failing, primarily due to `NullInjectorError: No provider for HttpClient!`. This indicates that `HttpClientTestingModule` is missing from the test configurations.

### 3.4 Missing Backend Tests
- **Issue:** The backend has no automated tests defined in `package.json`.
