# Bug Report - JWT Application

This report documents several critical security vulnerabilities, logic errors, and architectural issues identified in the codebase.

## Security Vulnerabilities

### 1. Sensitive Data Leak (Password Hashes)
- **Location:** `backend/routes/adminroute.js`
- **Issue:** The `/api/admin/users` endpoint returns all user data, including hashed passwords. The logic to exclude passwords was commented out.
- **Impact:** Compromises user security by exposing password hashes.

### 2. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret `"secret"` is hardcoded in the codebase for both signing and verification.
- **Impact:** Attackers can easily forge JWT tokens if they have access to the source code or common secret guesses.

### 3. Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`) lack proper authentication/authorization middleware. While some call `/active` for a client-side check, the API endpoints themselves are not fully guarded by backend middleware.
- **Impact:** Unauthorized users could potentially perform administrative actions.

### 4. Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js`
- **Issue:** The `/createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the existing administrator's session cookie.
- **Impact:** The administrator is logged out immediately after creating a new user.

## Logic Errors

### 5. Broken Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field is not bound to any component logic (`ngModel` or event binding), rendering the filter non-functional.
- **Impact:** Administrators cannot search for specific users in the list.

### 6. Incorrect HttpClient Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** Some `HttpClient.post` calls incorrectly pass options (like `withCredentials`) as the second argument instead of the third, which prevents authentication cookies from being sent.
- **Impact:** API calls may fail due to lack of authentication.

### 7. Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as a `String` with a `Boolean` default (`false`).
- **Impact:** Potential runtime errors or unexpected behavior during authentication checks.

## Environment & Structural Issues

### 8. Misspelled Directory Name
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend` throughout the repository.
- **Impact:** Confusion and non-standard project structure.

### 9. Missing Backend Start Script
- **Location:** `backend/package.json`
- **Issue:** No `start` script is defined.
- **Impact:** Users must manually run `node index.js`.

### 10. Failing Frontend Unit Tests
- **Issue:** 12 out of 14 Angular unit tests fail with `NullInjectorError` due to missing providers in `TestBed`.
- **Impact:** Lack of reliable automated testing for the frontend application.
