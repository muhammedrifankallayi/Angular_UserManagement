# Bug Report

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Description:** The JWT secret is hardcoded as `"secret"` in multiple locations instead of using environment variables.
- **Affected Files:**
  - `backend/routes/adminroute.js`: Lines 25, 54, 150
  - `backend/routes/routes.js`: Lines 36, 62, 78, 106, 127
- **Suggested Fix:** Replace hardcoded strings with `process.env.jwtsecret`.

### 1.2 Missing Authentication/Authorization Middleware
- **Description:** Several administrative routes lack middleware to verify if the requester is authenticated and has administrator privileges.
- **Affected File:** `backend/routes/adminroute.js`
- **Affected Routes:**
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editDetails/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`
- **Suggested Fix:** Implement and apply an `auth` middleware to these routes.

### 1.3 Sensitive Data Exposure
- **Description:** The `GET /api/admin/users` endpoint returns the entire user object, including the hashed password.
- **Affected File:** `backend/routes/adminroute.js` (Line 72)
- **Suggested Fix:** Exclude the `password` field from the database query or filter it out before sending the response.

---

## 2. Logic Errors

### 2.1 Admin Session Overwrite
- **Description:** When an administrator creates a new user via `/api/admin/createuser`, the backend generates a new JWT for the *created* user and sets it as the "jwt" cookie, effectively logging the admin out and logging them in as the new user.
- **Affected File:** `backend/routes/adminroute.js` (Lines 152-155)
- **Suggested Fix:** Remove the code that sets the JWT cookie in the `createuser` route.

### 2.2 Model Type Inconsistency
- **Description:** The `is_admin` field in the User model is defined as a `String` but initialized with a boolean `false`.
- **Affected File:** `backend/models/user.js` (Line 20)
- **Suggested Fix:** Change the type to `Boolean`.

### 2.3 Poor Error Handling
- **Description:** Many backend routes have empty `catch` blocks or only `console.log` errors without sending a proper error response to the client, leading to hung requests or opaque failures.
- **Affected Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`

---

## 3. UI and Frontend Issues

### 3.1 Non-functional Search
- **Description:** The search input in the Admin User List is a static HTML element with no backing logic in the component.
- **Affected File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (Line 4)

### 3.2 Incorrect HttpClient.post Arguments
- **Description:** In several places, `http.post` is called with request options (like `{ withCredentials: true }`) as the second argument (the request body) instead of the third.
- **Affected Files:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`: `deleteUser` method.
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`: `getusers` method.

### 3.3 Directory Misspelling
- **Description:** The frontend directory is named `frondend` instead of `frontend`.

---

## 4. Testing Failures

- **Current Status:** 12 FAILED, 2 SUCCESS (out of 14 tests)
- **Primary Cause:** `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
- **Affected Components:** DashboardComponent, RegisterComponent, ProfileComponent, AdminLoginComponent, AdminCreateuserComponent, LoginComponent, AdminUsereditComponent, HomeComponent, etc.
- **Suggested Fix:** Update spec files to include `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.
