# BUG REPORT - JWT PROJECT

A comprehensive audit of the JWT project codebase has identified several critical security vulnerabilities, logic errors, model schema inconsistencies, and testing/environment issues. Below is a detailed report of these findings.

---

## 1. Security Vulnerabilities

### 1.1 Password Leaks in API Responses
- **File & Endpoint:** `backend/routes/adminroute.js` -> `/api/admin/users`
- **Description:** The administrative endpoint `/api/admin/users` returns all user records from the database directly to the client. Crucially, the sensitive `password` field (which contains bcrypt hashes) is included in the response. The line of code designed to exclude passwords:
  ```javascript
  // const {password, ...data} = await user.toJSON();
  ```
  is commented out, and the raw array `user` is sent instead.
- **Impact:** Attackers or unauthorized users could harvest password hashes for offline brute-force or dictionary attacks.

### 1.2 Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`
- **Description:** None of the administrative routes (such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`) implement any form of authentication or authorization middleware. Any user or anonymous client can query, delete, edit, or create users simply by calling these endpoints.
- **Impact:** Complete compromise of administrative functions and user data access.

### 1.3 Hardcoded JWT Secrets
- **Files:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Both backend route files hardcode the JWT secret string as `"secret"` instead of using the environment variable `process.env.jwtsecret` which is defined in `backend/.env`.
  - In `backend/routes/routes.js`: `jwt.sign({_id:_id},"secret")` and `jwt.verify(cookie,"secret")`
  - In `backend/routes/adminroute.js`: `jwt.sign({_id:user._id},"secret")` and `jwt.verify(cookie,"secret")`
- **Impact:** Use of hardcoded secrets exposes the application to credential theft and signature forgery if the source code is compromised.

### 1.4 Administrative Session Overwriting on User Creation
- **File & Endpoint:** `backend/routes/adminroute.js` -> `/api/admin/createuser`
- **Description:** When an administrator creates a new user, the route issues a new JWT token for the *newly created user* and stores it in the browser's `jwt` cookie via `res.cookie("jwt", token, ...)`.
- **Impact:** The administrator's session cookie is immediately overwritten, logging them out of their administrative session and potentially logging them in as the newly created user.

---

## 2. Logic Errors and Model Inconsistencies

### 2.1 Broken User Search Filter
- **Component:** `AdminUserlistComponent` (`frondend/jwtapp/src/app/components/admin-userlist/`)
- **Description:** The search input box in `admin-userlist.component.html` is a static HTML element:
  ```html
  <input type="text" placeholder="Search" class="input">
  ```
  It lacks any binding (`ngModel` or `formControl`) or event handlers to trigger search logic in `admin-userlist.component.ts`. The state selectors also do not implement search/filtering functionality.
- **Impact:** The search input is entirely non-functional.

### 2.2 Incorrect `HttpClient.post` Signatures
- **Components:** `AdminUserlistComponent` and `AdminUsereditComponent`
- **Description:** In Angular's `HttpClient`, `post(url, body, options)` expects the request configuration (such as `withCredentials: true`) to be the **third** argument. However, several methods pass options as the second argument:
  - `AdminUserlistComponent.deleteUser`:
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
    ```
  - `AdminUsereditComponent.getusers`:
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, { withCredentials: true })
    ```
- **Impact:** The request body is set to the options object, the true headers/options are ignored, and cookies (credentials) are not sent with the requests.

### 2.3 User Model Type Inconsistency
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` schema field is defined with type `String` but has a boolean default value:
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
- **Impact:** Storing boolean defaults or actual boolean values in a string field leads to schema confusion, inconsistent query results, and brittle type-checks.

### 2.4 Missing File Existence Check in Profile Upload Route
- **File & Endpoint:** `backend/routes/routes.js` -> `/profile-upload-single`
- **Description:** The file upload handler directly accesses `req.file.filename` without checking if `req.file` exists:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
- **Impact:** If a user submits a request without attaching a file, the server encounters a type error (`Cannot read properties of undefined (reading 'filename')`) and crashes or fails to respond gracefully.

---

## 3. Environment, Configuration, and Testing Problems

### 3.1 Misspelled Frontend Directory Name
- **Description:** The frontend workspace folder at the repository root is misspelled as `frondend` instead of `frontend`.
- **Impact:** Introduces friction and increases errors during configuration, deployment, and automated builds.

### 3.2 Missing Start Script in Backend Configuration
- **File:** `backend/package.json`
- **Description:** The backend configuration lacks a `start` script under `scripts` to execute the entrypoint `node index.js`.
- **Impact:** Standard tooling and orchestrators cannot start the backend using `npm start`.

### 3.3 Failing Angular Unit Tests
- **Description:** Running tests in `frondend/jwtapp/` results in 12 failures out of 14 specs.
- **Root Cause:** The `TestBed` setups in component spec files (e.g., `dashboard.component.spec.ts`, `profile.component.spec.ts`, etc.) are missing critical dependencies and mock providers:
  - `NullInjectorError: No provider for HttpClient!` (requires `HttpClientTestingModule`)
  - `NullInjectorError: No provider for Router!` (requires `RouterTestingModule`)
  - `NullInjectorError: No provider for Store!` (requires `provideMockStore`)
- **Impact:** Continuous integration pipelines are broken, and code reliability cannot be automatically verified.
