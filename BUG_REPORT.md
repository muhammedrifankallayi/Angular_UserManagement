# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
The JWT secret is hardcoded as `"secret"` in multiple files instead of using environment variables.
- **Files affected:** `backend/routes/routes.js`, `backend/routes/adminroute.js`.
- **Recommendation:** Use `process.env.jwtsecret` as intended (referenced in `.env`).

### 1.2 Missing Authentication/Authorization Middleware
Administrative routes in `backend/routes/adminroute.js` lack middleware to verify if the requester is authenticated and has administrator privileges.
- **Exposed Routes:** `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`.
- **Recommendation:** Implement and apply an `auth` and `isAdmin` middleware to these routes.

### 1.3 Sensitive Data Exposure
The administrative user list endpoint returns sensitive information that should not be exposed to the frontend.
- **Endpoint:** `/api/admin/users`.
- **Issue:** The response includes the `password` field (hashed) for all users.
- **Recommendation:** Exclude the `password` field from the database query or filter it out before sending the response.

### 1.4 Lack of CSRF Protection
The application uses cookies for authentication but does not implement any Cross-Site Request Forgery (CSRF) protection.

---

## 2. Backend Logic Errors

### 2.1 Schema Type Inconsistency
In `backend/models/user.js`, the `is_admin` field is defined as a `String`, but it is assigned a boolean default value (`false`).
- **Recommendation:** Change the type to `Boolean`.

### 2.2 Admin Session Overwriting
In `backend/routes/adminroute.js`, the `/createuser` endpoint sets a new JWT cookie for the newly created user.
- **Issue:** If an administrator creates a user, their own session cookie is overwritten by the new user's token, effectively logging the admin out.
- **Recommendation:** Remove the `res.cookie` call from the `createuser` logic.

### 2.3 Unsafe File Upload
The file upload route does not verify if a file was actually uploaded before attempting to access its properties.
- **Endpoint:** `/profile-upload-single` in `backend/routes/routes.js`.
- **Issue:** Accesses `req.file.filename` which will throw an error if `req.file` is undefined.
- **Recommendation:** Add a check for `req.file`.

### 2.4 Poor Error Handling
Many routes in the backend contain empty `catch` blocks or do not send an appropriate error response to the client when an exception occurs.

---

## 3. Frontend Issues

### 3.1 Misspelled Directory Name
The frontend directory is misspelled as `frondend` instead of `frontend`.

### 3.2 Incorrect HttpClient Usage
In several components (e.g., `AdminUserlistComponent`, `AdminUsereditComponent`), `HttpClient.post` is called with request options passed as the second argument (the body) instead of the third.
- **Example:** `this.http.post(url, {withCredentials:true})` instead of `this.http.post(url, {}, {withCredentials:true})`.

### 3.3 Non-functional Search
The search input in the Admin User List component is static HTML and has no backing implementation in the TypeScript component or NgRx state.

### 3.4 Unit Test Failures
Currently, 12 out of 14 frontend unit tests are failing.
- **Primary Cause:** `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
- **Recommendation:** Update test suites to include `HttpClientTestingModule` and `RouterTestingModule`.
