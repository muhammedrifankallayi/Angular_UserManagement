# Comprehensive Bug and Security Report

## 1. Executive Summary

This report outlines bugs, security vulnerabilities, architectural concerns, and testing deficiencies identified across the application codebase (Backend Node.js/Express API and Frontend Angular application).

---

## 2. Security Vulnerabilities

### 2.1. Hardcoded JWT Secret Key
- **Locations**:
  - `backend/routes/routes.js`: Line 35, Line 57, Line 70, Line 95, Line 116
  - `backend/routes/adminroute.js`: Line 24, Line 47, Line 139
- **Description**: While `backend/.env` defines `jwtsecret="secret"`, the codebase consistently hardcodes `"secret"` into `jwt.sign()` and `jwt.verify()` calls instead of accessing `process.env.jwtsecret`.
- **Impact**: Attackers can forge valid JWT tokens for any user ID, compromising authentication entirely across both regular and admin endpoints.
- **Recommendation**: Load and validate the JWT secret using environment variables (e.g., `process.env.jwtsecret`) and avoid hardcoded default values in production.

### 2.2. Missing Authentication and Authorization on Admin Endpoints
- **Locations**: `backend/routes/adminroute.js`
  - `GET /api/admin/users`
  - `POST /api/admin/deleteUser/:id`
  - `POST /api/admin/editDetails/:id`
  - `POST /api/admin/editUser`
  - `POST /api/admin/createuser`
- **Description**: None of the administrative management routes verify JWT cookies or check if the requesting user possesses administrative permissions (`is_admin: true`). Only `adminrouter.get('/active')` checks the JWT token (and even then, does not verify whether the claims belong to an administrator).
- **Impact**: Any unauthenticated party can list users, retrieve user records, modify user names, delete user accounts, or create new accounts.
- **Recommendation**: Implement reusable authentication (`requireAuth`) and role-based authorization (`requireAdmin`) middleware across all admin routes.

### 2.3. Password Hash Exposure in API Responses
- **Location**: `backend/routes/adminroute.js`: `GET /api/admin/users`
- **Description**: `const user = await User.find({})` fetches all user documents and sends them directly to the client with `res.send(user)` without sanitizing or excluding the `password` field.
- **Impact**: Sensitive hashed passwords are leaked to anyone fetching the user list, exposing them to offline dictionary and brute-force attacks.
- **Recommendation**: Exclude the password field using Mongoose projections, e.g., `User.find({}, '-password')`.

### 2.4. Hardcoded Database Connection String
- **Location**: `backend/index.js`: Line 20
- **Description**: The database connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact**: Inflexible deployment and potential exposure of sensitive credentials if authentication details are embedded.
- **Recommendation**: Configure database connection parameters via environment variables (e.g., `process.env.MONGODB_URI`).

### 2.5. Missing CSRF Protection with Credentials Allowed
- **Location**: `backend/index.js`
- **Description**: CORS is configured with `credentials: true` and cookie-based authentication is used without CSRF tokens (SameSite attribute is not explicitly configured on cookies).
- **Impact**: Increased vulnerability to Cross-Site Request Forgery (CSRF).
- **Recommendation**: Implement CSRF tokens or configure `SameSite: 'strict'` / `'lax'` attributes on the authentication cookie.

---

## 3. Backend Logic and Implementation Bugs

### 3.1. Inconsistent Schema Type for `is_admin`
- **Location**: `backend/models/user.js`: Lines 16-19
- **Description**: The `is_admin` field is defined with `type: String` and default `false` (boolean literal):
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
  However, in `backend/routes/adminroute.js`, it is queried as a boolean:
  ```javascript
  const user = await User.findOne({email:req.body.email, is_admin:true});
  ```
- **Impact**: Mongoose converts boolean values to string representations or encounters mismatching queries depending on insertion format, leading to subtle query bugs and invalid type definitions.
- **Recommendation**: Define `is_admin` as `type: Boolean, default: false`.

### 3.2. Session Overwrite on Admin Create User
- **Location**: `backend/routes/adminroute.js`: Lines 141-144 in `POST /createuser`
- **Description**: When an administrator creates a user, the route signs a JWT for the newly created user and sets it in the response cookie:
  ```javascript
  res.cookie("jwt", token, { httpOnly: true, maxAge: 24*60*60*1000 });
  ```
- **Impact**: The administrator's session cookie is immediately overwritten by the newly created regular user's token, logging the admin out.
- **Recommendation**: Do not issue or set a new authentication cookie when an admin creates a user.

### 3.3. Unhandled Null Pointer Exception in File Upload
- **Location**: `backend/routes/routes.js`: Line 98 in `POST /profile-upload-single`
- **Description**: The route directly accesses `req.file.filename`:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
  If a client submits the request without attaching a file under the field `image`, `req.file` is `undefined`.
- **Impact**: Accessing `req.file.filename` throws a `TypeError: Cannot read properties of undefined (reading 'filename')`. Since the catch block is empty, the request hangs or crashes unhandled.
- **Recommendation**: Validate `req.file` exists before accessing properties and return a `400 Bad Request` if missing.

### 3.4. Swallowed Exceptions and Empty Catch Blocks
- **Locations**:
  - `backend/routes/routes.js`: Line 104 (`/profile-upload-single`), Line 122 (`/profile`)
  - `backend/routes/adminroute.js`: Line 36 (`/login`), Line 44 (`/logout`), Line 74 (`/users`), Line 87 (`/deleteUser/:id`), Line 101 (`/editDetails/:id`), Line 112 (`/editUser`), Line 151 (`/createuser`)
- **Description**: Multiple endpoints feature empty `catch (error) {}` blocks or blocks containing only `console.log(error.message)` without returning an HTTP response to the client.
- **Impact**: When an error occurs, the server never closes the HTTP connection, causing client requests to hang until timeout.
- **Recommendation**: Implement consistent error handling that returns appropriate HTTP error statuses (e.g., `500 Internal Server Error`) and informative JSON error messages.

### 3.5. Misuse of HTTP Status Codes
- **Locations**:
  - `backend/routes/routes.js`: Line 102 (`res.status(401).json({ message: 'Something went wrong' })` when update fails).
- **Description**: `401 Unauthorized` is used for general internal errors or failed updates rather than authentication failures.
- **Recommendation**: Use appropriate status codes (e.g., `500 Internal Server Error` or `400 Bad Request`).

---

## 4. Frontend Bugs and Architectural Issues

### 4.1. Static / Non-Functional Search Input
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`: Line 4
- **Description**: The search input field `<input type="text" placeholder="Search" class="input">` is static HTML without `[(ngModel)]`, reactive form control, or event bindings. The component class contains no search filtering logic or selectors.
- **Impact**: Typing into the search bar has no effect.
- **Recommendation**: Bind the input to an Angular form control or NgRx search filter action to filter user list records dynamically.

### 4.2. Reactive Form Data Binding Conflict in User Edit Component
- **Locations**:
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`: Lines 29-31, 79-88
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.html`: Line 4
- **Description**: The form group is initialized in `ngOnInit` with `name: [this.username]`, which is `undefined` before the async `getusers` API call finishes. When `getusers` completes, `this.username` is set, but `this.form.patchValue({ name: res.name })` is never called. The template attempts interpolation `value="{{username}}"`, which conflicts with `formControlName="name"` in Angular reactive forms.
- **Impact**: Form control retains its initial empty value; submitting may send an empty or unupdated name.
- **Recommendation**: Remove template interpolation on reactive inputs and use `this.form.patchValue({ name: res.name })` upon receiving data.

### 4.3. Unhandled Subscriptions and Memory Leaks
- **Location**: `frondend/jwtapp/src/app/components/profile/profile.component.ts`: Lines 29-34
- **Description**: `userData$` subscribes to `this.store.pipe(select(userProfile))` directly in the property declaration and never unsubscribes.
- **Impact**: Potential memory leak on component creation and destruction.
- **Recommendation**: Use the `async` pipe in the component template or unsubscribe during `ngOnDestroy` (via `takeUntilDestroyed` or `Subject`).

### 4.4. Directory Typo
- **Location**: Root directory `frondend/`
- **Description**: Frontend folder is named `frondend` instead of `frontend`.
- **Impact**: Inconsistency and confusion for developers and CI/CD pipelines.

---

## 5. Testing Deficiencies

### 5.1. Backend Test Coverage
- **Location**: `backend/package.json`
- **Description**: The `test` script is configured as `"echo \"Error: no test specified\" && exit 1"`. There are no automated unit or integration tests for the Express API.
- **Recommendation**: Introduce a testing framework (e.g., Jest or Mocha + Supertest) to test authentication, user CRUD, and middleware.

### 5.2. Frontend Unit Test Failures (NullInjectorError)
- **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Description**: Component unit spec files (e.g., `AdminUserlistComponent`, `AdminUsereditComponent`, `ProfileComponent`, `LoginComponent`, etc.) fail because required providers are missing from `TestBed.configureTestingModule()`. Specifically:
  - Missing `HttpClientTestingModule` (causes `NullInjectorError: No provider for HttpClient!`).
  - Missing `RouterTestingModule` (causes `NullInjectorError: No provider for Router!`).
  - Missing `provideMockStore` from `@ngrx/store/testing` for components injecting `Store`.
- **Recommendation**: Update test bed configurations across all spec files with required mock modules and providers.
