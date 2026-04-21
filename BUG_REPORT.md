# Bug Report

This report documents the security vulnerabilities, logic errors, and structural issues found in the JWT Application.

## 1. Security Vulnerabilities

### 1.1 Password Leak
- **Location**: `backend/routes/adminroute.js`
- **Issue**: The `/api/admin/users` endpoint returns the full user objects from the database, including hashed passwords. The code to exclude the password is currently commented out.

### 1.2 Unprotected Administrative Endpoints
- **Location**: `backend/routes/adminroute.js`
- **Issue**: Most administrative endpoints (delete, edit, list users) are missing authentication and authorization middleware. Any user can potentially access these endpoints if they know the URL.

### 1.3 Hardcoded JWT Secrets
- **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`, and `backend/.env`
- **Issue**: The secret key used for signing and verifying JWTs is hardcoded as `"secret"`. This should be a secure, environment-specific value.

### 1.4 Missing CSRF Protection
- **Issue**: The application does not implement Cross-Site Request Forgery (CSRF) protection. Since it uses cookies for authentication with `withCredentials: true`, it is vulnerable to CSRF attacks.

### 1.5 Session Overwrite on User Creation
- **Location**: `backend/routes/adminroute.js` (`/createuser` endpoint)
- **Issue**: When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, which overwrites the administrator's own session cookie.

## 2. Logic & Frontend Errors

### 2.1 Broken User Search
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue**: The search input field is not connected to any component logic or data filtering mechanism, making it non-functional.

### 2.2 Incorrect HttpClient.post Usage
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `AdminUsereditComponent`
- **Issue**: The `http.post` calls pass the options object (containing `withCredentials`) as the second argument (the request body) instead of the third argument. This causes the credentials (cookies) not to be sent and sends the options object as the body.

### 2.3 Type Inconsistency in User Model
- **Location**: `backend/models/user.js`
- **Issue**: The `is_admin` field is defined with `type: String` but has a `default: false` (Boolean). This inconsistency can lead to unexpected behavior during queries or data validation.

## 3. Environment & Structural Issues

### 3.1 Misspelled Directory
- **Issue**: The frontend directory is misspelled as `frondend` instead of `frontend` throughout the repository.

### 3.2 Missing Backend Start Script
- **Location**: `backend/package.json`
- **Issue**: There is no `"start"` script defined. The server must be started manually using `node backend/index.js`.

### 3.3 Angular Unit Test Failures
- **Issue**: 12 out of 14 Angular unit tests are currently failing with `NullInjectorError` because required providers (like `HttpClient`, `Store`, `Router`, etc.) are not configured in the test suites.
