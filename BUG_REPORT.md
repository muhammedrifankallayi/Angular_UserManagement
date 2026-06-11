# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secrets
The backend uses a hardcoded string `"secret"` for signing and verifying JWT tokens instead of using the `jwtsecret` defined in the `.env` file.
- **Files affected:** `backend/routes/routes.js`, `backend/routes/adminroute.js`

### 2. Missing Authentication and Authorization Middleware
Administrative routes in `backend/routes/adminroute.js` (except for login) do not consistently use middleware to verify tokens or check if the user has administrative privileges.
- **File affected:** `backend/routes/adminroute.js`

### 3. Exposure of Sensitive Data
The `/api/admin/users` endpoint returns the full user object, including hashed passwords, to the client.
- **File affected:** `backend/routes/adminroute.js`

### 4. Lack of CSRF Protection
The application uses cookie-based authentication (`httpOnly: true`) but does not implement CSRF protection, making it vulnerable to Cross-Site Request Forgery attacks.

---

## Logic and Configuration Errors

### 1. Incorrect Data Type for `is_admin`
The `is_admin` field in the User model is defined as a `String` but has a boolean default value `false`.
- **File affected:** `backend/models/user.js`

### 2. Hardcoded MongoDB Connection String
The MongoDB connection string is hardcoded in `index.js`.
- **File affected:** `backend/index.js`

### 3. Silent Error Handling
Several route handlers in the backend have empty `catch` blocks or only log the error message without sending an appropriate error response to the client.
- **Files affected:** `backend/routes/routes.js`, `backend/routes/adminroute.js`

---

## Frontend Issues

### 1. Misspelled Directory Name
The frontend directory is misspelled as `frondend` instead of `frontend` in the repository root.

### 2. Failing Unit Tests
The majority of Angular unit tests (12 out of 14) are currently failing due to missing dependency injections in test suites (e.g., `HttpClient`, `Router`, `Store`).

### 3. Unimplemented Search Functionality
The `AdminUserlistComponent` has a search bar in its HTML template, but the corresponding logic in the TypeScript file is not implemented.

### 4. Incorrect `HttpClient.post` Usage
In some components, the `HttpClient.post` method is called with request options as the second argument, which Angular treats as the request body.
