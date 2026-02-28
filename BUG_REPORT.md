# Bug Report - JWT App

This report documents identified bugs and vulnerabilities in the JWT application, covering both backend and frontend components.

## 1. Security Vulnerabilities

### 1.1. Missing Authentication/Authorization on Admin Routes
*   **Location:** `backend/routes/adminroute.js`
*   **Severity:** Critical
*   **Description:** Several administrative endpoints lack any form of authentication or authorization checks. An attacker could potentially perform administrative actions without being logged in as an admin.
*   **Affected Endpoints:**
    *   `GET /api/admin/users`
    *   `POST /api/admin/deleteUser/:id`
    *   `POST /api/admin/editDetails/:id`
    *   `POST /api/admin/editUser`
    *   `POST /api/admin/createuser`
*   **Suggested Fix:** Implement an authentication middleware that verifies the JWT and checks the `is_admin` flag before allowing access to these routes.

### 1.2. Admin User Creation Overwrites Session
*   **Location:** `backend/routes/adminroute.js` - `POST /createuser`
*   **Severity:** Medium
*   **Description:** When an admin creates a new user, the backend generates a JWT for the *newly created user* and sets it in the `jwt` cookie. This effectively logs out the admin and logs them in as the new user.
*   **Suggested Fix:** Remove the code that signs a new token and sets the cookie in the `createuser` route.

### 1.3. Hardcoded JWT Secret
*   **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
*   **Severity:** Medium
*   **Description:** The secret key used for signing and verifying JWTs is hardcoded as `"secret"`.
*   **Suggested Fix:** Use an environment variable (e.g., `process.env.JWT_SECRET`) to store the secret key.

---

## 2. Logic and Data Model Issues

### 2.1. `is_admin` Type Mismatch
*   **Location:** `backend/models/user.js`
*   **Severity:** Medium
*   **Description:** The `is_admin` field is defined as `type: String` with a default of `false` (boolean). However, the admin login route queries for `is_admin: true` (boolean).
*   **Suggested Fix:** Change the type in the Mongoose schema to `Boolean`.

### 2.2. Inadequate Error Handling
*   **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
*   **Severity:** Low
*   **Description:** Many `try-catch` blocks are empty or only log to the console. If an error occurs, the request may hang as no response is sent to the client.
*   **Suggested Fix:** Ensure all catch blocks return an appropriate error status (e.g., 500) and a message.

---

## 3. Frontend Issues

### 3.1. Incorrect `HttpClient.post` Usage
*   **Location:**
    *   `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
    *   `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
*   **Severity:** High
*   **Description:** The `HttpClient.post` method signature is `post(url, body, options)`. In these locations, `withCredentials: true` is passed as the second argument (the body), instead of the third argument (options). This prevents the authentication cookie from being sent.
*   **Suggested Fix:** Pass `null` or an empty object as the second argument if no body is required: `this.http.post(url, {}, { withCredentials: true })`.

### 3.2. Directory Naming Typo
*   **Location:** Root directory
*   **Severity:** Low
*   **Description:** The frontend directory is misspelled as `frondend`.
*   **Suggested Fix:** Rename the directory to `frontend`.
