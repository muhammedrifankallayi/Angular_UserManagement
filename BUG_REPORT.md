# Bug Report - JWT Project

This report documents identified security vulnerabilities, logic errors, structural issues, and test failures in the application.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** The JWT signing and verification use a hardcoded string `"secret"` instead of environment variables (e.g., `process.env.jwtsecret`).
- **Risk:** High. If the source code is compromised, an attacker can forge valid JWT tokens.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack middleware to verify if the user is authenticated and has administrative privileges.
- **Risk:** Critical. Any user (or unauthenticated attacker) can perform administrative actions if they know the endpoint URL.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` - `/users` endpoint.
- **Issue:** The endpoint returns all user data, including the hashed `password` field.
- **Risk:** High. Hashed passwords should never be sent to the client.

### 1.4 Lack of CSRF Protection
- **Issue:** The application uses cookies for authentication but does not implement Cross-Site Request Forgery (CSRF) protection.
- **Risk:** Medium.

---

## 2. Logic Errors

### 2.1 Administrator Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` - `/createuser` endpoint.
- **Issue:** When an administrator creates a new user, the backend generates a JWT for the *new* user and sets it in the cookie, effectively logging the administrator out and logging them in as the new user.
- **Impact:** Disruptive for administrative workflows.

### 2.2 Incorrect Angular HttpClient POST Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`.
- **Issue:** `http.post` is called with options (like `{withCredentials: true}`) as the second argument. In Angular, the second argument for `post` is the request body, and options should be the third argument.
- **Example:** `this.http.post(url, {withCredentials: true})` should be `this.http.post(url, {}, {withCredentials: true})`.

### 2.3 Unsafe File Upload
- **Location:** `backend/routes/routes.js` - `/profile-upload-single` endpoint.
- **Issue:** The code accesses `req.file.filename` without verifying if `req.file` exists. If a request is made without a file, the server will crash.

### 2.4 Non-functional Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`.
- **Issue:** The search input is a static HTML element with no `ngModel` or event binding, and no implementation exists in the component or state management.

### 2.5 Type Inconsistency in User Model
- **Location:** `backend/models/user.js`.
- **Issue:** The `is_admin` field is defined as `type: String`, but it is given a default value of `false` (boolean) and likely intended to be used as a boolean throughout the application.

---

## 3. Structural and Operational Issues

### 3.1 Misspelled Frontend Directory
- **Issue:** The main frontend directory is named `frondend` instead of `frontend`.

### 3.2 Poor Error Handling
- **Location:** Backend routes.
- **Issue:** Many `catch` blocks are empty or only `console.log` the error without sending a proper error response (e.g., 500 Internal Server Error) to the client. This leaves the frontend hanging or receiving successful status codes for failed operations.

### 3.3 Hardcoded Database Connection String
- **Location:** `backend/index.js`.
- **Issue:** The MongoDB URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.

---

## 4. Test Failures

### 4.1 Frontend Unit Test Failures
- **Status:** 12 out of 14 tests failed.
- **Root Cause:** `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
- **Description:** Most component spec files do not import `HttpClientTestingModule` or `RouterTestingModule`, nor do they provide a mock `Store` for NgRx.
- **Affected Components:** `LoginComponent`, `HomeComponent`, `AdminNavComponent`, `AdminUsereditComponent`, `NavComponent`, `AdminCreateuserComponent`, `RegisterComponent`, `ProfileComponent`, etc.
