# Bug Report

This report documents identified bugs, security vulnerabilities, and code quality issues within the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** Both files use the hardcoded string `"secret"` for JWT signing and verification instead of the `process.env.jwtsecret` value defined in the `.env` file.
- **Suggested Fix:** Replace `"secret"` with `process.env.jwtsecret`.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Administrative routes such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack middleware to verify if the requester is authenticated and has administrative privileges.
- **Suggested Fix:** Implement and apply `verifyToken` and `isAdmin` middleware to these routes.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Route: `/users`)
- **Description:** The `/users` route returns all user data from the database, including hashed passwords, which should never be exposed to the frontend.
- **Suggested Fix:** Use projection in the Mongoose query or manually filter the data to exclude sensitive fields (e.g., `.find({}, { password: 0 })`).

### 1.4 Missing CSRF Protection
- **Description:** The application lacks Cross-Site Request Forgery (CSRF) protection, which is particularly risky since it uses cookie-based authentication.

---

## 2. Logic Errors

### 2.1 Schema Type Mismatch
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a default value of `false` (boolean). This inconsistency can lead to unexpected behavior during database operations.
- **Suggested Fix:** Change the type to `Boolean`.

### 2.2 Incorrect `HttpClient.post` Usage
- **Location:** Multiple frontend components (e.g., `AdminUserlistComponent`, `AdminUsereditComponent`)
- **Description:** `this.http.post()` is called with the request options (containing `withCredentials: true`) as the second argument. In Angular's `HttpClient`, the second argument is the request body, and options should be the third argument.
- **Suggested Fix:** Pass an empty object `{}` as the second argument if there is no body, and move the options to the third argument.

### 2.3 Poor Error Handling
- **Location:** Throughout `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Many route handlers have empty `catch` blocks or only use `console.log`. This can cause requests to hang or fail silently from the client's perspective.
- **Suggested Fix:** Ensure all `catch` blocks send an appropriate error response (e.g., `res.status(500).send(...)`).

---

## 3. Frontend Issues

### 3.1 Misspelled Directory
- **Location:** Root directory
- **Description:** The frontend directory is misspelled as `frondend`.
- **Suggested Fix:** Rename the directory to `frontend`.

### 3.2 Unimplemented Search Functionality
- **Location:** `AdminUserlistComponent` (HTML and TS)
- **Description:** There is a search input field in the UI, but no logic is implemented to filter the user list.

### 3.3 Failing Unit Tests
- **Location:** `frondend/jwtapp/`
- **Description:** 12 out of 14 frontend unit tests are failing due to missing providers like `HttpClient` and `Router` in the `TestBed` configuration.

---

## 4. Environment & Configuration

### 4.1 Hardcoded Database URL
- **Location:** `backend/index.js`
- **Description:** The MongoDB connection string is hardcoded.
- **Suggested Fix:** Move the connection string to the `.env` file.

### 4.2 Hardcoded CORS Origin
- **Location:** `backend/index.js`
- **Description:** The CORS allowed origin is hardcoded to `http://localhost:4200`.
- **Suggested Fix:** Move the allowed origin to the `.env` file.
