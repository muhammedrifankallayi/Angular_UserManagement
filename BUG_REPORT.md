# Bug Report

This report documents the security vulnerabilities, logic errors, and infrastructure issues identified in the JWT Project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
*   **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
*   **Description:** The JWT signing and verification processes use a hardcoded secret string `"secret"` instead of an environment variable (e.g., `process.env.jwtsecret`).
*   **Impact:** Highly insecure; if the source code is compromised, the secret is exposed, allowing attackers to forge tokens.

### 1.2 Missing Authentication/Authorization Middleware in Admin Routes
*   **Location:** `backend/routes/adminroute.js`
*   **Description:** Several admin endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is an authenticated administrator.
*   **Impact:** Unauthorized users can perform administrative actions such as deleting or editing other users.

### 1.3 Sensitive Data Exposure
*   **Location:** `backend/routes/adminroute.js` (specifically the `/users` endpoint)
*   **Description:** The user list returned by the `/api/admin/users` endpoint includes the hashed `password` field.
*   **Impact:** Exposure of password hashes increases the risk of brute-force attacks if the data is intercepted.

### 1.4 Type Inconsistency for `is_admin` Field
*   **Location:** `backend/models/user.js`
*   **Description:** The `is_admin` field is defined as `type: String` but given a boolean default `false`.
*   **Impact:** Potential for type-related bugs and inconsistency in how administrator status is checked.

### 1.5 Lack of CSRF Protection
*   **Location:** Backend configuration (`backend/index.js`)
*   **Description:** The application uses cookies for authentication (`credentials: true`) but does not implement Cross-Site Request Forgery (CSRF) protection.
*   **Impact:** Users could be tricked into performing unintended actions on the site.

## 2. Logic Errors

### 2.1 Administrator Session Overwrite on User Creation
*   **Location:** `backend/routes/adminroute.js` (endpoint `/createuser`)
*   **Description:** When an administrator creates a new user, the backend generates a JWT for the *new* user and sets it as a cookie.
*   **Impact:** The administrator's own session cookie is overwritten, effectively logging them out as admin and logging them in as the newly created user.

### 2.2 Incorrect HttpClient.post Usage in Frontend
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
*   **Description:** `http.post` calls are passing the options object (containing `withCredentials: true`) as the second argument (the request body) instead of the third argument.
*   **Impact:** Authentication cookies are not sent with these requests, and the body sent to the backend is incorrect.

### 2.3 Unsafe File Upload
*   **Location:** `backend/routes/routes.js` (endpoint `/profile-upload-single`)
*   **Description:** The code accesses `req.file.filename` without checking if `req.file` exists.
*   **Impact:** If a request is made without a file, the server will crash due to a null pointer exception.

### 2.4 Poor Error Handling
*   **Location:** Throughout `backend/routes/routes.js` and `backend/routes/adminroute.js`
*   **Description:** Many `try-catch` blocks are either empty or only `console.log` the error without sending a proper error response to the client.
*   **Impact:** The frontend may hang or receive no feedback when an error occurs on the backend.

## 3. UI/UX Issues

### 3.1 Non-functional Search
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
*   **Description:** The search input is a static HTML element with no implementation in the component logic or state management.
*   **Impact:** Administrators cannot search for users in the user list.

## 4. Infrastructure and Maintenance

### 4.1 Misspelled Directory
*   **Location:** Root directory
*   **Description:** The frontend directory is misspelled as `frondend`.

### 4.2 Failing Frontend Unit Tests
*   **Location:** `frondend/jwtapp/`
*   **Description:** Most unit tests (12 out of 14) are failing due to missing providers (`HttpClient`, `Router`, `MockStore`) in the test configuration.

### 4.3 Hardcoded Database Connection String
*   **Location:** `backend/index.js`
*   **Description:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
