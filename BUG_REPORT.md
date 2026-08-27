# Comprehensive Bug & Vulnerability Report

## Executive Summary
This report provides a detailed breakdown of security vulnerabilities, application logic errors, schema inconsistencies, frontend bugs, and unit testing failures identified across the backend and frontend components of this application.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded Secrets in JWT Signing / Verification
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** JWT operations use hardcoded string literals (e.g. `"secret"`) instead of consuming `process.env.jwtsecret` configured in `backend/.env`.
- **Impact:** Hardcoded secrets in source code allow unauthorized attackers to forge JWT tokens if code is exposed.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Sensitive endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack token validation and admin role check middleware.
- **Impact:** Any unauthenticated user or guest can trigger administrative functions (e.g., deleting or modifying user accounts, listing all registered users).

### 1.3 Sensitive Data Exposure in API Responses
- **Location:** `backend/routes/adminroute.js` (`GET /users`)
- **Issue:** The `GET /users` route returns raw Mongoose user documents including hashed passwords (`password` field).
- **Impact:** Password hashes are leaked over the network, increasing risk of offline brute-force / dictionary attacks against user passwords.

### 1.4 Missing Cross-Site Request Forgery (CSRF) Protection
- **Location:** `backend/index.js`
- **Issue:** CORS allows credentials (`credentials: true`), but the application relies solely on `httpOnly` cookies without CSRF tokens or SameSite attribute configurations.
- **Impact:** Authenticated users are susceptible to CSRF attacks executed from malicious third-party origins.

---

## 2. Backend Logic and Error Handling Bugs

### 2.1 Admin Session Overwritten Upon User Creation
- **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
- **Issue:** When an administrator creates a new user via `/createuser`, a new JWT cookie for the *newly created user* is generated and set on the response:
  ```js
  res.cookie("jwt", token, { ... })
  ```
- **Impact:** The administrator's session cookie is immediately overwritten, effectively logging out the admin and authenticating them as the newly created user.

### 2.2 Unhandled Null File Access in Profile Upload
- **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Issue:** Accesses `req.file.filename` directly without checking if `req.file` exists (e.g., when a request is sent without a file attached).
- **Impact:** Triggers an unhandled TypeError (`Cannot read property 'filename' of undefined`), crashing or hanging the request.

### 2.3 Suppressed Exceptions and Empty Catch Blocks
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** Multiple routes contain empty `catch (error) {}` blocks or log errors to `console.log` without returning an HTTP error status response to the client.
- **Impact:** Clients receive timed-out or pending requests without actionable status codes (e.g., 500 Internal Server Error).

---

## 3. Database Schema and Model Issues

### 3.1 Type Inconsistency for `is_admin` Field
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` property is defined as `type: String` but assigned a default value of boolean `false`:
  ```js
  is_admin: {
      type: String,
      default: false
  }
  ```
- **Impact:** Direct queries or comparisons expecting boolean `true`/`false` vs string `"true"`/`"false"` fail or produce inconsistent results when querying admin privileges.

---

## 4. Frontend Bugs and Misconfigurations

### 4.1 Incorrect Options Argument Placement in `HttpClient.post`
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Issue:** `http.post` passes `{ withCredentials: true }` as the second argument (the request `body`) instead of the third argument (`options`):
  ```ts
  // Incorrect: passes options object as request body
  this.http.post(`.../deleteUser/${userId}`, { withCredentials: true })
  ```
- **Impact:** `withCredentials` option is not sent in HTTP headers/options and empty or invalid request body is transmitted.

### 4.2 Non-Functional Search Bar in Admin User List
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** Search input element is purely static HTML without event bindings (`(ngModel)` or `(input)`), component logic, or selector filtering in NgRx state.
- **Impact:** User input in the search field has no effect on displayed users.

### 4.3 Typo in Root Frontend Directory Name
- **Location:** Repository root
- **Issue:** Directory is named `frondend` instead of `frontend`.
- **Impact:** Inconvenience in project navigation and setup scripts expecting standard naming conventions.

---

## 5. Testing and Environment Setup Issues

### 5.1 Unit Test Failures in Angular Components
- **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Issue:** 12 out of 14 Angular component unit tests fail during execution with `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, or missing NgRx Store providers.
- **Impact:** Automated CI/CD pipelines fail. Tests require importing `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore`.

### 5.2 Missing Test Scripts in Backend `package.json`
- **Location:** `backend/package.json`
- **Issue:** No test framework or test scripts are defined in `backend/package.json`.
- **Impact:** Lack of automated test coverage for critical backend security and authentication routines.
