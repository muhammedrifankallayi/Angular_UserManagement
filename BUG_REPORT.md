# Bug Report - JWT Application

## Security Vulnerabilities

### 1. Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The application uses a hardcoded string `"secret"` for signing and verifying JWT tokens, ignoring the `jwtsecret` defined in the `.env` file.
- **Risk:** Compromises the security of the authentication system if the source code is exposed.

### 2. Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not have middleware to verify if the requester is an authenticated administrator.
- **Risk:** Any user or even unauthenticated guests could potentially delete or edit users by hitting these endpoints directly.

### 3. Exposure of Sensitive Data
- **Location:** `backend/routes/adminroute.js` - `/users` endpoint
- **Issue:** The `/users` endpoint returns the entire user object from the database, including the `password` hash.
- **Risk:** Exposure of password hashes facilitates offline brute-force attacks.

### 4. Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` - `/createuser` endpoint
- **Issue:** When an administrator creates a new user, the backend issues a new JWT for the *newly created user* and sets it as the `jwt` cookie, effectively logging the admin out and logging them in as the new user.
- **Risk:** Poor user experience and logical flaw in administrative workflow.

### 5. Type Mismatch for `is_admin` Field
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as `type: String` but has a default value of `false` (boolean).
- **Risk:** Potential for type confusion and unexpected behavior during authentication checks.

---

## Logic & Frontend Issues

### 6. Missing Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue:** The `admin-userlist.component.html` contains a search input field, but the `admin-userlist.component.ts` lacks any logic to handle filtering or searching the user list.

### 7. Incorrect API Call Configuration
- **Location:** `frondend/jwtapp/src/app/components/admin-createuser/admin-createuser.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** In several `http.post` calls, `{ withCredentials: true }` is passed as the second argument (the request body) instead of the third argument (the options object).
- **Risk:** Cookies (JWT) will not be sent with these requests, leading to authentication failures on the backend.

### 8. Directory Misspelling
- **Location:** Root directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.

### 9. Lack of Backend Error Handling
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** Many routes have empty `catch` blocks or only log errors to the console without sending an appropriate error response to the client.
- **Risk:** Client-side hangs or generic failures without feedback to the user.
