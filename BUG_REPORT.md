# Bug Report - JWT Project

This report documents the security vulnerabilities, logic/architectural issues, and test failures identified in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`, and `backend/.env`.
- **Issue:** The backend uses a hardcoded string `"secret"` for signing and verifying JWT tokens instead of using the environment variable `process.env.jwtsecret`.
- **Impact:** Compromises security and makes secret rotation difficult.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`.
- **Issue:** Several administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`) lack `verifyToken` and `isAdmin` middleware.
- **Impact:** Any user (or even unauthenticated visitors, depending on the route) could potentially access or modify user data.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (specifically the `/users` route).
- **Issue:** The `/users` route returns the entire user object, including hashed passwords, to the frontend.
- **Impact:** Security risk as hashed passwords should never be sent to the client.

### 1.4 Missing CSRF Protection
- **Issue:** The application lacks Cross-Site Request Forgery (CSRF) protection despite using cookies for authentication.
- **Impact:** Users could be tricked into performing unintended actions on the site.

---

## 2. Logic and Architectural Issues

### 2.1 Incorrect Data Types in Mongoose Schema
- **Location:** `backend/models/user.js`.
- **Issue:** The `is_admin` field is defined as a `String` with a default value of `false` (boolean).
- **Impact:** Inconsistent data types can lead to unexpected behavior during queries and logic checks.

### 2.2 Misspelled Directory Name
- **Location:** Project root.
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Confusion for developers and potential issues with automated scripts or deployments.

### 2.3 Poor Error Handling
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`.
- **Issue:** Multiple routes have empty `catch` blocks or only use `console.log` for errors without sending an appropriate error response to the client.
- **Impact:** Failures can occur silently, making debugging difficult and providing a poor user experience.

---

## 3. Frontend Issues and Test Failures

### 3.1 Unit Test Failures
- **Location:** `frondend/jwtapp/`.
- **Status:** 12 out of 14 unit tests are currently failing.
- **Primary Reason:** `NullInjectorError: No provider for HttpClient!`. Tests are not properly configured with `HttpClientTestingModule` or necessary mocks.
- **Affected Components:** `RegisterComponent`, `AdminUsereditComponent`, `HomeComponent`, `DashboardComponent`, `AdminNavComponent`, `AdminLoginComponent`, `AdminUserlistComponent`, etc.

### 3.2 Misplaced Options in HttpClient Calls
- **Issue:** Some `HttpClient.post` calls were passing options (like `withCredentials: true`) as the second argument (where the body should be) instead of the third.
- **Impact:** API calls fail or send incorrect data. (Note: Some of these may have been partially addressed in local fixes).
