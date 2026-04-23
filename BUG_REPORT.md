# BUG REPORT

This report documents several critical security vulnerabilities, logic errors, and architectural issues identified in the JWT-based user management application.

## 1. Security Vulnerabilities

### 1.1 Sensitive Data Leakage
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `GET /api/admin/users`
- **Issue:** The endpoint returns all fields for every user in the database. The logic to exclude passwords is currently commented out, leading to the leakage of bcrypt-hashed passwords.

### 1.2 Hardcoded JWT Secret
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` directly in the `jwt.sign` and `jwt.verify` calls, ignoring the `.env` configuration. This makes the system highly vulnerable if the source code is compromised.

### 1.3 Missing Administrative Middleware
- **Files:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`) do not verify if the requester has a valid administrator session. While some use `jwt.verify` locally, many lack any form of protection or centralized middleware.

### 1.4 Session Overwrite during User Creation
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `POST /api/admin/createuser`
- **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user. Since both use the `jwt` cookie name, this overwrites the administrator's session, effectively logging them out and into the new user's account.

### 1.5 Missing CSRF Protection
- **Issue:** The application uses cookie-based authentication but lacks Cross-Site Request Forgery (CSRF) protection, leaving users vulnerable to unauthorized actions performed on their behalf.

## 2. Logic and Frontend Errors

### 2.1 Broken Search Functionality
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field in the Admin User List is a plain HTML input with no data binding (`ngModel`) or event listeners. Consequently, the search feature is entirely non-functional.

### 2.2 Incorrect HttpClient Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** In several `http.post` calls (e.g., `deleteUser`, `editDetails`), the options object (containing `withCredentials: true`) is passed as the second argument. In Angular's `HttpClient.post`, the second argument is the request body, and options should be the third. This results in credentials not being sent in the actual request.

### 2.3 Type Inconsistency in Model
- **File:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean). This type mismatch can lead to unpredictable behavior in database queries and application logic.

## 3. Environment and Configuration Issues

### 3.1 Directory Misspelling
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** There is no `start` script defined, requiring manual invocation via `node index.js`.

### 3.3 Failing Frontend Unit Tests
- **Issue:** Angular unit tests are failing due to missing providers in the test suites (e.g., `HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`).
