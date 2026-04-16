# Bug Report

## Summary
This report documents security vulnerabilities, logic errors, and environment issues found in the JWT application.

## 1. Security Vulnerabilities

### 1.1 Password Hash Leak in `/api/admin/users`
- **Location:** `backend/routes/adminroute.js`
- **Description:** The endpoint `/api/admin/users` fetches all users from the database but does not exclude the `password` field. The logic to exclude passwords is currently commented out.
- **Impact:** Administrative users can see hashed passwords of all users, which is a significant security risk.

### 1.2 Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Description:** Most administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have any authentication middleware. Any user (or even unauthenticated users) can access these endpoints if they know the URL.
- **Impact:** Critical administrative actions can be performed by unauthorized users.

### 1.3 Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`
- **Description:** The secret key used for signing and verifying JWTs is hardcoded as `"secret"` in multiple files.
- **Impact:** Makes the application vulnerable to token forgery if an attacker knows the common default secret.

### 1.4 Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (endpoint `/createuser`)
- **Description:** When an admin creates a new user, the backend issues a new JWT for the newly created user and sets it in the `jwt` cookie.
- **Impact:** The administrator's session is overwritten by the new user's session, effectively logging the admin out and logging them in as the new user.

### 1.5 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Description:** The backend uses cookies for authentication but does not implement any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Users could be tricked into performing unintended actions on the site.

## 2. Logic and UI Errors

### 2.1 Broken Search in Admin User List
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
- **Description:** The search input in the admin user list is not connected to any logic in the component. Typing in the search box has no effect on the displayed list.

### 2.2 Incorrect `HttpClient.post` Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
- **Description:** `HttpClient.post` calls pass the options object (containing `withCredentials: true`) as the second argument, which is intended for the request body. The options should be the third argument.
- **Impact:** Authentication cookies are not sent with these POST requests, leading to "unauthenticated" errors if the backend were protected.

### 2.3 Type Inconsistency for `is_admin`
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (boolean).
- **Impact:** Potential for confusion and logic errors when checking the `is_admin` status.

## 3. Environment and Architectural Issues

### 3.1 Misspelled Frontend Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.

### 3.2 Missing Backend Start Script
- **Location:** `backend/package.json`
- **Description:** There is no `start` script defined, making it less intuitive to start the server (currently requires `node index.js`).

## 4. Test Results

### 4.1 Frontend Tests
- **Status:** 12 FAILED, 2 SUCCESS
- **Common Error:** `NullInjectorError: No provider for HttpClient!`
- **Reason:** Unit tests are missing necessary module imports like `HttpClientTestingModule`, `FormsModule`, and `RouterTestingModule`.

### 4.2 Backend Tests
- **Status:** FAILED (Error: no test specified)
- **Reason:** No tests are implemented for the backend.
