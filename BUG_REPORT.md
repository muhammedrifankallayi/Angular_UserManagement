# Bug Report - JWT Project

This report documents the security vulnerabilities, logic errors, and technical debt found in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
*   **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
*   **Description:** The application uses a hardcoded string `"secret"` as the JWT secret for both signing and verification. This should be retrieved from the environment variable `process.env.jwtsecret` as defined in the `.env` file.

### 1.2 Missing Administrative Authorization
*   **Location:** `backend/routes/adminroute.js`
*   **Description:** Several administrative routes, including `/users`, `/deleteUser/:id`, and `/editDetails/:id`, do not implement any authentication or authorization middleware. This allows unauthenticated users to access and modify user data if they know the endpoint.

### 1.3 Sensitive Data Exposure
*   **Location:** `backend/routes/adminroute.js` (Route: `/users`)
*   **Description:** The API returns the entire user object, including the hashed `password` field, when fetching the list of users. This is a major security risk.

### 1.4 Lack of CSRF Protection
*   **Location:** `backend/index.js`
*   **Description:** The backend allows credentials from `http://localhost:4200` but does not implement any Cross-Site Request Forgery (CSRF) protection mechanisms.

---

## 2. Logic Errors

### 2.1 Type Inconsistency in User Model
*   **Location:** `backend/models/user.js`
*   **Description:** The `is_admin` field is defined as a `String` type, but its default value is set to the boolean `false`. This causes inconsistency and potential issues during type-checking or comparisons.

### 2.2 Admin Session Hijacking in User Creation
*   **Location:** `backend/routes/adminroute.js` (Route: `/createuser`)
*   **Description:** When an administrator creates a new user, the backend generates a new JWT for the *newly created* user and sets it as the "jwt" cookie. This overwrites the administrator's own session cookie, logging them out and effectively logging them in as the new user.

### 2.3 Incorrect Angular HttpClient usage
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
*   **Description:** The `HttpClient.post` calls in these components pass the options object (containing `withCredentials: true`) as the second argument (which is reserved for the request body) instead of the third argument. This results in the options being sent as the payload and `withCredentials` being ignored.

### 2.4 Missing File Existence Check
*   **Location:** `backend/routes/routes.js` (Route: `/profile-upload-single`)
*   **Description:** The route attempts to access `req.file.filename` without verifying if `req.file` exists, which could lead to a server crash if an upload fails or is bypassed.

### 2.5 Poor Error Handling
*   **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
*   **Description:** Many routes have empty `catch` blocks or only log errors to the console without sending appropriate error status codes (e.g., 500) or messages back to the client.

---

## 3. Technical Debt

### 3.1 Directory Misspelling
*   **Location:** Root directory
*   **Description:** The frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Non-functional Search Feature
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
*   **Description:** The search input in the users list is static HTML. There is no corresponding logic in the component or NgRx selectors to filter the user list.

### 3.3 Failing Unit Tests
*   **Location:** `frondend/jwtapp/`
*   **Description:** 12 out of 14 Angular unit tests are currently failing, mostly due to missing providers for `HttpClient`, `Router`, and `Store` in the test configurations.

### 3.4 Hardcoded Infrastructure Configuration
*   **Location:** `backend/index.js`
*   **Description:** The MongoDB connection string (`mongodb://127.0.0.1:27017/jwtproject`) is hardcoded instead of being environment-driven.
