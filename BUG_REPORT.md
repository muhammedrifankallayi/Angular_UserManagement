# BUG REPORT

An audit of the repository has revealed several key issues across security, backend logic, and frontend configuration, as detailed below.

---

## 1. Security Vulnerabilities

### A. Password Hash Leakage in API Responses
- **Issue**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user documents, including the sensitive hashed `password` fields.
- **Impact**: Any user or client consuming the user list endpoint receives bcrypt-hashed password values.
- **Location**: `backend/routes/adminroute.js`, inside the `adminrouter.get('/users', ...)` handler where the code to strip password is commented out.

### B. Unprotected Administrative Endpoints
- **Issue**: There is no authentication or authorization middleware applied to endpoints within `backend/routes/adminroute.js` (such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`).
- **Impact**: Anyone can query, modify, delete, or create users without logging in or verifying admin privileges.
- **Location**: `backend/routes/adminroute.js`.

### C. Hardcoded JWT Secret Key
- **Issue**: The application utilizes a hardcoded string `"secret"` to sign and verify JSON Web Tokens instead of accessing the environment variable.
- **Impact**: Increased risk of token forgery if the source code is compromised, rendering the `.env` value of `jwtsecret` useless.
- **Location**:
  - `backend/routes/routes.js` (JWT signing and verification)
  - `backend/routes/adminroute.js` (JWT signing and verification)

### D. Missing CSRF Protection and Overly Broad CORS Setup
- **Issue**: CORS is configured to allow credentials with `http://localhost:4200` but the application lacks Cross-Site Request Forgery (CSRF) protection mechanisms.
- **Impact**: Potential susceptibility to cross-site request forgery attacks since session management relies on standard HTTP cookies.
- **Location**: `backend/index.js` and cookie settings.

---

## 2. Backend Logic and Data Integrity Issues

### A. `is_admin` Field Schema Type Mismatch
- **Issue**: The `is_admin` field in `backend/models/user.js` has a schema type of `String` but specifies a default value of `false` (boolean).
- **Impact**: Inconsistent state and potential comparison issues when executing checks against `is_admin` across different endpoints.
- **Location**: `backend/models/user.js`.

### B. Overwriting Admin Sessions in `createuser`
- **Issue**: When an administrator creates a new user via `/api/admin/createuser`, the route generates a new token for the created user and updates the administrator's `jwt` cookie.
- **Impact**: The administrator is immediately logged out of their session and authenticated as the newly created user.
- **Location**: `backend/routes/adminroute.js` inside `/createuser` handler.

### C. Potential Crash on Profile Photo Upload
- **Issue**: The `/profile-upload-single` file upload route in `backend/routes/routes.js` lacks validation on `req.file` before reading `req.file.filename`.
- **Impact**: An upload request sent without an attachment (resulting in an undefined `req.file`) will cause the Node process to crash due to a TypeError.
- **Location**: `backend/routes/routes.js` inside `/profile-upload-single`.

### D. Weak Error Handling and Suppressed Exceptions
- **Issue**: Numerous controllers in `backend/routes/adminroute.js` and `backend/routes/routes.js` use catch-blocks that either empty-catch or only log the exception to console without sending an HTTP response.
- **Impact**: The client gets hung indefinitely (timeout) or encounters unexpected behavior without receiving an error status (e.g., 500 Internal Server Error).

---

## 3. Frontend Inconsistencies and Usability Bugs

### A. Misspelled Directory Path
- **Issue**: The frontend directory is named `frondend` instead of the standard spelling `frontend`.
- **Impact**: Increases the likelihood of confusion, path resolution issues in build environments, and non-standard project structures.
- **Location**: Root-level directory name `frondend`.

### B. Non-Functional Search Input
- **Issue**: The search filter input box on the Admin User List view is a static HTML element and lacks binding or controller logic in the Angular component.
- **Impact**: Users cannot search or filter through the list of users.
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`.

### C. Incorrect `HttpClient.post()` Parameter Signature
- **Issue**: Post requests inside `AdminUserlistComponent` and `AdminUsereditComponent` mistakenly provide the options object (e.g., `{ withCredentials: true }`) as the second argument.
- **Impact**: Since `HttpClient.post` expects `(url, body, options)`, the authentication options are treated as the payload body, and cookies are not successfully transmitted with credentials.
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`

---

## 4. Test Suite Analysis

### Angular Unit Test Failures
- **Status**: 12 out of 14 Angular unit tests are failing.
- **Primary Cause**: `NullInjectorError: No provider for HttpClient!` and `No provider for Router!`.
- **Reasoning**: The component spec files do not import `HttpClientTestingModule`, `RouterTestingModule`, or `provideMockStore` for Ngrx, resulting in failure during the dependency injection phase of testing.
- **Impact**: Inability to run continuous integration checks or guarantee stability of the codebase under change.
- **Location**: Spec files inside `frondend/jwtapp/src/app/components/**/*.spec.ts`.
