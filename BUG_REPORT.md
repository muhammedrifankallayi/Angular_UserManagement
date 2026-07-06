# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, and infrastructure issues identified in the JWT Project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The JWT signing and verification processes use a hardcoded string `"secret"` instead of using an environment variable (e.g., `process.env.jwtsecret`).
- **Impact:** Compromises the security of the tokens if the source code is exposed.

### 1.2 Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack middleware to verify if the requester is authenticated and has administrative privileges.
- **Impact:** Unauthenticated users can potentially perform administrative actions.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Route: `/users`)
- **Description:** The API endpoint returns the entire user object from the database, including the `password` hash.
- **Impact:** Exposure of password hashes increases the risk of brute-force attacks if the data is intercepted or leaked.

### 1.4 Lack of CSRF Protection
- **Location:** `backend/index.js`
- **Description:** While CORS is configured to allow credentials from `http://localhost:4200`, there is no CSRF (Cross-Site Request Forgery) protection implemented.
- **Impact:** Users could be vulnerable to CSRF attacks if they visit malicious websites while authenticated.

## 2. Logic Errors

### 2.1 Admin Session Overwritten on User Creation
- **Location:** `backend/routes/adminroute.js` (Route: `/createuser`)
- **Description:** When an administrator creates a new user, the backend generates a JWT for the *newly created user* and sets it as a cookie.
- **Impact:** This overwrites the administrator's own session cookie, effectively logging them out or switching their session to the new user.

### 2.2 Incorrect HttpClient.post Usage in Frontend
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** Calls to `this.http.post` pass the request options (containing `withCredentials: true`) as the second argument (the body) instead of the third.
- **Impact:** Requests may fail or not include credentials correctly because the options are treated as the request body.

### 2.3 Missing File Existence Check in Upload
- **Location:** `backend/routes/routes.js` (Route: `/profile-upload-single`)
- **Description:** The code accesses `req.file.filename` without first verifying that `req.file` exists.
- **Impact:** The server will crash with a `TypeError` if a request is made to this endpoint without an attached file.

### 2.4 Non-functional Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Description:** The search input in the Admin User List is static HTML and lacks implementation in the component logic and NgRx selectors.
- **Impact:** The search feature does not work for end-users.

## 3. Infrastructure and Maintenance Issues

### 3.1 Misspelled Frontend Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusing for developers and potentially breaks automated scripts expecting standard naming.

### 3.2 Hardcoded MongoDB Connection String
- **Location:** `backend/index.js`
- **Description:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact:** Makes it difficult to deploy the application to different environments without modifying the source code.

### 3.3 Poor Error Handling
- **Location:** Throughout `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Description:** Numerous `try-catch` blocks are either empty or only log the error to the console without sending an appropriate error response to the client.
- **Impact:** The client is left hanging or receives no information when a server-side error occurs.

### 3.4 Data Type Inconsistency for `is_admin`
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as a `String` with a default value of `false` (Boolean). It is inconsistently used as both a String and a Boolean.
- **Impact:** Potential for logic errors and unexpected behavior during database queries and comparisons.

## 4. Testing Issues

### 4.1 Failing Frontend Unit Tests
- **Location:** `frondend/jwtapp/`
- **Description:** 12 out of 14 unit tests are currently failing. The primary cause is `NullInjectorError` due to missing providers for `HttpClient`, `Router`, and `MockStore` in the test suites.
- **Impact:** Regression testing is ineffective, and code reliability cannot be guaranteed.
