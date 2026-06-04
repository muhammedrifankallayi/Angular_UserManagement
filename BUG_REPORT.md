# Bug Report

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
*   **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
*   **Description:** The JWT signing and verification processes use a hardcoded string `"secret"` instead of the environment variable `process.env.jwtsecret` defined in `.env`.
*   **Risk:** Highly vulnerable if the source code is compromised.

### 1.2 Missing Authentication/Authorization Middleware
*   **Location:** `backend/routes/adminroute.js`
*   **Description:** Most administrative routes (e.g., `/users`, `/deleteUser/:id`, `/createuser`) lack any token verification or admin-role checks. Any user (or non-user) can hit these endpoints if they know the URL.
*   **Risk:** Unauthorized access to sensitive administrative functions.

### 1.3 Sensitive Data Exposure
*   **Location:** `backend/routes/adminroute.js` (Route: `/users`)
*   **Description:** The `/api/admin/users` endpoint returns all user documents from the database, including the `password` field (hashed).
*   **Risk:** Exposure of password hashes increases the risk of brute-force attacks if the database is otherwise secure.

### 1.4 Lack of CSRF Protection
*   **Description:** The application uses cookie-based authentication (`jwt` cookie) but does not implement any Cross-Site Request Forgery (CSRF) protection.
*   **Risk:** Users could be tricked into performing unintended actions on the site.

---

## 2. Logic and Configuration Errors

### 2.1 Schema Type Mismatch
*   **Location:** `backend/models/user.js`
*   **Description:** The `is_admin` field is defined as type `String`, but it is assigned a boolean default value (`false`).
*   **Impact:** Potential for data inconsistency and type-related bugs in queries.

### 2.2 Inconsistent Error Handling
*   **Location:** Various files in `backend/routes/`
*   **Description:** Many route handlers have empty `catch` blocks or only use `console.log` for error reporting.
*   **Impact:** Failures might go unnoticed by the client, leading to a poor user experience and difficult debugging.

### 2.3 Hardcoded Database Connection
*   **Location:** `backend/index.js`
*   **Description:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
*   **Impact:** Difficulty in deploying the application across different environments (development, staging, production).

---

## 3. Frontend and Project Structure

### 3.1 Directory Misspelling
*   **Description:** The frontend directory is incorrectly named `frondend` in the repository root.

### 3.2 Failing Unit Tests
*   **Location:** `frondend/jwtapp/`
*   **Description:** 12 out of 14 Angular unit tests are currently failing. The primary cause is `NullInjectorError` (missing providers for `HttpClient`, `Router`, and `Store`).

### 3.3 Unimplemented Features
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
*   **Description:** The search bar in the user list UI is a placeholder and lacks the corresponding logic in the TypeScript component to filter the results.
