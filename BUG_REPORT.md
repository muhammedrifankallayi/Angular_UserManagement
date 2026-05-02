# Bug Report - JWT App

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** The JWT secret is hardcoded as `"secret"` in multiple files. Although a `.env` file exists with `jwtsecret="secret"`, it is not being used in the code.
- **Impact:** Compromises the security of the tokens if the source code is exposed.

### 1.2 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Endpoint: `/api/admin/users`)
- **Description:** The code that excludes the password from the user list is commented out.
- **Impact:** Administrative users (or anyone with access to this endpoint) can see the hashed passwords of all users.

### 1.3 Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Many administrative endpoints (like `/users`, `/deleteUser/:id`, `/editUser`, etc.) do not have authentication middleware to verify if the requester is an admin.
- **Impact:** Potential unauthorized access to administrative functions.

### 1.4 Admin Session Overwrite
- **Location:** `backend/routes/adminroute.js` (Endpoint: `/api/admin/createuser`)
- **Description:** When an admin creates a new user, the backend issues a new JWT cookie for the newly created user, overwriting the admin's own session cookie.
- **Impact:** The administrator is effectively logged out and logged in as the new user upon creating them.

---

## 2. Logic Errors

### 2.1 Incorrect `HttpClient.post` Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (Method: `deleteUser`)
- **Description:** The `withCredentials: true` option is passed as the second argument (the body) instead of the third argument (options).
- **Impact:** Cookies are not sent with the request, likely causing authentication failure on the backend.

### 2.2 Non-functional Search Bar
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** There is a search input in the template, but it is not bound to any component logic or filtering mechanism for the `userdata$` observable.
- **Impact:** The search functionality does not work for the user.

### 2.3 Mongoose Schema Type Mismatch
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as `type: String`, but its default value is `false` (a boolean).
- **Impact:** Inconsistent data types in the database.

---

## 3. Miscellaneous Issues

### 3.1 Directory Naming Typo
- **Location:** Root directory
- **Description:** The frontend directory is misspelled as `frondend`.
- **Impact:** Confusing project structure and potential path issues in build scripts.

### 3.2 Unused Environment Variables
- **Location:** `backend/.env` and `backend/routes/adminroute.js`
- **Description:** `dotenv` is configured but the variables are not used in the JWT signing/verification process.

---

## 4. Test Failures

### 4.1 Frontend Unit Test Failures
- **Status:** 12 out of 14 tests failed.
- **Primary Error:** `NullInjectorError: No provider for HttpClient!`
- **Description:** Most component tests are failing because `HttpClient` is not provided in the testing module configuration.
- **Impact:** Automated testing is currently broken, making it difficult to verify changes and prevent regressions.
