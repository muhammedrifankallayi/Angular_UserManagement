# Bug Report

This report documents the security vulnerabilities, logic errors, and architectural issues identified in the JWT Project.

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secrets
- **Description:** The JWT signing and verification process uses a hardcoded secret string `"secret"` instead of an environment variable.
- **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Impact:** High. If the source code is compromised, an attacker can easily forge JWT tokens.

### 1.2. Missing Authentication and Authorization on Admin Routes
- **Description:** Several administrative routes lack middleware to verify if the user is authenticated and has administrative privileges.
- **Affected Endpoints:**
    - `GET /api/admin/users`
    - `POST /api/admin/deleteUser/:id`
    - `POST /api/admin/editDetails/:id`
    - `POST /api/admin/editUser`
    - `POST /api/admin/createuser`
- **Impact:** Critical. Any user (or unauthenticated attacker) can perform administrative actions like deleting or creating users.

### 1.3. Exposure of Sensitive Information
- **Description:** The endpoint to list users returns the entire user object, including the hashed password.
- **Affected Endpoint:** `GET /api/admin/users`
- **Impact:** High. Exposure of password hashes facilitates offline brute-force attacks.

### 1.4. Lack of CSRF Protection
- **Description:** The application uses cookie-based authentication and has CORS enabled with `credentials: true`, but does not implement Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Medium/High. Authenticated users could be tricked into performing unintended actions on the site.

---

## 2. Logic Errors

### 2.1. Type Inconsistency in User Schema
- **Description:** The `is_admin` field in the Mongoose User model is defined as a `String`, but it is assigned a boolean default value (`false`) and is used as a boolean in some queries.
- **Affected File:** `backend/models/user.js`

### 2.2. Session Overwrite in Admin User Creation
- **Description:** When an administrator creates a new user via the `/api/admin/createuser` endpoint, the server generates a new JWT for the *newly created user* and sets it in the `jwt` cookie.
- **Affected File:** `backend/routes/adminroute.js`
- **Impact:** Medium. The administrator is effectively logged out and logged in as the new user after creating them.

### 2.3. Unchecked File Uploads
- **Description:** The profile image upload route attempts to access `req.file.filename` without verifying if a file was actually uploaded.
- **Affected File:** `backend/routes/routes.js`
- **Impact:** Low/Medium. Can lead to server crashes or unhandled exceptions if the `image` field is missing in the request.

### 2.4. Poor Error Handling
- **Description:** Many routes in the backend contain empty `catch` blocks or simply log errors to the console without sending an appropriate error response to the client.

---

## 3. Architectural and Frontend Issues

### 3.1. Misspelled Directory Name
- **Description:** The root directory for the frontend is misspelled as `frondend/` instead of `frontend/`.

### 3.2. Incorrect HttpClient Usage in Frontend
- **Description:** In some admin components, `HttpClient.post` is called with the request options (like `{ withCredentials: true }`) as the second argument (the body), which is incorrect.
- **Affected Components:** `AdminUserlistComponent`, `AdminUsereditComponent`

### 3.3. Non-functional Admin Search
- **Description:** The search functionality in the administrator's user list is not implemented; it is currently static HTML.

---

## 4. Test Status

### 4.1. Frontend Unit Tests
- **Status:** 12 out of 14 unit tests in `frondend/jwtapp/` are currently failing.
- **Primary Causes:**
    - `NullInjectorError: No provider for HttpClient!`
    - `No provider for Router!`
- **Required Fixes:** Integration of `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore` in component spec files.
