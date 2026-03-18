# Bug Report

This document outlines the identified bugs, security vulnerabilities, and inconsistencies in the JWT Project.

## 1. Security: Sensitive Data Exposure (Passwords Leaked)
- **Location:** `backend/routes/adminroute.js` -> `GET /api/admin/users`
- **Description:** The endpoint retrieves all users from the database and sends the entire user object (including the hashed `password` field) to the frontend.
- **Impact:** High. Exposes hashed passwords of all users to any client accessing this endpoint.
- **Recommended Fix:** Use projection in Mongoose (`User.find({}, '-password')`) or manually remove the password field before sending the response.

## 2. Security: Missing Authentication and Authorization on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Description:** Most administrative endpoints (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack any middleware to verify if the requester is an authenticated administrator.
- **Impact:** Critical. Anyone can delete, edit, or create users if they know the API endpoints.
- **Recommended Fix:** Implement and apply an `auth` middleware that verifies the JWT from cookies and checks the `is_admin` flag.

## 3. Logic Bug: Administrator Session Overwritten on User Creation
- **Location:** `backend/routes/adminroute.js` -> `POST /api/admin/createuser`
- **Description:** When an administrator creates a new user, the backend generates a new JWT for the *newly created user* and sets it in the `jwt` cookie.
- **Impact:** Medium. The administrator is effectively logged out and replaced by the new user session immediately after creating a user.
- **Recommended Fix:** Remove the code that generates and sets a new JWT cookie in the `createuser` endpoint.

## 4. Frontend Bug: Incorrect `HttpClient.post` Usage (Authentication Cookies Missing)
- **Location:**
    - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
    - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers` - which is a POST)
- **Description:** The `withCredentials: true` option is passed as the second argument to `this.http.post()`. In Angular's `HttpClient`, the second argument is the `body`.
- **Impact:** High. The options are treated as the request body, and the actual options (including `withCredentials`) are never applied. Consequently, authentication cookies are not sent with these requests.
- **Recommended Fix:** Pass an empty body `{}` as the second argument and the options as the third argument: `this.http.post(url, {}, { withCredentials: true })`.

## 5. Missing Feature: Admin User Search Not Implemented
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Description:** The UI contains a search input field, but it is not bound to any logic in the component. The user list does not filter based on input.
- **Impact:** Low (UX). The search functionality advertised in the UI does not work.
- **Recommended Fix:** Implement a search filter using a `BehaviorSubject` and `combineLatest` with the user data stream.

## 6. Schema Inconsistency: `is_admin` Type Mismatch
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as `type: String`, but it has a default value of `false` (Boolean).
- **Impact:** Low. May lead to unexpected behavior or type conversion issues when querying or updating the field.
- **Recommended Fix:** Change the type to `Boolean`.

## 7. Infrastructure: Missing `auth` Middleware
- **Location:** `backend/middleware/auth.js`
- **Description:** The middleware required for protecting routes is missing from the filesystem.
- **Impact:** High. Prevents securing the backend routes as intended.
- **Recommended Fix:** Create the `auth.js` middleware to handle JWT verification.

## 8. Directory Naming: Misspelled Frontend Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Low (Maintainability). Can be confusing for developers.
- **Recommended Fix:** Rename `frondend` to `frontend` and update relevant paths (e.g., in `backend/index.js` CORS settings if applicable, though currently it points to localhost).

## 9. Testing: Broken Angular Unit Tests
- **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Description:** 12 out of 14 Angular unit tests fail with `NullInjectorError: No provider for HttpClient!`.
- **Impact:** High. Prevents automated verification of frontend changes.
- **Recommended Fix:** Update test files to include `HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, and `provideMockStore` in `TestBed.configureTestingModule`.
