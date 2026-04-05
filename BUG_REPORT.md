# BUG REPORT - JWT APP PROJECT

## SECURITY VULNERABILITIES

### 1. Password Hash Leak in `/api/admin/users`
The endpoint in `backend/routes/adminroute.js` returns the full user object including the hashed password. The code to exclude the password field is currently commented out.
- **Location:** `backend/routes/adminroute.js` (line 74-75)
- **Impact:** Attackers can potentially gain access to password hashes for all users.

### 2. Unprotected Administrative Endpoints
Administrative endpoints in `backend/routes/adminroute.js` (like `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have any middleware to check if the user is an administrator or even authenticated (except for `/active`).
- **Location:** `backend/routes/adminroute.js`
- **Impact:** Any user or even unauthenticated users could potentially delete or edit users.

### 3. Hardcoded JWT Secret
The JWT secret `secret` is hardcoded in both `backend/routes/adminroute.js` and `backend/routes/routes.js` for signing and verifying tokens, instead of using an environment variable.
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Impact:** Compromises the security of the entire authentication system if the source code is leaked.

### 4. Missing CSRF Protection
The application uses cookies for authentication but lacks any Cross-Site Request Forgery (CSRF) protection.
- **Location:** `backend/index.js` (CORS configuration allows credentials)
- **Impact:** Users could be tricked into performing actions without their knowledge.

### 5. Administrator Session Overwrite on User Creation
The `/createuser` endpoint in `backend/routes/adminroute.js` issues a new JWT cookie for the newly created user, which overwrites the administrator's own session cookie.
- **Location:** `backend/routes/adminroute.js` (line 144-147)
- **Impact:** The administrator is logged out and logged in as the new user upon creating one.

## LOGIC ERRORS

### 6. Broken Search Filter
The search input in the `AdminUserlistComponent` template is not bound to any logic in the component, making the filter non-functional.
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Impact:** Administrators cannot search for users in the list.

### 7. Incorrect HttpClient Usage in Admin Components
The `http.post` calls in `AdminUserlistComponent.deleteUser` and `AdminUsereditComponent.getusers` pass the options (like `withCredentials`) as the second argument, which is reserved for the request body.
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (line 42) and `AdminUsereditComponent.ts` (line 90).
- **Impact:** The `withCredentials` option is ignored, and authentication cookies are not sent, leading to request failures.

### 8. Type Inconsistency in User Model
The `is_admin` field in the User model is defined as a `String` with a default value of `false` (boolean).
- **Location:** `backend/models/user.js` (line 17)
- **Impact:** Can lead to unexpected behavior and comparison issues in database queries.

## ENVIRONMENT AND MAINTENANCE ISSUES

### 9. Misspelled Frontend Directory
The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Location:** Project root.
- **Impact:** Confusing for developers and potentially breaks automated scripts.

### 10. Missing Start Script in Backend
The backend `package.json` does not have a `start` script, forcing users to run `node index.js` manually.
- **Location:** `backend/package.json`
- **Impact:** Inconsistent developer experience.

### 11. Failing Frontend Unit Tests
12 out of 14 Angular unit tests are currently failing, mostly due to `NullInjectorError` because of missing providers in the test suites.
- **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
- **Impact:** Makes it impossible to verify code quality and increases the risk of regressions.
