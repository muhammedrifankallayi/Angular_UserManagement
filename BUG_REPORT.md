# Comprehensive Bug Report

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: JWT signing and verification calls use the hardcoded string `"secret"` (e.g., `jwt.sign({_id}, "secret")` and `jwt.verify(cookie, "secret")`) instead of loading the secret key from environment variables (`process.env.jwtsecret`).
- **Impact**: Anyone with access to the source code can forge arbitrary JWT tokens and impersonate any user or administrator.

### 1.2 Unprotected Administrative Endpoints (Missing Authentication/Authorization)
- **Location**: `backend/routes/adminroute.js`
- **Description**: Administrative endpoints lack authentication and authorization checks:
  - `GET /api/admin/users`: returns full user records without checking JWT token or `is_admin` privilege.
  - `POST /api/admin/deleteUser/:id`: deletes user without authenticating request.
  - `POST /api/admin/editDetails/:id`: exposes user details without authentication.
  - `POST /api/admin/editUser`: updates user details without authentication.
  - `POST /api/admin/createuser`: creates user without checking admin privileges.
- **Impact**: Unauthenticated users can view, modify, or delete user records in the database.

### 1.3 Exposure of Sensitive User Data (Password Hashes)
- **Location**: `backend/routes/adminroute.js` - `GET /api/admin/users`
- **Description**: `User.find({})` fetches complete user documents including hashed `password` fields and sends them in the HTTP response.
- **Impact**: Exposes password hashes of all registered users to any requester.

### 1.4 Missing CSRF Protection & Permissive CORS Configuration
- **Location**: `backend/index.js`
- **Description**: CORS is configured with `credentials: true` and `origin: ['http://localhost:4200']` while relying solely on HTTP-only cookies without CSRF token validation or SameSite cookie restrictions.
- **Impact**: Leaves the application susceptible to Cross-Site Request Forgery (CSRF) attacks.

---

## 2. Backend Logic Errors & System Stability

### 2.1 Admin User Creation Overwrites Admin Session Cookie
- **Location**: `backend/routes/adminroute.js` - `POST /api/admin/createuser`
- **Description**: When an admin creates a user via `/api/admin/createuser`, the endpoint generates a new JWT token for the created user and sets `res.cookie("jwt", token, ...)`.
- **Impact**: The administrator's JWT cookie is overwritten with the new user's session token, logging the admin out and logging them in as the created user.

### 2.2 Unhandled Exception on Profile Image Upload
- **Location**: `backend/routes/routes.js` - `POST /api/profile-upload-single`
- **Description**: The route directly reads `req.file.filename` without checking whether `req.file` exists.
- **Impact**: If a request is submitted without an image file or if upload parsing fails, `req.file` is `undefined`, causing an unhandled `TypeError` and crashing the request handler.

### 2.3 Schema Field Data Type Mismatch
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined with `type: String` and `default: false` (a boolean value).
- **Impact**: Leads to type confusion and query inconsistencies between string and boolean comparisons (e.g., `is_admin: true` vs `is_admin: "true"`).

### 2.4 Empty Catch Blocks & Suppressed Exceptions
- **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Multiple route handlers contain empty `catch (error) {}` blocks or log errors without returning an HTTP response to the client.
- **Impact**: Backend failures occur silently and leave HTTP requests hanging indefinitely without proper error status codes or error messages.

---

## 3. Frontend Bugs & Usability Issues

### 3.1 Incorrect HttpClient Post Request Parameter Order
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: `this.http.post(url, { withCredentials: true })` passes options as the second argument (`body`) instead of the third argument (`options`).
- **Impact**: Angular sends `{ withCredentials: true }` as the request body rather than configuring request headers/options, causing cookie credentials to be omitted or request payloads to be malformed.

### 3.2 Non-Functional Admin User Search Bar
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input element `<input type="text" placeholder="Search" class="input">` is static HTML and lacks two-way data binding (`ngModel`), change handlers, or filtering logic in `AdminUserlistComponent` / NgRx selectors.
- **Impact**: User input in the search bar has no effect on filtering the user list.

### 3.3 Unchecked File Reference in Profile Component
- **Location**: `frondend/jwtapp/src/app/components/profile/profile.component.ts`
- **Description**: `onSubmit()` accesses `this.selectedFile.name` without validating if `this.selectedFile` is non-null.
- **Impact**: Submitting the profile form when no file is chosen throws a JavaScript runtime exception (`TypeError: Cannot read properties of null (reading 'name')`).

### 3.4 Frontend Root Directory Naming
- **Location**: Repository Root (`frondend/`)
- **Description**: The frontend directory name contains a typo (`frondend` instead of `frontend`).
- **Impact**: Non-standard directory structure causing potential confusion for tooling and developers.

---

## 4. Testing & Tooling Deficiencies

### 4.1 Missing Backend Test Suite
- **Location**: `backend/package.json`
- **Description**: The backend project does not include any automated unit or integration test suites or test scripts in `package.json`.

### 4.2 Frontend Unit Test Setup Failures
- **Location**: `frondend/jwtapp/src/app/**/*.spec.ts`
- **Description**: Angular component spec tests fail due to missing test module imports and providers (e.g., `HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`) in `TestBed.configureTestingModule`.
