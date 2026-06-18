# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
The JWT secret is hardcoded as `"secret"` in multiple backend files instead of using environment variables.
- **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Impact:** Compromises the security of the entire authentication system if the source code is exposed.

### 2. Missing Authentication/Authorization Middleware
Administrative routes lack middleware to verify if the requesting user is an authenticated administrator.
- **File:** `backend/routes/adminroute.js`
- **Impact:** Any user (or even unauthenticated visitors) can potentially access admin endpoints like `/api/admin/users`, `/api/admin/deleteUser/:id`, etc., if they know the URL.

### 3. Sensitive Data Exposure
The `/api/admin/users` endpoint returns all user data, including hashed passwords.
- **Endpoint:** `GET /api/admin/users` in `backend/routes/adminroute.js`
- **Impact:** Unnecessary exposure of password hashes increases the risk of brute-force attacks if the data is intercepted or accessed by unauthorized parties.

### 4. Admin Session Overwriting
When an administrator creates a new user, the backend generates a new JWT for the *created* user and sets it as the "jwt" cookie, effectively logging the admin out and logging them in as the new user.
- **Endpoint:** `POST /api/admin/createuser` in `backend/routes/adminroute.js`
- **Impact:** Disrupts administrative workflow and is a significant logic error.

### 5. Lack of CSRF Protection
The application uses cookies for authentication but does not implement any CSRF protection mechanisms.
- **Impact:** Users are vulnerable to Cross-Site Request Forgery attacks.

---

## Logic and Implementation Bugs

### 1. Incorrect HttpClient usage in Frontend
In `AdminUserlistComponent`, the `deleteUser` method passes the `withCredentials` option as the second argument (the body) of a `POST` request.
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Impact:** The request body becomes `{"withCredentials": true}` and the actual options (like headers/credentials) are not correctly applied to the request.

### 2. Type Inconsistency in User Model
The `is_admin` field in the User schema is defined as a `String` but has a boolean default `false`.
- **File:** `backend/models/user.js`
- **Impact:** Leads to confusing code and potential type-related bugs during database queries and logic checks.

### 3. Poor Error Handling
Many backend routes have empty `catch` blocks or only `console.log` the error without sending an appropriate response to the client.
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Impact:** Requests can hang or fail silently, providing a poor user experience and making debugging difficult.

---

## Architectural and Miscellaneous Issues

### 1. Misspelled Frontend Directory
The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Professionalism and potentially confusing for developers or automated tools.

### 2. Hardcoded MongoDB Connection String
The MongoDB connection string is hardcoded in `backend/index.js`.
- **Impact:** Makes environment-specific configuration difficult.
