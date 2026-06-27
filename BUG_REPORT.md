# Bug Report - JWT Project

This report documents identified security vulnerabilities, logic errors, and frontend issues found in the JWT project codebase.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** The JWT signing and verification processes use a hardcoded string `"secret"` instead of utilizing the environment variable `process.env.jwtsecret` defined in `.env`.
- **Impact:** Compromises the security of the tokens if the source code is exposed.

### 1.2 Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack any middleware to verify the user's identity via JWT or to authorize only administrative users.
- **Impact:** Any unauthenticated user can perform administrative actions like deleting or editing users.

### 1.3 Sensitive Information Exposure
- **Location:** `backend/routes/adminroute.js` (specifically the `/users` endpoint)
- **Description:** The `/api/admin/users` route returns the entire user document from MongoDB, including the hashed `password` field.
- **Impact:** Exposes password hashes of all users to anyone who accesses the endpoint.

### 1.4 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Description:** While the application uses cookies for authentication and has CORS enabled with `credentials: true`, it lacks protection against Cross-Site Request Forgery (CSRF).
- **Impact:** Potential for unauthorized actions performed on behalf of an authenticated user.

---

## 2. Backend Logic Errors

### 2.1 Administrator Session Overwriting
- **Location:** `backend/routes/adminroute.js` (the `/createuser` endpoint)
- **Description:** When an administrator creates a new user, the backend generates a JWT for the *newly created* user and sets it in the response cookie.
- **Impact:** This overwrites the administrator's own session cookie, effectively logging them out and logging them in as the new user.

### 2.2 Unhandled File Upload Exceptions
- **Location:** `backend/routes/routes.js` (the `/profile-upload-single` endpoint)
- **Description:** The code accesses `req.file.filename` without checking if a file was actually uploaded (`req.file` could be undefined).
- **Impact:** The server will crash or return a 500 error if an upload request is made without a file.

### 2.3 Mongoose Schema Type Inconsistency
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as `type: String` but has a default value of `false` (a boolean).
- **Impact:** Leads to inconsistent data types in the database and potential logic errors during authorization checks.

### 2.4 Poor Error Handling
- **Location:** Throughout `backend/routes/routes.js` and `backend/routes/adminroute.js`.
- **Description:** Many `catch` blocks are either empty or only `console.log` the error without sending an error response to the client.
- **Impact:** Client requests may hang or fail silently, making debugging difficult.

---

## 3. Frontend Issues

### 3.1 Incorrect HttpClient Usage
- **Location:** `AdminUserlistComponent` and `AdminUsereditComponent`
- **Description:** `this.http.post` calls are passing the options object (containing `withCredentials: true`) as the second argument. In Angular's `HttpClient.post`, the second argument is the request body, and options should be the third argument.
- **Impact:** The backend receives the options object as the body, and the actual intended options are ignored.

### 3.2 Non-functional Admin User Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Description:** The search input in the admin user list is present in the HTML but has no implementation in the TypeScript component or state management.
- **Impact:** Users cannot search for specific users in the list.

### 3.3 Unit Test Failures
- **Location:** `frondend/jwtapp/`
- **Description:** Most frontend unit tests (12 out of 14) are failing, primarily due to missing providers for `HttpClient`, `Router`, and the NgRx `Store`.
- **Impact:** Lack of automated verification for frontend changes.

### 3.4 Misspelled Directory
- **Location:** Root directory
- **Description:** The frontend directory is misspelled as `frondend`.
- **Impact:** Minor inconvenience and inconsistent naming conventions.
