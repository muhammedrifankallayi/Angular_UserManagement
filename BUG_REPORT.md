# Bug Report

This document outlines the security vulnerabilities, logic errors, and environment/configuration issues identified in the JWT project.

## 1. Security Vulnerabilities

### 1.1. Password Leak in Admin Users Endpoint
- **File:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/users` endpoint returns the entire user object, including the hashed password, to the client. The code that should exclude the password is currently commented out.
- **Impact:** Compromises user security by exposing hashed passwords.
- **Suggested Fix:** Uncomment the password exclusion logic in the `/users` route.

### 1.2. Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`
- **Description:** Several administrative endpoints (e.g., `/active`, `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware.
- **Impact:** Any user, or even unauthenticated individuals, can potentially access or modify administrative data.
- **Suggested Fix:** Implement and apply an `auth` middleware to all administrative routes to verify JWTs and admin status.

### 1.3. Hardcoded JWT Secret
- **Files:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** The JWT signing and verification process uses a hardcoded secret string `"secret"`.
- **Impact:** If an attacker knows or guesses the secret, they can forge valid JWTs and gain unauthorized access.
- **Suggested Fix:** Use an environment variable (e.g., `process.env.JWT_SECRET`) for the JWT secret.

### 1.4. Administrator Session Overwrite on User Creation
- **File:** `backend/routes/adminroute.js`
- **Description:** The `/createuser` endpoint, intended for administrators, issues a new JWT cookie for the newly created user.
- **Impact:** When an administrator creates a new user, their own administrative session cookie is overwritten by the new user's token.
- **Suggested Fix:** Remove the code that sets the "jwt" cookie in the `/createuser` endpoint.

### 1.5. Missing CSRF Protection
- **Description:** The application uses cookies for authentication but does not implement Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Users could be tricked into performing unintended actions on the site.
- **Suggested Fix:** Implement CSRF protection middleware in the backend and configure the Angular frontend to handle CSRF tokens.

## 2. Logic Errors

### 2.1. Broken Search Filter in Admin User List
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input in the admin users list is not bound to any property or event in the component logic.
- **Impact:** The search/filter functionality is non-functional.
- **Suggested Fix:** Bind the search input to a component property using `ngModel` or a reactive form control and implement the filtering logic.

### 2.2. Incorrect HttpClient Post Call Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** `HttpClient.post` calls are passing the options object (containing `withCredentials: true`) as the second argument, which Angular treats as the request body.
- **Impact:** The `withCredentials` option is ignored, and an empty/incorrect body is sent, likely causing authentication failures or backend errors.
- **Suggested Fix:** Pass the options object as the third argument to `HttpClient.post`.

## 3. Environment and Configuration Issues

### 3.1. Misspelled Frontend Directory
- **Description:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Can lead to confusion and path-related errors in scripts or documentation.
- **Suggested Fix:** Rename the `frondend` directory to `frontend`.

### 3.2. Missing Backend Start Script
- **File:** `backend/package.json`
- **Description:** There is no `start` script defined in the backend's `package.json`.
- **Impact:** Standard commands like `npm start` will fail.
- **Suggested Fix:** Add `"start": "node index.js"` to the `scripts` section of `backend/package.json`.

### 3.3. Type Inconsistency in User Model
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** Potential data inconsistency or unexpected behavior during database operations.
- **Suggested Fix:** Change the type of `is_admin` to `Boolean`.

## 4. Test Failures

### 4.1. Angular Unit Test Failures
- **Command:** `cd frondend/jwtapp && ./node_modules/.bin/ng test --no-watch --no-progress --browsers=ChromeHeadless`
- **Result:** 12 FAILED, 2 SUCCESS
- **Description:** Most components fail to create due to `NullInjectorError: No provider for HttpClient!`. This indicates that `HttpClientTestingModule` (or a mock provider for `HttpClient`) is missing from the `TestBed` configuration in several spec files.
- **Impact:** Automated tests are not providing reliable feedback on component stability.
- **Suggested Fix:** Update the `spec.ts` files to include necessary providers and modules (e.g., `HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, and mock Store providers).
