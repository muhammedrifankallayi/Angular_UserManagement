# Bug Report

This report documents identified bugs, security vulnerabilities, and technical issues within the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
*   **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
*   **Issue:** The JWT secret "secret" is hardcoded in the source code instead of using environment variables.
*   **Risk:** Unauthorized parties can easily forge JWT tokens if they gain access to the source code.

### 1.2 Sensitive Data Exposure
*   **Location:** `backend/routes/adminroute.js` (Endpoint: `GET /api/admin/users`)
*   **Issue:** The endpoint returns the entire user object from the database, including hashed passwords. The logic to exclude passwords is currently commented out.
*   **Risk:** Exposure of password hashes increases the risk of brute-force attacks on user accounts.

### 1.3 Missing Authentication Middleware
*   **Location:** `backend/routes/adminroute.js`
*   **Issue:** Routes like `/users`, `/deleteUser/:id`, and `/editUser` do not have centralized authentication or authorization middleware. Although some check for the "jwt" cookie internally, it's inconsistent.
*   **Risk:** Potential for unauthorized access to administrative functions.

### 1.4 Admin Session Overwrite on User Creation
*   **Location:** `backend/routes/adminroute.js` (Endpoint: `POST /api/admin/createuser`)
*   **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for that new user, effectively logging out the administrator.
*   **Risk:** Disruption of administrative workflow.

### 1.5 Insecure Password Storage (is_admin field)
*   **Location:** `backend/models/user.js`
*   **Issue:** The `is_admin` field is defined as a `String` but has a default value of `false` (boolean).
*   **Risk:** Inconsistent data types can lead to logic errors in authorization checks.

## 2. Functional Bugs

### 2.1 Non-functional Search Feature
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
*   **Issue:** The search input field is present in the UI but is not bound to any component logic. Typing in it has no effect on the user list.

### 2.2 Incorrect HttpClient configuration
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (deleteUser method)
*   **Issue:** `withCredentials: true` is passed as the second argument (the body) to `this.http.post`, but it should be part of the third argument (options).
*   **Risk:** Authentication cookies may not be sent correctly with the request.

## 3. Technical Issues

### 3.1 Broken Unit Tests
*   **Location:** `frondend/jwtapp/`
*   **Issue:** 12 out of 14 Angular unit tests are failing. Most failures are due to `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` is missing from the test configurations.

### 3.2 Directory Misspelling
*   **Location:** Root directory
*   **Issue:** The frontend directory is named `frondend` instead of `frontend`.

### 3.3 Empty Catch Blocks
*   **Location:** Multiple files in `backend/routes/`
*   **Issue:** Several try-catch blocks have empty catch sections or only `console.log(error.message)`, which can hide significant failures during execution.
