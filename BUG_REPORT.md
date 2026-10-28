# Comprehensive Bug Report

This document details all security vulnerabilities, logic errors, database schema inconsistencies, UI component issues, and test setup failures identified across the backend and frontend codebases.

---

## 1. Security Vulnerabilities

### 1.1 Unprotected Administrative Routes (Missing Auth & Authorization Middleware)
- **Severity**: Critical
- **Location**: `backend/routes/adminroute.js`
- **Affected Endpoints**:
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editDetails/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`
- **Description**: These administrative routes lack authentication (JWT verification) and authorization (admin check) middleware. Any unauthenticated client or regular user can access, query, modify, or delete user accounts without valid credentials.
- **Recommended Fix**: Implement middleware that verifies the JWT cookie and confirms the requesting user's `is_admin` status before processing requests in `adminroute.js`.

### 1.2 Sensitive Data Exposure (Exposed Hashed Passwords)
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (`GET /api/admin/users`)
- **Description**: The `/users` endpoint returns full user objects retrieved via `User.find({})` directly to the client without stripping out sensitive fields like `password`.
- **Recommended Fix**: Use projection or map user objects to exclude the `password` field (e.g., `User.find({}, { password: 0 })`).

### 1.3 Hardcoded JWT Secret Key
- **Severity**: High
- **Location**: `backend/routes/routes.js` & `backend/routes/adminroute.js`
- **Description**: JWT signing and verification calls use a hardcoded string `"secret"` (e.g., `jwt.sign({...}, "secret")`, `jwt.verify(cookie, "secret")`) instead of loading from environment variables (`process.env.jwtsecret`).
- **Recommended Fix**: Replace `"secret"` literals with `process.env.jwtsecret` across all JWT operations.

---

## 2. Backend Logic Errors & Schema Issues

### 2.1 Admin Session Cookie Overwrite on User Creation
- **Severity**: High
- **Location**: `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
- **Description**: When an administrator creates a new user, the route signs a JWT for the newly created user and attaches it to `res.cookie("jwt", token)`. This immediately overwrites the administrator's JWT cookie, logging out the admin and authenticating them as the new user.
- **Recommended Fix**: Do not issue or set a new JWT cookie when an administrator creates a user account.

### 2.2 Unhandled Null File Pointer in Profile Upload
- **Severity**: Medium
- **Location**: `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Description**: The route accesses `req.file.filename` directly without checking whether `req.file` exists. If a request is sent without a file payload, `req.file` is `undefined`, causing an unhandled `TypeError`.
- **Recommended Fix**: Add a check `if (!req.file)` and return an appropriate HTTP status response (e.g., `400 Bad Request`).

### 2.3 Mongoose Schema Type Mismatch for `is_admin`
- **Severity**: Medium
- **Location**: `backend/models/user.js`
- **Description**: The `is_admin` schema field is defined as `type: String` with a default value of boolean `false`. Mixing string types with boolean defaults causes type inconsistencies and potential Mongoose query mismatches.
- **Recommended Fix**: Update `is_admin` field definition to `type: Boolean, default: false`.

### 2.4 Error Handling & Swallowed Exceptions
- **Severity**: Medium
- **Location**: `backend/routes/routes.js` & `backend/routes/adminroute.js`
- **Description**: Multiple `try...catch` blocks swallow exceptions (empty `catch` blocks or `catch (error) { console.log(...) }`) without sending an HTTP error response back to the client. This causes client HTTP requests to hang until timeout.
- **Recommended Fix**: Ensure all `catch` blocks log errors and return an error status (e.g., `res.status(500).json({ message: error.message })`).

---

## 3. Frontend Logic & UI Issues

### 3.1 HTTP POST Parameter Misplacement for `withCredentials`
- **Severity**: High
- **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description**: In Angular's `HttpClient.post(url, body, options)`, the object `{ withCredentials: true }` is passed as the second argument (`body`) instead of the third argument (`options`). Consequently, cookies are not included in the request headers and dummy body payloads are sent.
- **Recommended Fix**: Pass `{ withCredentials: true }` as the third parameter (`options`), e.g., `this.http.post(url, {}, { withCredentials: true })`.

### 3.2 Non-Functional Search Input
- **Severity**: Low
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description**: The search bar `<input type="text" placeholder="Search" class="input">` is static HTML without `[(ngModel)]`, event handlers, or integration with NgRx selectors to filter the user list.
- **Recommended Fix**: Bind the input to a component property/event and filter the user list in the component or via NgRx selectors.

---

## 4. Testing & Architectural Issues

### 4.1 Angular Unit Test Failures (`NullInjectorError`)
- **Severity**: Medium
- **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description**: Frontend unit tests fail due to missing module imports and providers in `TestBed.configureTestingModule()`. Components requiring `HttpClient`, `Router`, or NgRx `Store` lack `HttpClientTestingModule`, `RouterTestingModule`, `ReactiveFormsModule`, and `provideMockStore()`.
- **Recommended Fix**: Add necessary testing modules and providers to all `.spec.ts` files.

### 4.2 Frontend Directory Naming Misspelling
- **Severity**: Low
- **Location**: Repository root (`frondend/`)
- **Description**: The directory containing the Angular project is misspelled as `frondend` instead of `frontend`.
- **Recommended Fix**: Rename directory `frondend` to `frontend` and update references if applicable.
