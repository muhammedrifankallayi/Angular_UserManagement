# Bug Report & Security Audit

This document summarizes security vulnerabilities, backend logic/runtime errors, frontend issues, schema inconsistencies, and test failures identified across the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Files Affected**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: JWT tokens are signed and verified using a hardcoded string `"secret"` (e.g., `jwt.sign({_id:...}, "secret")`) instead of loading a secret key from environment variables (`process.env.jwtsecret` or `process.env.JWT_SECRET`).
- **Impact**: Any attacker who reads the source code can forge valid JWT tokens for any user or administrator.

### 1.2 Missing Authentication & Authorization Middleware on Admin Routes
- **Files Affected**: `backend/routes/adminroute.js`
- **Description**: Several administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not verify JWT cookies or check if the requesting user has administrative privileges (`is_admin: true`).
- **Impact**: Unauthenticated users or non-admin users can view all users, modify user details, delete users, or create new user accounts by making direct HTTP requests.

### 1.3 Exposure of Sensitive Data (User Passwords) in API Responses
- **Files Affected**: `backend/routes/adminroute.js`
- **Description**: The `/api/admin/users` endpoint fetches all user records using `User.find({})` and returns them directly without stripping password hashes or sensitive fields.
- **Impact**: Hashed user passwords and sensitive metadata are exposed to any client calling the `/api/admin/users` endpoint.

### 1.4 Hardcoded Database Connection String
- **Files Affected**: `backend/index.js`
- **Description**: The MongoDB connection URL (`mongodb://127.0.0.1:27017/jwtproject`) is hardcoded directly in `backend/index.js` instead of being retrieved from environment variables (`process.env.MONGODB_URI`).
- **Impact**: Inflexible configuration across development, staging, and production environments; risk of credentials/URI leaking in code.

### 1.5 Missing CSRF Protection
- **Files Affected**: `backend/index.js`
- **Description**: The backend enables CORS credentials (`credentials: true`) for `http://localhost:4200` and uses `httpOnly` cookies for authentication without implementing anti-CSRF token validation on state-changing POST requests.
- **Impact**: Vulnerable to Cross-Site Request Forgery (CSRF) if a user visits a malicious website while authenticated.

---

## 2. Backend Logic & Runtime Errors

### 2.1 Admin User Creation Session Hijacking / Overwrite
- **Files Affected**: `backend/routes/adminroute.js` (`/createuser`)
- **Description**: When an admin creates a new user via `/api/admin/createuser`, the route generates a new JWT token for the newly created user and attaches it to the HTTP response cookie (`res.cookie("jwt", token)`).
- **Impact**: Creating a user causes the admin's active session cookie to be overwritten by the new user's JWT token, effectively logging the administrator out and logging them in as the created user.

### 2.2 Unhandled Null File Upload Crash
- **Files Affected**: `backend/routes/routes.js` (`/profile-upload-single`)
- **Description**: The route accesses `req.file.filename` without checking whether `req.file` exists.
- **Impact**: Submitting a profile upload request without attaching a file results in an unhandled exception (`TypeError: Cannot read property 'filename' of undefined`).

### 2.3 Poor Error Handling & Suppressed Exceptions
- **Files Affected**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Multiple routes use empty `catch (error) {}` blocks or fail to send an HTTP status/response on failure (e.g., in `/profile-upload-single`, `/deleteUser/:id`, `/logout`).
- **Impact**: When errors occur, requests hang indefinitely until timeout, and debugging is hindered by suppressed logs.

### 2.4 Mongoose Model Schema Type Inconsistency
- **Files Affected**: `backend/models/user.js`
- **Description**: The `is_admin` field in `userSchema` is defined with `{ type: String, default: false }`, mixing a String type declaration with a Boolean default (`false`). Route queries check `{ is_admin: true }`.
- **Impact**: Schema type mismatch can lead to unexpected behavior during database queries or data casting issues.

---

## 3. Frontend Issues & Bugs

### 3.1 Incorrect HttpClient `POST` Parameter Placement
- **Files Affected**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: The method calls `this.http.post(url, { withCredentials: true })`, passing the request options object as the second argument (`body`) instead of the third argument (`options`).
- **Impact**: `{ withCredentials: true }` is sent as the request payload while request options are left default (`withCredentials: false`), causing cookies to be omitted from the request and authentication to fail.

### 3.2 Non-Functional Search Input
- **Files Affected**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input element (`<input type="text" placeholder="Search" class="input">`) is purely static HTML and is not bound to component logic, NgRx actions, or filtering selectors.
- **Impact**: Users cannot search or filter the user list in the admin dashboard.

### 3.3 Misspelled Directory Naming
- **Files Affected**: Project structure (`frondend/`)
- **Description**: The frontend root directory is misspelled as `frondend` instead of `frontend`.
- **Impact**: Confusion and inconsistency with standard conventions or automated scripts.

### 3.4 Unit Test Setup & Injection Failures
- **Files Affected**: Angular component spec files in `frondend/jwtapp/src/app/`
- **Description**: Frontend unit tests fail due to missing module providers in `TestBed` configurations (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
- **Impact**: Test suite fails during execution (`ng test`), preventing automated regression checks.
