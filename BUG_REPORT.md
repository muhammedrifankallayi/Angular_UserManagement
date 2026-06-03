# Bug Report - JWT Project

This report documents several security vulnerabilities, logic errors, and architectural issues identified in the codebase.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
The application uses a hardcoded string `"secret"` for signing and verifying JSON Web Tokens, despite having a `.env` file with a `jwtsecret` variable.
- **Affected Files:**
  - `backend/routes/adminroute.js`
  - `backend/routes/routes.js`
- **Impact:** Compromises the security of authentication tokens.

### 1.2 Missing Access Control on Admin Routes
Most endpoints in `adminroute.js` lack authentication and authorization middleware. Any user (or even unauthenticated visitors) can potentially access sensitive admin functions if they know the URL.
- **Affected File:** `backend/routes/adminroute.js`
- **Impact:** Unauthorized users can list, create, edit, or delete users.

### 1.3 Exposure of Sensitive Data (Hashed Passwords)
The `/api/admin/users` endpoint returns the entire user object from MongoDB, including the `password` field (hashed).
- **Affected File:** `backend/routes/adminroute.js` (specifically the `GET /users` route)
- **Impact:** Leakage of hashed passwords increases the risk of brute-force attacks if the database is partially compromised or if the API response is intercepted.

### 1.4 Hardcoded MongoDB Connection String
The database connection string is hardcoded in the main application file.
- **Affected File:** `backend/index.js`
- **Impact:** Harder to manage across different environments (dev, staging, production) and exposes infrastructure details.

---

## 2. Logic Errors and Schema Issues

### 2.1 `is_admin` Field Type Mismatch
In the User model, `is_admin` is defined as a `String` but has a boolean `default: false`.
- **Affected File:** `backend/models/user.js`
- **Impact:** Potential inconsistent behavior when querying or updating the field.

### 2.2 Silent Error Handling
Many route handlers use empty `catch` blocks or only `console.log(error.message)`, failing to return appropriate error statuses or messages to the frontend.
- **Affected Files:**
  - `backend/routes/adminroute.js`
  - `backend/routes/routes.js`
- **Impact:** Difficult to debug and results in a poor user experience when things go wrong.

---

## 3. Project Structure and Frontend Issues

### 3.1 Misspelled Frontend Directory
The frontend root directory is misspelled as `frondend`.
- **Location:** Project root.

### 3.2 Unimplemented Search Functionality
The search bar in the Admin User List component is present in the HTML but is not bound to any component logic or filtering.
- **Affected File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`

### 3.3 Frontend Test Failures
After installing dependencies, 12 out of 14 Angular unit tests failed. Most failures are due to `NullInjectorError: No provider for HttpClient!`, indicating that the test suites are missing necessary module imports (like `HttpClientTestingModule`).

### 3.4 Missing Backend Tests
The backend `package.json` does not have any tests defined, and no test files were found in the `backend/` directory.
