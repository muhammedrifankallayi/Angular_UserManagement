# Bug Report

This report documents the security vulnerabilities, logic errors, and environment issues identified in the project.

## 1. Security Vulnerabilities

### 1.1 Password Leak in Admin Users Endpoint
- **Location**: `backend/routes/adminroute.js`
- **Issue**: The `/api/admin/users` endpoint returns the full user objects from the database, including hashed passwords. The logic to exclude passwords is currently commented out.
- **Impact**: Exposure of hashed passwords for all users to any authenticated (or unauthenticated, see 1.3) user accessing the endpoint.

### 1.2 Hardcoded JWT Secret
- **Location**: `backend/routes/adminroute.js`, `backend/routes/routes.js`, `backend/.env`
- **Issue**: The secret key used for signing and verifying JSON Web Tokens (JWT) is hardcoded as `"secret"`.
- **Impact**: If an attacker knows the secret, they can forge valid JWTs and gain unauthorized access to any account.

### 1.3 Unprotected Administrative Endpoints
- **Location**: `backend/routes/adminroute.js`
- **Issue**: There is no middleware to verify if the requesting user has administrative privileges or is even authenticated for several routes. The `backend/middleware/auth.js` file is missing.
- **Impact**: Any user can potentially access administrative functions like listing all users, editing user details, or deleting users.

### 1.4 Missing CSRF Protection
- **Issue**: The application uses cookies for authentication but lacks Cross-Site Request Forgery (CSRF) protection.
- **Impact**: Users could be tricked into performing unintended actions on the site if they are logged in.

## 2. Logic Errors

### 2.1 Broken User Search
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue**: The search input field is present in the template but is not bound to any component logic or filtering mechanism.
- **Impact**: The search functionality is completely non-functional for the administrator.

### 2.2 Incorrect HttpClient Usage
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue**: In several `http.post` calls, the options object (containing `withCredentials: true`) is passed as the second argument (the request body) instead of the third argument.
- **Impact**: The `withCredentials` option is ignored, and the request body is sent as `[object Object]`. This prevents authentication cookies from being sent to the backend.

### 2.3 Field Type Inconsistency
- **Location**: `backend/models/user.js`
- **Issue**: The `is_admin` field is defined with `type: String` but has a default value of `false` (a boolean).
- **Impact**: Potential issues with data integrity and unexpected behavior when querying or updating the `is_admin` status.

### 2.4 Administrative Session Overwrite
- **Location**: `backend/routes/adminroute.js` ( `/createuser` endpoint)
- **Issue**: When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, which overwrites the administrator's own session cookie.
- **Impact**: The administrator is effectively logged out and logged in as the new user after creating them.

## 3. Environment & Configuration Issues

### 3.1 Misspelled Frontend Directory
- **Issue**: The frontend directory is named `frondend` instead of `frontend` throughout the repository.
- **Impact**: Confusing project structure and potential issues with scripts or documentation that expect the standard naming.

### 3.2 Missing Backend Start Script
- **Location**: `backend/package.json`
- **Issue**: There is no `start` script defined.
- **Impact**: Standard commands like `npm start` will fail, requiring manual execution via `node index.js`.

### 3.3 Failing Angular Unit Tests
- **Location**: `frondend/jwtapp/`
- **Issue**: 12 out of 14 unit tests fail with `NullInjectorError`.
- **Impact**: Lack of reliable automated testing for the frontend components. Fix requires adding `provideMockStore`, `HttpClientTestingModule`, `FormsModule`, and `RouterTestingModule` to the `TestBed` configuration.
