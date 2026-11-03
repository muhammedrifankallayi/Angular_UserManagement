# Comprehensive Bug Report

This document details the issues, security vulnerabilities, logic bugs, architectural inconsistencies, and test failures identified across the application stack (Backend and Frontend).

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Backend Issues](#backend-issues)
   - [BUG-BE-01: Hardcoded JWT Secret & Missing Environment Variable Usage](#bug-be-01-hardcoded-jwt-secret--missing-environment-variable-usage)
   - [BUG-BE-02: Missing Authorization/Authentication on Protected Admin Endpoints](#bug-be-02-missing-authorizationauthentication-on-protected-admin-endpoints)
   - [BUG-BE-03: Sensitive Information Leakage in User Listing Endpoint](#bug-be-03-sensitive-information-leakage-in-user-listing-endpoint)
   - [BUG-BE-04: Admin User Creation Overwrites Administrator Cookie Session](#bug-be-04-admin-user-creation-overwrites-administrator-cookie-session)
   - [BUG-BE-05: Missing File Check in Single Profile Upload Endpoint](#bug-be-05-missing-file-check-in-single-profile-upload-endpoint)
   - [BUG-BE-06: Schema Type Mismatch for `is_admin` Field](#bug-be-06-schema-type-mismatch-for-is_admin-field)
   - [BUG-BE-07: Hardcoded MongoDB Connection URI](#bug-be-07-hardcoded-mongodb-connection-uri)
   - [BUG-BE-08: Suppressed Exceptions and Missing HTTP Error Responses](#bug-be-08-suppressed-exceptions-and-missing-http-error-responses)
   - [BUG-BE-09: Missing Automated Tests and Test Script in Backend](#bug-be-09-missing-automated-tests-and-test-script-in-backend)
3. [Frontend Issues](#frontend-issues)
   - [BUG-FE-01: Incorrect Parameter Order in `HttpClient.post` Calls](#bug-fe-01-incorrect-parameter-order-in-httpclientpost-calls)
   - [BUG-FE-02: Non-Functional Search Input in Admin User List](#bug-fe-02-non-functional-search-input-in-admin-user-list)
   - [BUG-FE-03: Frontend Directory Misspelled (`frondend`)](#bug-fe-03-frontend-directory-misspelled-frondend)
   - [BUG-FE-04: Failing Angular Unit Tests (NullInjectorError & Assertion Failures)](#bug-fe-04-failing-angular-unit-tests-nullinjectorerror--assertion-failures)
4. [Summary of Recommendations](#summary-of-recommendations)

---

## 1. Executive Summary

An audit of the codebase revealed several critical security vulnerabilities, logic errors, and testing deficiencies across both the Express/Node.js backend and the Angular frontend. Key risks include exposure of sensitive data (hashed passwords returned over the API), broken access control on administrative functions, session overwriting upon user creation by an admin, incorrect Angular HTTP service calls, and widespread failure of frontend unit test suites.

---

## 2. Backend Issues

### BUG-BE-01: Hardcoded JWT Secret & Missing Environment Variable Usage
- **Severity**: Critical
- **Area**: Security / Backend
- **Location**: `backend/routes/routes.js` (lines 35, 62, 77, 102, 126), `backend/routes/adminroute.js` (lines 24, 48, 124)
- **Description**: While `dotenv.config()` is called and `.env` defines `jwtsecret="secret"`, all JWT operations (`jwt.sign` and `jwt.verify`) hardcode `"secret"` as a raw string literal rather than reading `process.env.jwtsecret`.
- **Impact**: Any attacker who reads the source code or knows the default value can forge valid JWT tokens for arbitrary user and administrator IDs.
- **Remediation**: Use `process.env.jwtsecret` consistently across all `jwt.sign` and `jwt.verify` calls, and ensure fallback validation or application failure if the environment variable is not defined.

---

### BUG-BE-02: Missing Authorization/Authentication on Protected Admin Endpoints
- **Severity**: Critical
- **Area**: Security / Backend
- **Location**: `backend/routes/adminroute.js`
  - `GET /api/admin/users` (lines 66-74)
  - `POST /api/admin/deleteUser/:id` (lines 76-88)
  - `POST /api/admin/editDetails/:id` (lines 90-104)
  - `POST /api/admin/editUser` (lines 106-116)
  - `POST /api/admin/createuser` (lines 118-156)
- **Description**: None of these administrative routes verify that the incoming request contains a valid JWT cookie, nor do they verify that the authenticated user possesses administrator privileges (`is_admin: true`). Any unauthenticated user or external caller can list, view, modify, create, or delete users.
- **Impact**: Complete compromise of user database management; unauthorized privilege escalation, deletion, and account creation.
- **Remediation**: Implement an authentication and admin-authorization middleware (e.g., `verifyAdmin`) that extracts the JWT token from cookies, verifies it, checks if the user exists and has `is_admin: true`, and applies this middleware to all `/api/admin/*` routes.

---

### BUG-BE-03: Sensitive Information Leakage in User Listing Endpoint
- **Severity**: High
- **Area**: Security / Backend
- **Location**: `backend/routes/adminroute.js` (line 68)
- **Description**: The endpoint `GET /api/admin/users` executes `const user = await User.find({})` and returns the documents directly (`res.send(user)`). The password hashes (`password` field) are commented out from exclusion:
  ```js
  const user = await User.find({})
  // const {password, ...data} = await user.toJSON();
  res.send(user)
  ```
- **Impact**: Hashed passwords (bcrypt) for all users and administrators are exposed over the network to any consumer of this API.
- **Remediation**: Exclude sensitive fields from the query: `User.find({}, { password: 0 })` or `User.find({}).select('-password')`.

---

### BUG-BE-04: Admin User Creation Overwrites Administrator Cookie Session
- **Severity**: High
- **Area**: Logic / Backend
- **Location**: `backend/routes/adminroute.js` (lines 144-150)
- **Description**: In the admin endpoint `/api/admin/createuser`, after creating a new user, a JWT token is generated for the *newly created user* and set in the response cookie:
  ```js
  const {_id} = await result.toJSON();
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{
      httpOnly:true,
      maxAge:24*60*60*1000
  })
  ```
- **Impact**: When an administrator creates a new user from the admin dashboard, their session cookie is overwritten with the new regular user's session token, inadvertently logging the administrator out and switching their active session.
- **Remediation**: Remove the `res.cookie` call from `/createuser` in `adminroute.js`. The endpoint should simply create the user and return a success message.

---

### BUG-BE-05: Missing File Check in Single Profile Upload Endpoint
- **Severity**: Medium
- **Area**: Reliability / Backend
- **Location**: `backend/routes/routes.js` (line 109)
- **Description**: In `POST /api/profile-upload-single`, `req.file.filename` is accessed directly:
  ```js
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
  If a request is sent without a file (e.g., empty form-data or wrong field name), `req.file` is `undefined`.
- **Impact**: Unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`. Because the catch block is empty, the connection hangs without sending an HTTP response until timeout.
- **Remediation**: Check `if (!req.file) return res.status(400).json({ message: 'No file uploaded' });` before accessing `req.file.filename`.

---

### BUG-BE-06: Schema Type Mismatch for `is_admin` Field
- **Severity**: Medium
- **Area**: Data Model / Backend
- **Location**: `backend/models/user.js` (lines 16-19)
- **Description**: In `backend/models/user.js`:
  ```js
  is_admin:{
      type:String,
      default:false
  }
  ```
  The schema declares `type: String`, but assigns a boolean default `false`. In `adminroute.js`, queries search for `{ is_admin: true }` (boolean).
- **Impact**: Potential query mismatches and type confusion when saving or querying boolean admin flags in MongoDB.
- **Remediation**: Change `type: Boolean` with `default: false`.

---

### BUG-BE-07: Hardcoded MongoDB Connection URI
- **Severity**: Medium
- **Area**: Configuration / Backend
- **Location**: `backend/index.js` (line 19)
- **Description**: The database connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded in `backend/index.js` rather than being loaded from an environment variable (`process.env.MONGODB_URI`).
- **Impact**: Inflexibility across deployment environments (Docker, staging, production, external MongoDB clusters).
- **Remediation**: Use `process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jwtproject'`.

---

### BUG-BE-08: Suppressed Exceptions and Missing HTTP Error Responses
- **Severity**: Medium
- **Area**: Reliability / Backend
- **Location**:
  - `backend/routes/routes.js`: Line 115 (empty catch block in `/profile-upload-single`), Line 133 (console.log without sending response in `/profile`)
  - `backend/routes/adminroute.js`: Lines 33, 42, 86, 102, 114, 154 (catch blocks that only `console.log` or do nothing without returning an HTTP 500 error response)
- **Description**: When exceptions occur in these endpoints, the request is neither completed nor rejected with an HTTP response status. The client request hangs indefinitely until timeout.
- **Impact**: Client applications hang on errors; failure to report server errors leads to degraded user experience and unhandled promise rejections.
- **Remediation**: Always return an error response in catch blocks, e.g., `return res.status(500).json({ message: "Internal server error" });`.

---

### BUG-BE-09: Missing Automated Tests and Test Script in Backend
- **Severity**: Low
- **Area**: Quality Assurance / Backend
- **Location**: `backend/package.json` (line 7)
- **Description**: `npm test` runs `echo "Error: no test specified" && exit 1`. There are no automated integration or unit tests for authentication, authorization, or CRUD operations.
- **Impact**: High risk of regression during backend modifications; inability to verify security fixes automatically.
- **Remediation**: Introduce a test framework (e.g., Jest or Mocha/Supertest) and add unit/integration tests for authentication, authorization middleware, and endpoints.

---

## 3. Frontend Issues

### BUG-FE-01: Incorrect Parameter Order in `HttpClient.post` Calls
- **Severity**: High
- **Area**: Functional / Frontend
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (lines 40-42)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (lines 79-81)
- **Description**: Angular's `HttpClient.post(url, body, options)` expects the request body as the 2nd argument and options (such as `{ withCredentials: true }`) as the 3rd argument.
  In `deleteUser` (`admin-userlist.component.ts`):
  ```ts
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
  In `getusers` (`admin-useredit.component.ts`):
  ```ts
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  })
  ```
  Here, `{ withCredentials: true }` is passed as the HTTP payload (`body`), and no options object is provided.
- **Impact**: The cookie credentials (`withCredentials: true`) are omitted from the HTTP options, causing browsers to not transmit authentication cookies (CORS credential failure). Additionally, an unexpected body is transmitted to endpoints that do not expect one.
- **Remediation**: Pass `null` or `{}` as the body and provide options as the 3rd argument:
  ```ts
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, { withCredentials: true })
  ```
  and:
  ```ts
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {}, { withCredentials: true })
  ```
  *(Or convert these endpoints to `DELETE` and `GET` verbs respectively).*

---

### BUG-FE-02: Non-Functional Search Input in Admin User List
- **Severity**: Medium
- **Area**: Functional / Frontend
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Description**: The template contains `<input type="text" placeholder="Search" class="input">` but has no data binding (no `[(ngModel)]`, `formControl`, or input event listener). Furthermore, there is no filtering logic in `admin-userlist.component.ts` or in NgRx selectors.
- **Impact**: The user list search bar is completely non-functional, misleading users and administrators.
- **Remediation**: Wire the search input using reactive forms or two-way binding, filter user records via NgRx selectors or component state, and update the displayed table dynamically.

---

### BUG-FE-03: Frontend Directory Misspelled (`frondend`)
- **Severity**: Low
- **Area**: Project Structure / Repository
- **Location**: Repository root folder `frondend/`
- **Description**: The frontend folder is named `frondend/` instead of `frontend/`.
- **Impact**: Confusion for developers and CI/CD pipelines expecting standard directory naming conventions.
- **Remediation**: Rename `frondend` to `frontend` or provide appropriate directory documentation and aliases.

---

### BUG-FE-04: Failing Angular Unit Tests (NullInjectorError & Assertion Failures)
- **Severity**: High
- **Area**: Testing / Frontend
- **Location**: `frondend/jwtapp/src/app/` across multiple `.spec.ts` files
- **Description**: Running `npm test -- --no-watch --no-progress --browsers=ChromeHeadless` results in 12 out of 14 tests failing:
  - `AdminCreateuserComponent`: `NullInjectorError: No provider for HttpClient!`
  - `AdminLoginComponent`: `NullInjectorError: No provider for HttpClient!`
  - `AdminNavComponent`: `NullInjectorError: No provider for HttpClient!`
  - `AdminUsereditComponent`: `NullInjectorError: No provider for HttpClient!`
  - `AdminUserlistComponent`: `NullInjectorError: No provider for HttpClient!`
  - `DashboardComponent`: `NullInjectorError: No provider for HttpClient!`
  - `HomeComponent`: `NullInjectorError: No provider for HttpClient!`
  - `LoginComponent`: `NullInjectorError: No provider for HttpClient!`
  - `NavComponent`: `NullInjectorError: No provider for HttpClient!`
  - `ProfileComponent`: `NullInjectorError: No provider for HttpClient!`
  - `RegisterComponent`: `NullInjectorError: No provider for HttpClient!`
  - `AppComponent`: `Expected undefined to contain 'jwtapp app is running!'`
- **Impact**: Automated frontend verification is completely broken; CI/CD cannot ensure code health or prevent regressions.
- **Remediation**:
  1. Import `HttpClientTestingModule` and `RouterTestingModule` into `TestBed.configureTestingModule` in all component spec files.
  2. Provide mock stores using `provideMockStore({})` and mock providers for custom services (`appService`).
  3. Fix `AppComponent` test expectation to match actual template rendering or adjust the template.

---

## 4. Summary of Recommendations

| Priority | Issue ID | Area | Title | Effort |
|----------|----------|------|-------|--------|
| P0 | BUG-BE-01 | Backend | Replace hardcoded JWT secrets with `process.env.jwtsecret` | Minimal |
| P0 | BUG-BE-02 | Backend | Add authentication and authorization middleware to admin routes | Medium |
| P0 | BUG-BE-03 | Backend | Remove password hashes from `GET /api/admin/users` query response | Minimal |
| P1 | BUG-BE-04 | Backend | Stop resetting admin session cookie in `/api/admin/createuser` | Minimal |
| P1 | BUG-FE-01 | Frontend | Fix argument order in `HttpClient.post` calls in admin components | Minimal |
| P2 | BUG-FE-04 | Frontend | Fix unit tests by importing test modules (`HttpClientTestingModule`, etc.) | Medium |
| P2 | BUG-BE-05 | Backend | Add null check on `req.file` in single upload endpoint | Minimal |
| P2 | BUG-BE-06 | Backend | Correct `is_admin` Mongoose schema type to Boolean | Minimal |
| P2 | BUG-BE-08 | Backend | Add proper HTTP error responses in catch blocks | Medium |
| P3 | BUG-FE-02 | Frontend | Implement search filter logic in admin user list | Low |
| P3 | BUG-BE-07 | Backend | Use environment variable for MongoDB connection URI | Minimal |
| P3 | BUG-FE-03 | Structure | Correct directory spelling from `frondend` to `frontend` | Minimal |
