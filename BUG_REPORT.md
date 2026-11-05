# Bug Report & Code Audit

This document provides a comprehensive report of identified bugs, security vulnerabilities, logic errors, architectural concerns, and testing issues in the project.

---

## 1. Executive Summary

The project consists of an Express.js backend (`backend/`) and an Angular 16 frontend (`frondend/jwtapp/`). An audit of the codebase revealed critical security vulnerabilities, logic errors, improper API client calls, unhandled exceptions, and misconfigured unit test suites.

---

## 2. Backend Issues (`backend/`)

### 2.1 Security & Authentication Vulnerabilities

#### BUG-BE-01: Hardcoded JWT Secret Key
- **Location:**
  - `backend/routes/routes.js`: lines 36, 61, 75, 102, 122
  - `backend/routes/adminroute.js`: lines 24, 46, 137
- **Description:** JWT generation and verification calls hardcode `"secret"` instead of reading from environment variables (`process.env.jwtsecret`), even though `dotenv` is imported and configured in both route files.
- **Impact:** An attacker who knows the hardcoded secret can forge JWT tokens with arbitrary claims (including `_id`), achieving complete unauthorized account takeover.
- **Suggested Fix:** Replace `"secret"` with `process.env.jwtsecret` across all `jwt.sign` and `jwt.verify` calls, and ensure fallback validation if the environment variable is not defined.

#### BUG-BE-02: Missing Authentication & Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
  - `/users` (GET)
  - `/deleteUser/:id` (POST)
  - `/editDetails/:id` (POST)
  - `/editUser` (POST)
  - `/createuser` (POST)
- **Description:** Only `/active` verifies the JWT cookie. All management endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack any authentication checks or role verification (`is_admin: true`).
- **Impact:** Any unauthenticated actor or regular user who sends HTTP requests directly to these admin endpoints can read user data, edit user profiles, delete users, and create new accounts.
- **Suggested Fix:** Implement Express authentication and admin-authorization middleware (e.g., `verifyAdmin`) that validates the JWT cookie, confirms the user exists, and checks `is_admin === true`. Attach this middleware to `adminroutes`.

#### BUG-BE-03: Password Hashes Exposed in Admin User List Endpoint
- **Location:** `backend/routes/adminroute.js`: lines 59–67 (`/users`)
- **Description:** `User.find({})` queries and sends all user documents directly to the client without stripping or omitting the `password` hash field (`const {password, ...data} = await user.toJSON()` was commented out).
- **Impact:** Password hashes of all users and administrators are exposed over the network to anyone requesting `/api/admin/users`.
- **Suggested Fix:** Use Mongoose projection to exclude the password field (e.g., `User.find({}, '-password')` or `.select('-password')`).

#### BUG-BE-04: Hardcoded MongoDB Connection URI
- **Location:** `backend/index.js`: line 20
- **Description:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded in `index.js` rather than using environment configuration (`process.env.MONGO_URI`).
- **Impact:** Prevents secure configuration across environments (staging, production, Docker containers).
- **Suggested Fix:** Move MongoDB connection URI into `.env` and load via `process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwtproject'`.

---

### 2.2 Logic & Schema Bugs

#### BUG-BE-05: Admin `createuser` Endpoint Overwrites Admin Session Cookie
- **Location:** `backend/routes/adminroute.js`: lines 136–144
- **Description:** When an administrator creates a new user via `/api/admin/createuser`, the backend generates a JWT token for the *newly created user* and calls `res.cookie("jwt", token, ...)`.
- **Impact:** The administrator's browser session cookie is replaced with the newly created user's token. Consequently, the administrator is silently demoted / logged in as the new user and loses admin access on subsequent requests.
- **Suggested Fix:** Remove `jwt.sign` and `res.cookie("jwt", ...)` from the admin `/createuser` handler. Simply return `{ message: "User created successfully" }`.

#### BUG-BE-06: Schema Type Mismatch for `is_admin` Field
- **Location:** `backend/models/user.js`: lines 16–19
- **Description:** In `userSchema`, `is_admin` is defined with type `String` but with `default: false` (a boolean). In `adminroute.js`: line 11, the query searches with boolean `{ is_admin: true }`.
- **Impact:** Storing booleans in a String field can cause query inconsistencies in MongoDB depending on driver casting and serialization.
- **Suggested Fix:** Change `is_admin` type to `Boolean` in `backend/models/user.js`:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

#### BUG-BE-07: Unchecked `req.file` in Profile Image Upload Route
- **Location:** `backend/routes/routes.js`: lines 107–113 (`/profile-upload-single`)
- **Description:** The route handler directly accesses `req.file.filename` without checking if `req.file` is defined:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
- **Impact:** If a client submits a POST request without attaching a file or with an invalid field name, `req.file` is `undefined`, causing a runtime TypeError (`Cannot read properties of undefined (reading 'filename')`).
- **Suggested Fix:** Add a guard clause:
  ```javascript
  if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
  }
  ```

#### BUG-BE-08: Suppressed Errors and Missing Responses in Catch Blocks
- **Location:**
  - `backend/routes/routes.js`: lines 114–116, 131–133
  - `backend/routes/adminroute.js`: lines 32–34, 40–42, 65–67, 78–80, 93–95, 104–106, 146–148
- **Description:** Several `catch (error)` blocks are empty or only call `console.log(...)` without sending an HTTP response to the client.
- **Impact:** If an exception occurs, the HTTP request hangs indefinitely until client timeout.
- **Suggested Fix:** Ensure all catch blocks return an appropriate error response, e.g. `res.status(500).json({ message: "Internal server error" })`.

---

## 3. Frontend Issues (`frondend/jwtapp/`)

### 3.1 Functional & HTTP Request Bugs

#### BUG-FE-01: Incorrect `HttpClient.post` Parameter Signature in Admin Components
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`: lines 44–46
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
      withCredentials: true
    })
    ```
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`: lines 84–86
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
      withCredentials: true
    })
    ```
- **Description:** In Angular's `HttpClient.post(url, body, options)`, the second parameter is the request body, and the third parameter is options. Here `{ withCredentials: true }` is passed as the request body (`body`), meaning `options` is undefined and `withCredentials: true` is not sent with the HTTP request.
- **Impact:** Authentication cookies (`jwt`) are not transmitted to the backend for these requests, causing potential authentication failures or sending unexpected request payloads.
- **Suggested Fix:** Provide an empty body object as the second argument:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, {
    withCredentials: true
  });
  ```
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {}, {
    withCredentials: true
  });
  ```

#### BUG-FE-02: Non-Functional Search Input in Admin User List
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`: line 4
  ```html
  <input type="text" placeholder="Search" class="input">
  ```
- **Description:** The search input has no event binding, `[(ngModel)]`, or form control attached. There is no filter logic implemented in `AdminUserlistComponent` or in NgRx selectors/reducers.
- **Impact:** The search bar in the admin dashboard UI is purely cosmetic and does nothing when the user types into it.
- **Suggested Fix:** Bind the input to a search term (using `(input)` or a reactive `FormControl`), and filter `userdata$` stream using an NgRx selector or component-level RxJS `combineLatest` / `map` pipeline.

#### BUG-FE-03: Repository Directory Spelling Error
- **Location:** Root directory `frondend/`
- **Description:** The directory name is misspelled as `frondend` instead of `frontend`.
- **Impact:** Inconsistent project naming and potential CI/CD configuration confusion.
- **Suggested Fix:** Rename directory to `frontend` and update references if scripts depend on pathing.

---

### 3.2 Testing & Specification Issues

#### BUG-FE-04: Unit Test Suite Failures (NullInjectorError & Missing Providers)
- **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
- **Description:** Component unit tests (e.g. `DashboardComponent`, `ProfileComponent`, `LoginComponent`, `RegisterComponent`, `AdminUserlistComponent`, `AdminUsereditComponent`, `AdminCreateuserComponent`, `NavComponent`, `AdminNavComponent`) do not configure required dependencies in `TestBed.configureTestingModule`. Specifically:
  - `HttpClient` is injected in components and services, but `HttpClientTestingModule` is not imported.
  - `Router` and `ActivatedRoute` are injected, but `RouterTestingModule` is not imported.
  - NgRx `Store` is injected, but `provideMockStore(...)` is not provided.
  - `FormBuilder` is injected, but `ReactiveFormsModule` is not imported.
  - `AppComponent` tests expect default Angular scaffold elements (`.content span` containing `jwtapp app is running!`) which do not exist in `app.component.html`.
- **Impact:** Running `ng test` results in widespread test suite failures due to `NullInjectorError: No provider for HttpClient!`, `NullInjectorError: No provider for Store!`, etc.
- **Suggested Fix:**
  - Update all `.spec.ts` files to import `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and provide `provideMockStore({})`.
  - Update `app.component.spec.ts` assertions to reflect actual `AppComponent` template contents.

---

## 4. Priority & Risk Matrix

| ID | Component | Severity | Category | Status |
|---|---|---|---|---|
| BUG-BE-01 | Backend | Critical | Security | Reported |
| BUG-BE-02 | Backend | Critical | Security / Access Control | Reported |
| BUG-BE-03 | Backend | High | Data Privacy / Security | Reported |
| BUG-BE-04 | Backend | Medium | Configuration | Reported |
| BUG-BE-05 | Backend | High | Business Logic | Reported |
| BUG-BE-06 | Backend | Medium | Schema / Data Integrity | Reported |
| BUG-BE-07 | Backend | Medium | Robustness / Crash Prevention | Reported |
| BUG-BE-08 | Backend | Medium | Error Handling | Reported |
| BUG-FE-01 | Frontend | High | HTTP / Authentication | Reported |
| BUG-FE-02 | Frontend | Low | UI / Functional Incompleteness | Reported |
| BUG-FE-03 | Frontend | Low | Codebase Consistency | Reported |
| BUG-FE-04 | Frontend | Medium | Testing / CI/CD | Reported |
