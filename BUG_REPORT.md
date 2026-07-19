# Comprehensive Bug & Security Vulnerability Report

## Executive Summary
This report documents key security vulnerabilities, logical defects, and configuration issues discovered in the JWT User Management application. The application is divided into a Node.js/Express backend (`backend`) and an Angular 16 frontend (`frondend/jwtapp`).

During our thorough audit, we discovered several high-impact security vulnerabilities (such as missing middleware, credentials/password leaks, and hardcoded secrets) and logic bugs (such as session hijacking on user creation, malformed Angular HTTP POST requests, and non-functional search UI components). Additionally, we found that the majority of the frontend unit tests are failing due to incomplete test configurations.

The issues are detailed below, categorized by area, along with concrete root causes and actionable remediations.

---

## 1. Backend Security Vulnerabilities

### Issue 1.1: Missing Authentication & Authorization Middleware on Admin Routes
* **Severity:** Critical
* **Description:** Most administrative routes in `backend/routes/adminroute.js` are completely unprotected. There is no JWT authentication or administrator authorization check implemented for user listing, editing, or deletion.
* **Impact:** Anyone can access sensitive administration endpoints without logging in. An unauthorized attacker can list all registered users, edit user details, or delete arbitrary user accounts by making direct HTTP requests to these endpoints.
* **Root Cause:**
  In `backend/routes/adminroute.js`, the endpoints `/users`, `/deleteUser/:id`, `/editDetails/:id`, and `/editUser` completely lack any cookie/JWT verification.
  ```javascript
  adminrouter.get('/users', async (req, res) => {
      try {
          const user = await User.find({})
          res.send(user)
      } catch (error) { ... }
  })
  ```
* **Remediation:**
  Create an authentication middleware that checks the validity of the JWT cookie and verifies that the logged-in user is an administrator (`is_admin === true` or `"true"`). Apply this middleware to all administrative routes.
  ```javascript
  const adminAuth = async (req, res, next) => {
      try {
          const cookie = req.cookies["jwt"];
          if (!cookie) return res.status(401).send({ message: "unauthenticated" });

          const claims = jwt.verify(cookie, process.env.jwtsecret || "secret");
          const user = await User.findOne({ _id: claims._id });
          if (!user || user.is_admin !== "true") {
              return res.status(403).send({ message: "forbidden: admin access required" });
          }
          req.user = user;
          next();
      } catch (error) {
          return res.status(401).send({ message: "unauthenticated" });
      }
  };
  ```

### Issue 1.2: Exposure of Sensitive Password Hashes in API Responses
* **Severity:** High
* **Description:** The `/api/admin/users` endpoint returns raw user documents from the database, which include the users' bcrypt password hashes.
* **Impact:** Attackers can capture these password hashes from API responses and perform offline brute-force or dictionary attacks to decrypt user passwords.
* **Root Cause:**
  In `backend/routes/adminroute.js`, the code that strips out passwords is commented out, and the raw `user` array is returned directly.
  ```javascript
  adminrouter.get('/users',async (req,res)=>{
      try {
          const user = await User.find({})
          // const {password, ...data} = await user.toJSON(); // Commented out
          res.send(user)
      } ...
  ```
* **Remediation:**
  Exclude the `password` field from the database query using select projection, or map over the documents to exclude the password before responding.
  ```javascript
  const users = await User.find({}, { password: 0 });
  res.send(users);
  ```

### Issue 1.3: Hardcoded JWT Secret Key
* **Severity:** Medium
* **Description:** The JWT signing and verification key is hardcoded as the string `"secret"` throughout the codebase, ignoring the configuration in the environment variables.
* **Impact:** Hardcoded credentials can easily be leaked in version control. Attackers can forge administrative JWT tokens if they obtain the hardcoded key.
* **Root Cause:**
  In `backend/routes/routes.js` and `backend/routes/adminroute.js`, calls to `jwt.sign()` and `jwt.verify()` use a hardcoded literal `"secret"` instead of `process.env.jwtsecret`.
  ```javascript
  const token = jwt.sign({_id:user._id},"secret");
  ```
* **Remediation:**
  Always pull the secret from the `.env` configuration file via `process.env.jwtsecret` (or another secure env variable), falling back to a strong default or throwing an error if it is not defined.
  ```javascript
  const token = jwt.sign({_id:user._id}, process.env.jwtsecret);
  ```

---

## 2. Backend Logic & Architectural Issues

### Issue 2.1: Admin Session Overwritten During User Creation
* **Severity:** High
* **Description:** When an administrator creates a new user through `/api/admin/createuser`, the backend signs a new JWT token using the *created user's ID* and overwrites the administrator's JWT cookie.
* **Impact:** As soon as an administrator successfully creates a new user, they are instantly logged out of their administrative session and logged in as the new user.
* **Root Cause:**
  In `backend/routes/adminroute.js`, the `/createuser` endpoint duplicates registration logic and sets a cookie for the new user ID on the active response:
  ```javascript
  const {_id} = await result.toJSON();
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{ ... }) // Overwrites admin's cookie!
  ```
* **Remediation:**
  Do not generate or set a cookie for the newly created user in `/createuser`. An administrator creating a user should keep their existing session intact. Simply return a success message.
  ```javascript
  res.send({ message: "User created successfully" });
  ```

### Issue 2.2: Inconsistent Schema Configuration for `is_admin`
* **Severity:** Medium
* **Description:** In the Mongoose schema, `is_admin` is defined as a `String` type but defaulted to the boolean `false`. In route logic, it is queried using both booleans (`is_admin: true`) and checked as strings.
* **Impact:** Mixing string and boolean values causes query mismatches, casting anomalies, and code confusion. It can lead to security bypasses or user lookup failures.
* **Root Cause:**
  In `backend/models/user.js`:
  ```javascript
  is_admin:{
      type:String,
      default:false // Boolean default for String type!
  }
  ```
* **Remediation:**
  Refactor the Mongoose field to be of type `Boolean` with a default value of `false`.
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

### Issue 2.3: Unhandled Exceptions / Potential Application Crashes on File Upload
* **Severity:** High
* **Description:** The `/profile-upload-single` endpoint accesses the file property (`req.file.filename`) directly without checking if a file was actually uploaded.
* **Impact:** If a client triggers the upload endpoint without attaching a file, `req.file` is `undefined`, and the server will crash with a `TypeError` (uncaught exception), causing service disruption.
* **Root Cause:**
  In `backend/routes/routes.js`:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
* **Remediation:**
  Add a validation check to verify that `req.file` exists before processing the upload.
  ```javascript
  if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
  }
  ```

---

## 3. Frontend Logic & Integration Bugs

### Issue 3.1: Wrong Parameter Order in Angular HttpClient Post Calls
* **Severity:** High
* **Description:** In several Angular components, the `.post()` request passes the request options object (specifically `{ withCredentials: true }`) as the second argument (the `body`) instead of the third argument (`options`).
* **Impact:** No credentials (cookies) are sent to the backend because the options block is treated as the request body, causing the backend to reject the calls as "unauthenticated".
* **Root Cause:**
  - In `AdminUserlistComponent`:
    ```typescript
    deleteUser(userId: any){
      this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`,{
        withCredentials:true // Treated as body!
      })
    }
    ```
  - In `AdminUsereditComponent`:
    ```typescript
    getusers(userId:any){
      this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`,{
        withCredentials: true // Treated as body!
      })
    }
    ```
* **Remediation:**
  Pass a dummy body or empty object `{}` as the second argument and place the options as the third argument.
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

### Issue 3.2: Non-Functional Search Input
* **Severity:** Low
* **Description:** The search input in the `AdminUserlistComponent` is purely static HTML and lacks any functional binding or logic in the component class or NgRx state.
* **Impact:** Administrators cannot filter the list of users in the dashboard UI.
* **Root Cause:**
  In `admin-userlist.component.html`:
  ```html
  <input type="text" placeholder="Search" class="input"> <!-- No model or binding -->
  ```
* **Remediation:**
  Introduce an `ngModel` or `FormControl` to bind the search text, and filter the users list (either through an NgRx selector or locally in the component class).

### Issue 3.3: Misspelled Project Directory
* **Severity:** Low (Architectural Noise)
* **Description:** The root directory for the frontend application is named `frondend` instead of `frontend`.
* **Impact:** Confuses development tooling, violates standard naming conventions, and complicates configuration paths.

---

## 4. Frontend Testing Configuration Issues

### Issue 4.1: Massive Unit Test Failures (12 of 14 FAILED)
* **Severity:** Medium
* **Description:** Out of 14 Angular unit tests, 12 fail primarily with `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
* **Impact:** Developers cannot verify frontend code health via unit tests. Incomplete test suites block continuous integration pipelines.
* **Root Cause:**
  The Angular test specs (e.g., `admin-userlist.component.spec.ts`, `profile.component.spec.ts`) configure `TestBed` but do not import `HttpClientTestingModule` or `RouterTestingModule`, nor do they provide the NgRx mock store.
* **Remediation:**
  Update test spec files (`*.spec.ts`) to configure `TestBed` with appropriate mock modules and store providers:
  ```typescript
  import { HttpClientTestingModule } from '@angular/common/http/testing';
  import { RouterTestingModule } from '@angular/router/testing';
  import { provideMockStore } from '@ngrx/store/testing';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [provideMockStore()],
      declarations: [AdminUserlistComponent]
    });
  });
  ```

---

## Summary Severity Table

| ID | Issue Description | Severity | Affected Component |
|---|---|---|---|
| 1.1 | Missing authentication/authorization on admin routes | Critical | Backend Router |
| 1.2 | Password hash leakage in user listing | High | Backend API |
| 2.1 | Admin session hijacking during user creation | High | Backend Logic |
| 2.3 | Unhandled upload exception crashing server | High | Backend File Upload |
| 3.1 | HttpClient options passed as request body | High | Frontend Integration |
| 1.3 | Hardcoded JWT secret key ("secret") | Medium | Backend Security |
| 2.2 | Inconsistent `is_admin` schema type mapping | Medium | Backend Database |
| 4.1 | Missing testing modules causing 12 unit test failures | Medium | Frontend Tests |
| 3.2 | Static/Non-functional search input | Low | Frontend UI |
| 3.3 | Misspelled frontend directory (`frondend`) | Low | Project Structure |
