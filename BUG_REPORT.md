# Bug Report

## Backend Vulnerabilities and Issues

### 1. Hardcoded JWT Secret
The backend consistently uses a hardcoded string `"secret"` for JWT signing and verification, despite having a `.env` file with a `jwtsecret` variable.
- **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`

### 2. Missing Authentication and Authorization on Admin Routes
Most routes in `adminroute.js` lack middleware to verify if the user is authenticated or has administrative privileges. This allows unauthenticated users to perform administrative actions if they know the endpoint.
- **Affected Routes:** `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`

### 3. Sensitive Data Exposure
The `/api/admin/users` endpoint returns the full user objects, including the `password` field (hashed), to the client.
- **Affected File:** `backend/routes/adminroute.js`

### 4. Admin Session Overwrite during User Creation
The `/api/admin/createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the administrator's session cookie.
- **Affected File:** `backend/routes/adminroute.js`

### 5. Type Inconsistency in User Model
The `is_admin` field in the User model is defined as a `String`, but it is initialized with a boolean `false`.
- **Affected File:** `backend/models/user.js`

### 6. Poor Error Handling
Multiple routes contain empty `catch` blocks or fail to send a response to the client when an error occurs, leading to hung requests or silent failures.
- **Affected Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`

### 7. Unsafe File Upload
The `/profile-upload-single` route attempts to access `req.file.filename` without verifying if a file was actually uploaded.
- **Affected File:** `backend/routes/routes.js`

---

## Frontend Issues

### 1. Misspelled Directory Name
The root directory for the frontend is misspelled as `frondend`.

### 2. Incorrect HttpClient.post Usage
In administrative components, the `HttpClient.post` method is called with the options object (containing `withCredentials`) as the second argument (body) instead of the third.
- **Affected Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`

### 3. Non-functional Search Component
The search input in the Admin User List is a static HTML element and lacks any implementation in the TypeScript component or NgRx state.
- **Affected File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`

### 4. Failing Unit Tests
Confirmed that 12 out of 14 Angular unit tests are failing. The primary cause is `NullInjectorError: No provider for HttpClient!` and similar errors for `Router` and `Store`, indicating that the test suites are not correctly configured with necessary mock providers or modules like `HttpClientTestingModule` and `RouterTestingModule`.
