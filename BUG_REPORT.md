# Bug Report

This report documents identified security vulnerabilities, logic errors, type inconsistencies, infrastructure issues, and test failures in the project.

## 1. Security Issues

### 1.1 Hardcoded JWT Secrets
The backend hardcodes the JWT secret as `"secret"` in `backend/routes/routes.js` and `backend/routes/adminroute.js`.
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Impact:** Compromises security; secrets should be stored in environment variables.

### 1.2 Missing Admin Authorization Middleware
Administrative endpoints in `backend/routes/adminroute.js` lack proper authorization checks. There is no middleware to verify if the requesting user has administrative privileges before allowing access to user management features.
- **Location:** `backend/routes/adminroute.js`
- **Impact:** Unauthorized users can potentially access and modify user data.

### 1.3 Password Leak in Admin User List
The `/api/admin/users` endpoint returns full user objects, including hashed passwords, because the exclusion logic is commented out.
- **Location:** `backend/routes/adminroute.js` (line 78)
- **Impact:** Exposes sensitive user credentials.

### 1.4 Admin Session Overwrite on User Creation
The `/createuser` endpoint in the admin routes issues a new JWT cookie for the newly created user, which overwrites the administrator's existing session cookie.
- **Location:** `backend/routes/adminroute.js` (lines 148-152)
- **Impact:** Logged-in administrators are forcibly logged out or session-hijacked into the new user's account upon creating a user.

## 2. Logic Errors

### 2.1 Broken Search in Admin User List
The search input in the `AdminUserlistComponent` template is not connected to any logic in the component.
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Impact:** Users cannot filter the user list.

### 2.2 Incorrect HttpClient.post Usage
In `AdminUserlistComponent` and `AdminUsereditComponent`, the `withCredentials` option is passed as the second argument to `this.http.post`. However, `HttpClient.post` expects the body as the second argument and options as the third.
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Impact:** Requests may fail or fail to send authentication cookies, as the options object is treated as the request body.

## 3. Type Inconsistencies

### 3.1 is_admin Type Mismatch
In the User model, `is_admin` is defined as a `String` but has a `Boolean` default (`false`).
- **Location:** `backend/models/user.js` (line 21)
- **Impact:** Data type inconsistency can lead to unexpected behavior during database queries and logic checks.

## 4. Infrastructure Issues

### 4.1 Misspelled Frontend Directory
The frontend root directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Confusing directory structure and potential issues with scripts or documentation.

### 4.2 Missing Backend Start Script
The `backend/package.json` file lacks a `start` script.
- **Impact:** Users must know to run `node index.js` manually rather than using the standard `npm start`.

## 5. Test Failures

### 5.1 Angular Unit Test Failures
Running `npm test` in the `frondend/jwtapp/` directory results in 12 failures out of 14 tests.
- **Primary Cause:** `NullInjectorError: No provider for HttpClient!`. This indicates that `HttpClientTestingModule` (or `HttpClient`) is not provided in the `TestBed` configuration of the component spec files.
- **Affected Components:** `AdminNavComponent`, `RegisterComponent`, `AdminUsereditComponent`, `AdminUserlistComponent`, `DashboardComponent`, `ProfileComponent`, `HomeComponent`, `LoginComponent`, and others.
- **Impact:** The frontend codebase lacks reliable automated verification.
