# Bug Report - JWT Authentication Project

## 1. Security Leaks

### 1.1. Password Exposure in Admin User List
- **File:** `backend/routes/adminroute.js`
- **Description:** The GET endpoint `/api/admin/users` returns all user documents directly from the database without filtering out the `password` field. The line intended to exclude the password is currently commented out.
- **Impact:** Administrative users (or anyone who can access this endpoint) can view the hashed passwords of all users.

### 1.2. Unprotected Administrative Endpoints
- **File:** `backend/routes/adminroute.js`
- **Description:** Most administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware. There is no `auth.js` middleware in the `backend/middleware/` directory (which doesn't even exist).
- **Impact:** Any user or even an unauthenticated attacker can perform administrative actions if they know the endpoint URLs.

### 1.3. Hardcoded JWT Secrets
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The string `"secret"` is hardcoded as the secret key for signing and verifying JSON Web Tokens (JWT).
- **Impact:** It is extremely easy for an attacker to forge valid JWT tokens, completely bypassing authentication.

### 1.4. Session Overwrite on User Creation
- **File:** `backend/routes/adminroute.js`
- **Description:** The `/createuser` endpoint (used by admins to create new users) generates a new JWT for the *newly created* user and sets it as a cookie.
- **Impact:** When an administrator creates a new user, their own administrator session cookie is overwritten by the new user's cookie, effectively logging the admin out and logging them in as the new user.

### 1.5. Missing CSRF Protection
- **File:** `backend/index.js`
- **Description:** While CORS is configured to allow credentials from `http://localhost:4200`, there is no Cross-Site Request Forgery (CSRF) protection in place.
- **Impact:** The application is vulnerable to CSRF attacks because it relies solely on cookies for authentication.

---

## 2. Logic Errors

### 2.1. Broken Search Functionality
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field in the User List component is not bound to any data or logic in `admin-userlist.component.ts`.
- **Impact:** The search bar is purely cosmetic and does not filter the user list.

### 2.2. Incorrect HttpClient POST Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** `HttpClient.post()` is called with the options object as the second argument (e.g., `http.post(url, { withCredentials: true })`). In Angular, the second argument for `post` is the request body.
- **Impact:** The options are sent as the body, and the actual options (like `withCredentials`) are not applied. This can lead to requests failing because cookies are not sent.

### 2.3. Data Type Inconsistency
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** This can lead to unexpected behavior during database queries and logical comparisons in the backend.

---

## 3. Environment and Testing Issues

### 3.1. Directory Misspelling
- **Description:** The main frontend directory is misspelled as `frondend/` instead of `frontend/`.

### 3.2. Widespread Unit Test Failures
- **Description:** 12 out of 14 Angular unit tests fail.
- **Root Cause:** Most failures are `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` is missing from the test configurations.

### 3.3. Missing Backend Start Script
- **File:** `backend/package.json`
- **Description:** There is no `"start"` script defined in the `scripts` section.
- **Impact:** Users cannot use `npm start` to run the backend server.
