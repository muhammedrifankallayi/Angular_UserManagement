# Comprehensive Bug & Security Vulnerability Report

## 1. Security Vulnerabilities

### 1.1 Missing Authentication & Authorization Middleware on Admin Routes
- **File**: `backend/routes/adminroute.js`
- **Description**: Most endpoints in `adminroute.js` (such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and admin role authorization checks. Any unauthenticated client or standard user can access, edit, create, or delete user accounts without valid credentials.
- **Impact**: High / Critical - Unauthorized administrative access and data manipulation.

### 1.2 Hardcoded JWT Secret Key
- **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: JWT signing and verification use a hardcoded fallback string (`"secret"`) instead of environment variables (e.g., `process.env.jwtsecret`).
- **Impact**: Medium / High - Insecure token signature generation making session tokens predictable/forgeable if the fallback string is known.

### 1.3 Exposure of Sensitive User Data (Password Hashes)
- **File**: `backend/routes/adminroute.js`
- **Endpoint**: `GET /api/admin/users`
- **Description**: The endpoint fetches all user records (`User.find({})`) and returns them directly in the API response without omitting or stripping the `password` field.
- **Impact**: High - Exposes hashed user passwords to consumers of the API.

### 1.4 Unhandled Profile Upload without File Validation
- **File**: `backend/routes/routes.js`
- **Endpoint**: `POST /profile-upload-single`
- **Description**: The endpoint attempts to access `req.file.filename` without checking if `req.file` exists. Sending a request without an image attachment causes an unhandled rejection / server crash.
- **Impact**: Medium - Potential Denial of Service (DoS) / server error.

### 1.5 Missing CSRF Protection & Permissive CORS Configuration
- **File**: `backend/index.js`
- **Description**: Express application allows `credentials: true` with `httpOnly` cookies, but does not implement CSRF protection (e.g., anti-CSRF tokens or SameSite cookie restrictions).
- **Impact**: Medium - Vulnerable to Cross-Site Request Forgery (CSRF) attacks.

---

## 2. Backend Logic & Schema Errors

### 2.1 Admin Session Overwritten During User Creation
- **File**: `backend/routes/adminroute.js`
- **Endpoint**: `POST /api/admin/createuser`
- **Description**: When an admin creates a new user, the route generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP cookie on the response.
- **Impact**: High - Overwrites the logged-in admin's session cookie with the new user's session, logging out the admin.

### 2.2 Incorrect Data Type for `is_admin` in Mongoose Model Schema
- **File**: `backend/models/user.js`
- **Description**: The schema defines `is_admin` as `type: String` with `default: false` (a boolean). In `adminroute.js`, query filtering checks `is_admin: true`.
- **Impact**: Medium - Type inconsistency causes unexpected behavior when querying or casting boolean flags in Mongoose.

### 2.3 Suppressed Exceptions & Poor Error Handling
- **Files**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description**: Multiple routes wrap database operations in `try/catch` blocks that either catch and suppress errors without sending a response (hanging requests) or only log `error.message`.
- **Impact**: Medium - Causes HTTP requests to time out and obscures underlying runtime exceptions.

---

## 3. Frontend Bugs & Test Failures

### 3.1 Angular HttpClient Options Argument Mismatch
- **Files**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description**: `HttpClient.post` calls pass HTTP options (e.g., `{ withCredentials: true }`) as the 2nd argument (body) instead of the 3rd argument (`HttpClient.post(url, body, options)`).
- **Impact**: High - API requests fail or omit credentials because options are sent as payload data.

### 3.2 Non-Functional Admin User Search Feature
- **File**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search input element in the admin user list template is static HTML and lacks event binding, component handler logic, and state management / selector filtering.
- **Impact**: Low / Medium - Unimplemented user interface functionality.

### 3.3 Failing Angular Unit Tests
- **Directory**: `frondend/jwtapp/`
- **Description**: 12 out of 14 unit tests fail due to missing dependencies in `TestBed` setup (e.g., `NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and unconfigured NgRx MockStore).
- **Impact**: Medium - Incomplete test configuration resulting in test suite failures.

---

## 4. Misspelled Directory Name
- **Location**: `frondend/`
- **Description**: The frontend project directory is named `frondend` instead of `frontend`.
- **Impact**: Low - Naming inconsistency.
