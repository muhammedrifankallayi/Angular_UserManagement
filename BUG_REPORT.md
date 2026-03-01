# Bug Report

## 1. Security Vulnerability: Missing Authentication/Authorization on Admin Routes
**Description:** Administrative endpoints in `backend/routes/adminroute.js` (including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`) lack any authentication or authorization middleware.
**Impact:** Any unauthenticated user can access, list, edit, or delete users by directly calling these API endpoints.
**Recommended Fix:** Implement and apply a middleware that verifies the JWT cookie and ensures the `is_admin` flag is set to `true`.

## 2. Logic Error: Admin Session Overwrite during User Creation
**Description:** In `backend/routes/adminroute.js`, the `/createuser` endpoint creates a new JWT for the newly created user and sets it as the `jwt` cookie.
**Impact:** When an administrator creates a new user via this endpoint, their own administrative session cookie is overwritten by the new user's cookie, effectively logging the admin out and potentially logging them in as the new user.
**Recommended Fix:** Remove the code that sets the `jwt` cookie in the `/createuser` endpoint.

## 3. Data Integrity: Type Mismatch for `is_admin` Field
**Description:** The `User` model in `backend/models/user.js` defines the `is_admin` field as a `String`, but provides a default value of `false` (a boolean).
**Impact:** This inconsistency can lead to unpredictable behavior during truthiness checks and may cause authorization logic to fail if it expects a boolean value.
**Recommended Fix:** Change the type of `is_admin` to `Boolean` in the Mongoose schema.

## 4. Frontend Bug: Incorrect Angular `HttpClient.post` Usage
**Description:** Several components in the frontend (`AdminUsereditComponent`, `AdminUserlistComponent`) call `this.http.post(url, options)` instead of `this.http.post(url, body, options)`.
**Impact:** The `options` object (containing `withCredentials: true`) is sent as the request body instead of being used as request options. Consequently, authentication cookies are not included in these requests, leading to "unauthenticated" errors from the backend.
**Recommended Fix:** Correct the `http.post` calls to include an empty body `{}` as the second argument when no data is being sent.
