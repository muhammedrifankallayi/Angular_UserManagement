# Bug Report

## Security Vulnerabilities

### 1. Hashed Password Leak
- **Location:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/users` endpoint returns the entire user object from the database, including the hashed password. The code that should exclude the password is currently commented out.
- **Impact:** Attackers who gain access to this endpoint can obtain hashed passwords for all users, which can then be subjected to offline brute-force or rainbow table attacks.

### 2. Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/createuser`) do not have any middleware to verify if the requester is authenticated or has administrator privileges.
- **Impact:** Any user or even unauthenticated attackers can potentially perform administrative actions like deleting or creating users.

### 3. Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`
- **Issue:** The JWT signing and verification process uses the hardcoded string `"secret"`. While there is a `.env` file, the routes still use the hardcoded string directly in the code.
- **Impact:** If an attacker knows the secret, they can forge valid JWT tokens and impersonate any user, including administrators.

### 4. Admin Session Overwrite
- **Location:** `backend/routes/adminroute.js` (specifically the `/createuser` endpoint)
- **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, which overwrites the administrator's own session cookie.
- **Impact:** The administrator is effectively logged out or transitioned into the context of the newly created user after performing an administrative task.

### 5. Missing CSRF Protection
- **Issue:** The application does not implement Cross-Site Request Forgery (CSRF) protection, and the backend CORS configuration allows credentials.
- **Impact:** Users could be tricked into performing unintended actions on the application if they visit a malicious website while logged in.

## Logic and Implementation Errors

### 1. Non-functional Search Bar
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
- **Issue:** The search input field in the user list template is not bound to any component logic or filtering mechanism.
- **Impact:** Users cannot filter or search through the user list.

### 2. Incorrect HttpClient usage in Angular
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
- **Issue:** `HttpClient.post` calls are passing the options object (containing `withCredentials: true`) as the second argument, which is intended for the request body.
- **Impact:** Authentication cookies are not sent with these POST requests, likely leading to authentication failures once proper middleware is implemented.

### 3. Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as `type: String` but has a `default: false` (boolean).
- **Impact:** This can lead to unexpected behavior during database queries and type comparisons in the backend logic.

## Environment and Structural Issues

### 1. Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** This can cause confusion and potential issues with scripts or automation that expect standard naming conventions.

### 2. Missing Backend Start Script
- **Location:** `backend/package.json`
- **Issue:** There is no `"start"` script defined in `package.json`.
- **Impact:** Users cannot start the backend using the standard `npm start` command.

### 3. Test Failures
- **Issue:** Angular unit tests are failing due to missing providers (`NullInjectorError`).
- **Impact:** The reliability of the frontend cannot be verified through automated testing.
