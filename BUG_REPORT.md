# Bug Report & Code Audit

This document provides a comprehensive bug report and code audit for the application, covering both the Express backend (`backend/`) and Angular frontend (`frondend/jwtapp/`).

---

## 1. Security Vulnerabilities

### SEC-01: Administrative Routes Lack Authentication & Authorization Middleware
- **Severity**: Critical
- **Location**: `backend/routes/adminroute.js`
  - Routes affected:
    - `GET /api/admin/users`
    - `POST /api/admin/deleteUser/:id`
    - `POST /api/admin/editDetails/:id`
    - `POST /api/admin/editUser`
    - `POST /api/admin/createuser`
- **Description**: While `GET /api/admin/active` checks for a JWT cookie, none of the mutation or data-fetching endpoints above verify the presence or validity of an authentication cookie, nor do they check if the requesting user has `is_admin: true`.
- **Impact**: Any unauthenticated user or client can query all users, edit user accounts, delete users, or create new users simply by issuing HTTP requests to these endpoints.
- **Remediation**: Implement an authentication and admin authorization middleware function (e.g., `verifyAdminToken`) that verifies the JWT cookie and checks that `user.is_admin === true` before proceeding to the route handler.

### SEC-02: Hardcoded JWT Secret Key
- **Severity**: Critical
- **Location**:
  - `backend/routes/routes.js` (lines 35, 61, 74, 102, 122)
  - `backend/routes/adminroute.js` (lines 25, 45, 137)
- **Description**: All JWT token signing (`jwt.sign`) and verification (`jwt.verify`) operations use the literal string `"secret"` rather than retrieving the secret from environment variables (`process.env.jwtsecret`), despite `dotenv` being loaded.
- **Impact**: Anyone with access to the source code can forge valid JWT tokens for any user or administrator ID, completely bypassing authentication.
- **Remediation**: Update all references to `jwt.sign` and `jwt.verify` to use `process.env.jwtsecret` (or a defined environment variable such as `process.env.JWT_SECRET`), and ensure a fallback error is thrown if the environment variable is not defined.

### SEC-03: Password Hashes Leaked in User Queries
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (lines 53–61)
- **Description**: In the `GET /api/admin/users` endpoint, `User.find({})` is called, and the raw user documents are sent directly to the client:
  ```javascript
  const user = await User.find({})
  // const {password, ...data} = await user.toJSON();
  console.log(user);
  res.send(user)
  ```
- **Impact**: Every user's hashed password is leaked across the network to anyone fetching the user list.
- **Remediation**: Exclude the password field either in the Mongoose query (`User.find({}, '-password')` or `.select('-password')`) or omit the password field before sending the response.

### SEC-04: File Upload Lacks Validation and Error Handling
- **Severity**: Medium
- **Location**: `backend/routes/routes.js` (lines 98–111)
- **Description**: In the `/api/profile-upload-single` endpoint:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
  If a client makes a request without uploading a file, `req.file` is `undefined`, causing `req.file.filename` to throw a `TypeError: Cannot read properties of undefined (reading 'filename')`.
  Furthermore, `multer` does not restrict file types (e.g. executable uploads) or enforce file size limits.
- **Impact**: Unhandled server errors cause request hangs; unrestricted uploads can lead to arbitrary file storage on the server.
- **Remediation**: Check if `req.file` exists before accessing properties. Configure Multer with `fileFilter` to accept only valid image mime types and set file size limits (`limits: { fileSize: ... }`).

### SEC-05: Missing CSRF Protection & Insecure Cookie Flags
- **Severity**: Medium
- **Location**: `backend/index.js` (CORS and cookie parsing setup)
- **Description**: Authentication cookies (`jwt`) are set with `httpOnly: true`, but lack `sameSite: 'strict'` or `sameSite: 'lax'`, and there is no Cross-Site Request Forgery (CSRF) protection (such as `csurf` or double-submit cookies) despite allowing credentials across origins.
- **Impact**: Vulnerable to CSRF attacks where an external malicious webpage triggers state-changing actions (e.g., deleting users, updating profiles) in an authenticated session.
- **Remediation**: Implement CSRF tokens for state-changing HTTP requests, and configure cookies with `sameSite: 'lax'` or `'strict'`, as well as `secure: true` in production environments.

---

## 2. Backend Logic Defects

### BE-01: Admin User Creation Overwrites Admin Session Cookie
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (lines 135–144)
- **Description**: When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the newly created user and sets it in the response cookie:
  ```javascript
  const {_id} = await result.toJSON();
  const token = jwt.sign({_id:_id},"secret");

  res.cookie("jwt",token,{
      httpOnly:true,
      maxAge:24*60*60*1000
  })
  ```
- **Impact**: As soon as an administrator adds a new user, the admin's own cookie is replaced with the newly created regular user's token. The administrator is immediately logged out of their administrative session.
- **Remediation**: Remove `jwt.sign` and `res.cookie` from the `/createuser` endpoint. Return a success message or the created user details without modifying cookies.

### BE-02: User Schema `is_admin` Field Has Type Inconsistency
- **Severity**: Medium
- **Location**: `backend/models/user.js` (lines 15–18)
- **Description**: In `userSchema`:
  ```javascript
  is_admin:{
      type:String,
      default:false
  }
  ```
  The field type is declared as `String`, but assigned a boolean default `false`. In `adminroute.js`, queries search for `{ is_admin: true }` (boolean).
- **Impact**: Type casting quirks can lead to unexpected behavior during database queries and comparisons (e.g., `"false"` being truthy in JavaScript).
- **Remediation**: Change `type: String` to `type: Boolean` in `backend/models/user.js`.

### BE-03: Silent Exception Suppression in Empty Catch Blocks
- **Severity**: Medium
- **Location**:
  - `backend/routes/routes.js`: lines 108–110
  - `backend/routes/adminroute.js`: lines 39–41, 83–85, 105–107
- **Description**: Multiple try/catch blocks catch errors but do nothing in the `catch` block (neither sending an HTTP response nor returning):
  ```javascript
  } catch (error) {

  }
  ```
- **Impact**: If an error occurs in these endpoints (e.g. database error, missing file, etc.), the request hangs indefinitely until the client connection times out.
- **Remediation**: Send appropriate error responses (e.g., `res.status(500).json({ message: "Internal server error" })`) and log error messages.

### BE-04: Non-RESTful HTTP Methods for Fetching Data
- **Severity**: Low
- **Location**: `backend/routes/adminroute.js` (lines 73–87)
- **Description**: The `/editDetails/:id` endpoint performs a read-only query to fetch a user by ID, but is configured as `adminrouter.post(...)`.
- **Impact**: Violates REST conventions, prevents HTTP caching, and creates confusion.
- **Remediation**: Change the route to `GET /user/:id` or `GET /editDetails/:id`.

---

## 3. Frontend Logic & Component Defects

### FE-01: `HttpClient.post` Options Passed as Request Body Parameter
- **Severity**: High
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (lines 38–40)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (lines 75–77)
- **Description**: In Angular's `HttpClient`, `post` signature is `post(url, body, options)`.
  In `deleteUser` and `getusers`, the options object `{ withCredentials: true }` is passed as the second argument:
  ```typescript
  // AdminUserlistComponent:
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })

  // AdminUsereditComponent:
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
    withCredentials: true
  })
  ```
- **Impact**: The object `{ withCredentials: true }` is sent as the request JSON payload, and the options parameter defaults to standard settings (`withCredentials: false`). As a result, credentials/cookies are NOT sent with the request.
- **Remediation**: Pass a request body (e.g. `{}` or `null`) as the second argument, and pass options `{ withCredentials: true }` as the third argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

### FE-02: Non-Functional Search Input in Admin User List
- **Severity**: Low
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Description**: The search input element `<input type="text" placeholder="Search" class="input">` is completely unattached to any Angular form control, `[(ngModel)]`, or `(input)` event handler. The component and NgRx selectors have no filtering logic implemented.
- **Impact**: Typing into the search bar has zero effect on the table.
- **Remediation**: Bind the input to a component property or form control and implement filtering logic either in the component or via an NgRx selector.

---

## 4. Testing & Quality Assurance Issues

### QA-01: Angular Unit Tests Fail Due to Missing Providers
- **Severity**: High
- **Location**: `frondend/jwtapp/src/app/**/*.spec.ts` (12 component spec files)
- **Description**: Running `ng test` results in 12 out of 14 unit tests failing with errors such as:
  - `NullInjectorError: No provider for HttpClient!`
  - `NullInjectorError: No provider for Router!`
  - `NullInjectorError: No provider for Store!`
  - `NullInjectorError: No provider for FormBuilder!`
- **Impact**: Frontend unit test suite cannot execute or pass, leaving components without automated regression testing.
- **Remediation**: Update test suite configurations in `*.spec.ts` to include:
  - `HttpClientTestingModule`
  - `RouterTestingModule`
  - `provideMockStore(...)`
  - `ReactiveFormsModule` / `FormsModule`

### QA-02: Backend Completely Lacks Automated Tests
- **Severity**: Medium
- **Location**: `backend/package.json`
- **Description**: The backend test script is configured to fail:
  `"test": "echo \"Error: no test specified\" && exit 1"`
  There are no test runners (e.g. Jest, Mocha, Supertest) or test suites for API endpoints.
- **Impact**: Backend route changes cannot be verified automatically.
- **Remediation**: Add Jest and Supertest, and implement integration test suites for authentication and admin CRUD routes.

---

## 5. Architecture & Configuration Issues

### ARCH-01: Frontend Directory Typo
- **Severity**: Low
- **Location**: Root directory name `frondend/`
- **Description**: The frontend project directory is misspelled as `frondend` instead of `frontend`.
- **Impact**: Causes confusion and potential path resolution issues in build/CI scripts.
- **Remediation**: Rename directory to `frontend/`.

### ARCH-02: Hardcoded Database Connection String
- **Severity**: Low
- **Location**: `backend/index.js` (line 19)
- **Description**: The MongoDB URI is hardcoded to `'mongodb://127.0.0.1:27017/jwtproject'`.
- **Impact**: Application cannot connect to different database environments (e.g., containerized setups, MongoDB Atlas, staging/production servers) without code modification.
- **Remediation**: Use `process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jwtproject'`.

### ARCH-03: Missing Backend Start Script
- **Severity**: Low
- **Location**: `backend/package.json`
- **Description**: `backend/package.json` lacks a `"start"` script.
- **Impact**: Standard command `npm start` does not work; developers must run `node index.js`.
- **Remediation**: Add `"start": "node index.js"` to `scripts` in `backend/package.json`.

---

## 6. Summary Matrix

| Issue ID | Category | Title | Severity | Impact | Status |
|---|---|---|---|---|---|
| **SEC-01** | Security | Unprotected Administrative Endpoints | Critical | Unauthorized users can view/modify/delete users | Open |
| **SEC-02** | Security | Hardcoded JWT Secret (`"secret"`) | Critical | Forgery of JWT tokens | Open |
| **SEC-03** | Security | Password Hash Exposure in `/users` | High | User password hashes leaked across API | Open |
| **SEC-04** | Security | Missing Validation in File Uploads | Medium | Potential server error or unrestricted file uploads | Open |
| **SEC-05** | Security | Missing CSRF Protection & Insecure Cookies | Medium | Risk of Cross-Site Request Forgery | Open |
| **BE-01** | Backend Logic | Admin Session Overwrite on `/createuser` | High | Admin logged out when creating user | Open |
| **BE-02** | Backend Logic | `is_admin` Field Type Inconsistency | Medium | Potential query and type casting bugs | Open |
| **BE-03** | Backend Logic | Silent Error Suppression in Empty Catch Blocks | Medium | Unhandled errors hang client connections | Open |
| **BE-04** | Backend Logic | RESTful Violation on Data Fetching Endpoint | Low | Non-standard API design | Open |
| **FE-01** | Frontend Logic | `HttpClient.post` Options Sent as Request Body | High | Authentication cookies not sent in POST requests | Open |
| **FE-02** | Frontend Logic | Search Bar in Admin User List Non-Functional | Low | Search UI does not filter users | Open |
| **QA-01** | Testing | Failing Frontend Unit Tests (`NullInjectorError`) | High | Automated frontend tests fail | Open |
| **QA-02** | Testing | No Backend Test Suite | Medium | No automated backend test coverage | Open |
| **ARCH-01** | Architecture | Misspelled Directory Name (`frondend`) | Low | Developer and tooling friction | Open |
| **ARCH-02** | Architecture | Hardcoded MongoDB Connection URI | Low | Inflexible deployment across environments | Open |
| **ARCH-03** | Architecture | Missing `start` Script in Backend | Low | Standard `npm start` fails | Open |
