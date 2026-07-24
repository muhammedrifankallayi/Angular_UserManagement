# COMPREHENSIVE BUG REPORT & VULNERABILITY AUDIT

This bug report details serious security vulnerabilities, database/schema inconsistencies, business logic errors, frontend bugs, and test suite failures discovered during an audit of this JWT-based authentication system.

---

## TABLE OF CONTENTS
1. [Critical Security Vulnerabilities](#1-critical-security-vulnerabilities)
2. [Serious Business Logic & Schema Bugs](#2-serious-business-logic--schema-bugs)
3. [Frontend Architecture & Syntax Bugs](#3-frontend-architecture--syntax-bugs)
4. [Test Suite Failures & Environmental Issues](#4-test-suite-failures--environmental-issues)
5. [Summary of Recommended Actions](#5-summary-of-recommended-actions)

---

## 1. CRITICAL SECURITY VULNERABILITIES

### 1.1 Lack of Authentication and Authorization on Administrative Endpoints
* **Location:** `backend/routes/adminroute.js`
* **Vulnerability Type:** Broken Object Level Authorization (BOLA) / Missing Function Level Access Control.
* **Description:**
  The endpoints for listing all users (`/users`), deleting a user (`/deleteUser/:id`), fetching a user's details (`/editDetails/:id`), and updating a user (`/editUser`) do not include any middleware checking for a valid cookie or verifying whether the request was sent by an administrative user.
  ```javascript
  // backend/routes/adminroute.js
  adminrouter.get('/users',async (req,res)=>{ ... }) // No authentication or is_admin verification!
  adminrouter.post('/deleteUser/:id',async (req,res)=>{ ... }) // Anyone can delete any user!
  ```
* **Impact:** **CRITICAL**. Any unauthenticated external client can perform administrative actions, fetch sensitive user listings, delete users, and modify arbitrary user profiles simply by hitting the API routes.
* **Recommended Fix:** Implement and apply a robust authentication/authorization middleware (e.g., `verifyAdminToken`) on all administrative endpoints to verify the presence of a valid JWT and check if `is_admin === true` in the token claims or database record.

### 1.2 Exposure of Sensitive Password Hashes in API Responses
* **Location:** `backend/routes/adminroute.js` (inside `/users` endpoint)
* **Vulnerability Type:** Sensitive Data Exposure.
* **Description:**
  The `/users` endpoint returns the raw document results of `User.find({})` directly to the client without stripping out the `password` field.
  ```javascript
  adminrouter.get('/users',async (req,res)=>{
      try {
          const user = await User.find({})
          res.send(user) // Transmits hashed passwords of all users
      } catch (error) { ... }
  })
  ```
* **Impact:** **HIGH**. It exposes the bcrypt password hashes of all users in the system to any caller, making the system highly vulnerable to offline brute-force and dictionary attacks if the endpoint is accessed.
* **Recommended Fix:** Modify the query to exclude the password field using Mongoose projection:
  ```javascript
  const users = await User.find({}).select('-password');
  ```

### 1.3 Hardcoded JWT Signing Secrets
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Vulnerability Type:** Cryptographic Failures / Hardcoded Secrets.
* **Description:**
  Both route files hardcode the JWT signing and verification secret as a literal string `"secret"` instead of utilizing the environment configuration loaded via `dotenv`.
  ```javascript
  const token = jwt.sign({_id:user._id},"secret"); // Hardcoded secret!
  ```
* **Impact:** **HIGH**. Anyone with access to the repository or code artifacts knows the signing secret, rendering the JWT integrity guarantees completely useless. Attackers can easily forge tokens to impersonate administrators or other users.
* **Recommended Fix:** Use the environment variable loaded into `process.env`:
  ```javascript
  const token = jwt.sign({ _id: user._id }, process.env.jwtsecret);
  ```

### 1.4 CORS Allowed Credentials without CSRF Safeguards
* **Location:** `backend/index.js`
* **Vulnerability Type:** Cross-Site Request Forgery (CSRF).
* **Description:**
  The backend CORS policy allows credentials transmission (`credentials: true`) with origins like `http://localhost:4200`. However, the application completely lacks any CSRF protection tokens or security headers on state-modifying requests (such as profile uploads, deletions, registration, or logout).
* **Impact:** **MEDIUM-HIGH**. Malicious websites could perform actions on behalf of authenticated users via silent cross-site fetch requests that leverage the browser's automatic cookie transmission policy.
* **Recommended Fix:** Implement CSRF tokens (using packages like `csurf` or standard double-submit cookie pattern) or leverage `SameSite` attribute controls (`SameSite=Lax` or `SameSite=Strict`) on the authentication cookies.

---

## 2. SERIOUS BUSINESS LOGIC & SCHEMA BUGS

### 2.1 Overwriting Administrator JWT Cookie upon Creating a User
* **Location:** `backend/routes/adminroute.js` (inside `/createuser` endpoint)
* **Description:**
  When an administrator creates a new user, the `/createuser` endpoint mistakenly generates a JWT token for the *newly created user* and writes it to the administrator's `jwt` session cookie.
  ```javascript
  // backend/routes/adminroute.js
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{ ... }); // Overwrites the administrator's own session cookie!
  ```
* **Impact:** **MEDIUM-HIGH**. Immediately after successfully creating a user, the administrator's session cookie is overwritten, causing them to be silently logged out of the admin panel and logged into the newly created user's account.
* **Recommended Fix:** Remove the token generation and `res.cookie` calls from the administrative `/createuser` endpoint. The admin should receive only a success status/message:
  ```javascript
  res.status(201).send({ message: "User created successfully" });
  ```

### 2.2 Database Schema Type Mismatch (`is_admin` defined as String)
* **Location:** `backend/models/user.js`
* **Description:**
  In the user mongoose schema, `is_admin` is defined as a `String` but is assigned a default boolean value of `false`. Furthermore, query filters check for boolean values (`is_admin: true`).
  ```javascript
  is_admin:{
      type:String,
      default:false // Boolean default for String type!
  }
  ```
* **Impact:** **MEDIUM**. Mongoose automatically coerces values, saving them as strings (`"true"` / `"false"`), which introduces typing inconsistencies and raises potential bugs when performing comparisons in JavaScript or running strict database migrations.
* **Recommended Fix:** Change the type of `is_admin` to `Boolean`:
  ```javascript
  is_admin:{
      type: Boolean,
      default: false
  }
  ```

### 2.3 Unhandled Crash Risk on Missing File Upload Payload
* **Location:** `backend/routes/routes.js` (inside `/profile-upload-single` endpoint)
* **Description:**
  The profile-upload route accesses the uploaded file filename (`req.file.filename`) without checking if `req.file` exists.
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}}); // req.file may be undefined!
  ```
* **Impact:** **MEDIUM**. If a client hits the endpoint without attaching a file payload, the Node.js process throws an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`. If not caught by express global handlers, this could crash the backend server (DoS).
* **Recommended Fix:** Add a safety check before attempting to update the image:
  ```javascript
  if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
  }
  ```

### 2.4 Supressed Exceptions and Poor Error Handling (Empty Catch Blocks)
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:**
  Numerous endpoints use `try-catch` blocks that swallow exceptions entirely without notifying the client, or only log to `console.log` without returning an HTTP error code.
  - *Example:* `/profile-upload-single` has an empty catch block:
    ```javascript
    try { ... } catch (error) { } // Swallows error, leaves request hanging!
    ```
* **Impact:** **MEDIUM**. Requests that throw errors will hang infinitely until they time out. Additionally, debugging issues in production becomes extremely difficult due to the lack of error details.
* **Recommended Fix:** Always ensure that catch blocks return a proper error response and status code:
  ```javascript
  try { ... } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal Server Error" });
  }
  ```

---

## 3. FRONTEND ARCHITECTURE & SYNTAX BUGS

### 3.1 Incorrect Parameters in Angular `HttpClient.post` Calls
* **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (inside `deleteUser(userId)`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (inside `getusers(userId)`)
* **Description:**
  The syntax of `HttpClient.post()` in Angular is: `post(url, body, options)`. In the mentioned components, request configuration options (`{ withCredentials: true }`) are passed as the **second** argument instead of the **third** argument.
  ```typescript
  // Inside deleteUser:
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials:true })
  // Evaluates as sending { withCredentials: true } as the body, with no options argument!
  ```
* **Impact:** **HIGH**. Because options are omitted, the credentials (session cookies) are not transmitted to the backend, causing the backend to fail verification of the admin session. This breaks deletion and user detail loading features on the frontend.
* **Recommended Fix:** Provide an empty body object as the second parameter and pass the configuration as the third parameter:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, { withCredentials: true })
  ```

### 3.2 Non-Functional Search Input Component
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Description:**
  The search bar element is static HTML and is completely disconnected from any component state, events, actions, or reducers.
  ```html
  <input type="text" placeholder="Search" class="input">
  ```
* **Impact:** **MEDIUM**. The search input on the administrative user list dashboard is non-functional, misleading users and indicating unfinished feature implementation.
* **Recommended Fix:** Implement search filtering inside the component:
  1. Bind the input value via `[(ngModel)]` or a form control.
  2. Implement a local filter in the component or write an NgRx selector that filters the loaded user state based on the query term.

### 3.3 Misspelled Root Frontend Directory
* **Location:** Repository Root
* **Description:** The root directory for the Angular application is named `frondend` instead of `frontend`.
* **Impact:** **LOW**. While it does not affect execution, it is an obvious typo that harms repository professionalism and path aesthetics.
* **Recommended Fix:** Rename the root folder to `frontend`.

---

## 4. TEST SUITE FAILURES & ENVIRONMENTAL ISSUES

### 4.1 Broken Angular Component Unit Tests (NullInjectorError)
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Description:**
  Running `ng test` results in 12 out of 14 unit test failures due to missing mock providers in the test beds.
  - Errors like: `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and `No provider for Store!` are thrown for components that inject these services into their constructors.
* **Impact:** **HIGH**. Completely breaks test suite runs and invalidates continuous integration (CI/CD) pipelines.
* **Recommended Fix:** Inject appropriate mocks and testing utilities inside TestBed configurations:
  - Import `HttpClientTestingModule` from `@angular/common/http/testing`.
  - Import `RouterTestingModule` from `@angular/router/testing`.
  - Provide mock NgRx store using `provideMockStore()` from `@ngrx/store/testing`.

### 4.2 Lack of Backend Test Coverage
* **Location:** `backend/`
* **Description:** No testing framework or scripts are defined in `backend/package.json`. There are zero unit or integration tests for database models, routes, or middleware.
* **Impact:** **LOW-MEDIUM**. High risk of regressions during code refactoring or security patching.
* **Recommended Fix:** Integrate a backend testing suite such as Jest/Supertest or Mocha/Chai to write tests validating middleware, controller logic, and route responses.

---

## 5. SUMMARY OF RECOMMENDED ACTIONS

| Issue # | Priority | Description | Target File / Location | Recommended Action |
|---|---|---|---|---|
| **1.1** | 🔥 Critical | Missing Authentication/Authorization Middleware on Admin routes | `backend/routes/adminroute.js` | Create admin role verification middleware and apply it to all admin route definitions. |
| **1.2** | 🔴 High | Leakage of password hashes | `backend/routes/adminroute.js` | Query users with projection `.select('-password')`. |
| **1.3** | 🔴 High | Hardcoded JWT Signing Secret | `backend/routes/*.js` | Replace `"secret"` with `process.env.jwtsecret`. |
| **3.1** | 🔴 High | Incorrect `HttpClient.post` parameter signature | `frondend/jwtapp/.../*.ts` | Reorder parameters to `post(url, {}, { withCredentials: true })`. |
| **4.1** | 🔴 High | Broken frontend spec files | `frondend/jwtapp/.../*.spec.ts` | Update TestBed imports and providers in component spec files. |
| **2.1** | 🟡 Medium | Admin cookie overwritten on createuser | `backend/routes/adminroute.js` | Remove `res.cookie` logic from `/createuser` endpoint. |
| **2.2** | 🟡 Medium | Schema mismatch for `is_admin` | `backend/models/user.js` | Change schema type of `is_admin` to `Boolean`. |
| **2.3** | 🟡 Medium | App crash hazard on profile upload | `backend/routes/routes.js` | Check if `req.file` exists before reading its properties. |
| **2.4** | 🟡 Medium | Silent catch blocks / Poor error handling | `backend/routes/*.js` | Add status codes and clear JSON messages in catch blocks. |
| **3.2** | 🟢 Low | Non-functional admin search | `frondend/jwtapp/.../*.html` | Connect the search input to NgRx selectors or component properties. |
| **3.3** | 🟢 Low | Typo in root directory name | `/frondend` | Rename `frondend/` to `frontend/`. |
