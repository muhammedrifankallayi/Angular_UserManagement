# BUG REPORT: Security Vulnerabilities and Logic Issues

This report details security vulnerabilities, functional/logic bugs, and testing issues found within the Node.js/Express backend and Angular frontend codebase.

---

## 1. Project Overview & Architecture

- **Backend**: Node.js and Express server running on port `5000`. Connects to MongoDB at `mongodb://127.0.0.1:27017/jwtproject`.
- **Frontend**: Angular 16 application running on port `4200` (located in the misspelled root directory `frondend/jwtapp`).
- **Authentication**: Cookie-based JWT authentication where the client relies on credential-sharing CORS configuration to send and receive JWT cookies.

---

## 2. Security Vulnerabilities

### 2.1 Unprotected Administrative API Routes
- **File**: `backend/routes/adminroute.js`
- **Description**: Sensitive admin endpoints—such as retrieving all users (`/users`), deleting a user (`/deleteUser/:id`), fetching user edit details (`/editDetails/:id`), and updating a user's details (`/editUser`)—lack any authentication or authorization middleware.
- **Impact**: Any unauthenticated client or standard user can call these APIs directly to modify or extract user details without administrator credentials.

### 2.2 Exposure of Sensitive Password Hashes in API Responses
- **File**: `backend/routes/adminroute.js` (Route: `/users`)
- **Description**: The `/users` route executes `User.find({})` and directly sends the complete array of user documents back to the client. The hashed password field is never projected out or excluded.
- **Impact**: Anyone retrieving the user list can access the bcrypt hashes of all registered users, increasing the risk of offline brute-force attacks.

### 2.3 Hardcoded Cryptographic Secrets
- **Files**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: The JWT signing and verification routines use the hardcoded string `"secret"` (e.g., `jwt.sign({_id: ...}, "secret")` and `jwt.verify(cookie, "secret")`) instead of loading a secure environment variable (e.g., `process.env.jwtsecret`).
- **Impact**: Anyone with access to the source code can easily forge valid administrator or user JWT tokens, bypassing authentication entirely.

### 2.4 Hardcoded MongoDB Connection String
- **File**: `backend/index.js`
- **Description**: The MongoDB connection URI is hardcoded as `'mongodb://127.0.0.1:27017/jwtproject'` inside `mongoose.connect()`.
- **Impact**: Reduces deployment flexibility and leaks database configuration and credentials in production environments.

### 2.5 Lack of CSRF (Cross-Site Request Forgery) Protection
- **File**: `backend/index.js`
- **Description**: The Express application enables credentials-supported CORS for origin `http://localhost:4200` but does not implement any Anti-CSRF protection (e.g., csurf, double-submit cookies, custom headers).
- **Impact**: Because authentication relies on cookies (`jwt`), users logged into the app are highly susceptible to cross-site request forgery attacks from malicious websites.

---

## 3. Logic & Functional Bugs

### 3.1 Administrator Session Overwrite during User Creation
- **File**: `backend/routes/adminroute.js` (Route: `/createuser`)
- **Description**: When an administrator creates a new user, the backend generates a JWT token for the *newly created user* and sets it as the `"jwt"` cookie:
  ```javascript
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{ httpOnly:true, ... });
  ```
- **Impact**: As soon as the administrator creates a user, their own administrator JWT cookie is overwritten. They are instantly logged out of their admin session and logged in as the new user.

### 3.2 Incorrect Angular HttpClient.post Signatures (Options as Body)
- **Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (Method: `deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (Method: `getusers`)
- **Description**: Angular's `HttpClient.post()` expects the signature: `post(url, body, options)`. In the affected code, the options object containing `{ withCredentials: true }` is passed as the *second* parameter (the request body), and the third parameter (options) is omitted:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
- **Impact**: The request is sent with an empty options block (which means `withCredentials` defaults to `false` and credentials cookies are *not* sent), while the body parameter is inappropriately populated with the options object. The API request subsequently fails to authenticate or operate correctly.

### 3.3 Non-Functional User Search Bar
- **Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
- **Description**: The users list component template displays a search input element `<input type="text" placeholder="Search" class="input">` but lacks any two-way data binding (`ngModel`), event binding, or integration with the component controller or NgRx selectors/reducers.
- **Impact**: The search bar is entirely static HTML and has no effect on filtering the displayed users.

### 3.4 Poor Error Handling & Empty Catch Blocks
- **Files**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Several asynchronous router routes contain empty or silent `catch` blocks that swallow exceptions without calling `res.send()` or `res.status().send()`. For example, in `backend/routes/routes.js`:
  ```javascript
  router.post('/profile-upload-single', upload.single('image'), async(req, res)=>{
      try { ... } catch (error) { }
  })
  ```
- **Impact**: If any unhandled exception occurs (such as database disconnects or malformed IDs), the API server silently catches the exception but never closes or responds to the HTTP connection, causing the client request to hang indefinitely until a timeout occurs.

### 3.5 Schema and Type Inconsistency for `is_admin`
- **File**: `backend/models/user.js`
- **Description**: The `is_admin` field in the user Mongoose schema is defined with `type: String` but defaults to a boolean `false`. Queries like `User.findOne({email: ..., is_admin: true})` use boolean constraints, leading to casting inconsistencies and potential logical bugs in queries.
- **Impact**: Inconsistent database state and prone to authentication-bypass bugs or query failures depending on how Mongoose casts booleans to strings.

### 3.6 Lack of File Upload Existence Check
- **File**: `backend/routes/routes.js` (Route: `/profile-upload-single`)
- **Description**: The upload route accesses `req.file.filename` directly inside the `updateOne()` operation without checking if `req.file` actually exists:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
- **Impact**: If the client submits a request without a file attachment (or with an incorrect field name), the backend throws a `TypeError: Cannot read properties of undefined (reading 'filename')`. Since the error is caught by an empty `catch` block, the connection hangs.

### 3.7 Misspelled Frontend Directory Name
- **Description**: The Angular application resides in a directory named `frondend/` rather than `frontend/` in the repository root.
- **Impact**: Non-standard naming convention that leads to confusion and potential path resolution issues in build and deployment scripts.

---

## 4. Testing and Build Issues

### 4.1 Frontend Unit Test Failures
- **Description**: Running frontend unit tests with `ng test` results in **12 out of 14 tests failing**.
- **Root Cause**: The unit tests (spec files) do not configure their `TestBed` dependencies properly. Most components inject `HttpClient` and `Router` but their corresponding test specifications fail to import or provide:
  - `HttpClientTestingModule`
  - `RouterTestingModule`
  - `provideMockStore` (for NgRx-integrated components)
- **Impact**: Development workflows lack reliable automated feedback loops to ensure code changes do not cause regressions.
