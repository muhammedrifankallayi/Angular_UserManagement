# Bug Report - JWT Project

This report documents the security vulnerabilities, logical errors, and infrastructure issues identified in the JWT Project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret is hardcoded as `"secret"`.
- **Risk:** High. An attacker can easily forge JWT tokens if the secret is known.
- **Recommendation:** Use environment variables (e.g., `process.env.JWT_SECRET`) to store the secret.

### 1.2 Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several admin routes (e.g., `/api/admin/users`, `/api/admin/deleteUser/:id`) lack authentication and authorization middleware.
- **Risk:** High. Any user or unauthenticated attacker can access and modify user data.
- **Recommendation:** Implement and apply middleware to verify JWT and check for admin privileges.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Endpoint: `/api/admin/users`)
- **Issue:** The endpoint returns all user data, including hashed passwords, because the exclusion logic is commented out.
- **Risk:** High. Hashed passwords should never be sent to the frontend.
- **Recommendation:** Uncomment the exclusion logic or use `.select('-password')` in the Mongoose query.

---

## 2. Logical Bugs

### 2.1 Admin Search Functionality Not Implemented
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue:** The search input in the HTML template is not bound to any logic in the TypeScript component.
- **Recommendation:** Implement a filter pipe or a search function in the component to filter the `userdata$` observable.

### 2.2 Incorrect HttpClient Arguments
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (and possibly others)
- **Issue:** `HttpClient.post` is called with `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (options).
- **Impact:** Credentials (cookies) are not sent with the request, and the string `{ withCredentials: true }` is sent as the body.
- **Recommendation:** Correct the `post` calls to: `this.http.post(url, {}, { withCredentials: true })`.

### 2.3 Administrative Session Overwrite
- **Location:** `backend/routes/adminroute.js` (Endpoint: `/api/admin/createuser`)
- **Issue:** When an admin creates a new user, a new JWT is issued for the *new* user and stored in the cookie, overwriting the admin's session.
- **Impact:** The admin is effectively logged out and replaced by the newly created user session.
- **Recommendation:** Do not issue a new JWT cookie when creating a user from the admin panel.

### 2.4 Model Type Mismatch
- **Location:** `backend/models/user.js`
- **Issue:** `is_admin` is defined as a `String` type but has a default value of `false` (boolean).
- **Recommendation:** Change the type to `Boolean`.

---

## 3. Project Structure and Infrastructure

### 3.1 Typo in Frontend Directory Name
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** This is unprofessional and can lead to confusion or broken scripts.

### 3.2 Unit Test Failures
- **Location:** `frondend/jwtapp/`
- **Issue:** 12 out of 14 Angular unit tests fail.
- **Cause:** Most failures are `NullInjectorError: No provider for HttpClient!`.
- **Recommendation:** Add `HttpClientTestingModule` to the `imports` array in the test bed configuration for each failing component spec.

---

## 4. Current Test State

Ran Angular tests on Sun May 17 15:35:44 UTC 2026:
- **Total:** 14
- **Passed:** 2
- **Failed:** 12
