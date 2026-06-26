# Bug Report

## 1. Security: Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js` (lines 25, 54, 150) and `backend/routes/routes.js` (lines 36, 62, 78, 106, 127).
- **Description:** The application uses a hardcoded string `"secret"` for JWT signing and verification instead of a secure environment variable.
- **Impact:** High. If the secret is compromised, an attacker can forge valid JWT tokens and gain unauthorized access to any user account.

## 2. Security: Missing Authentication/Authorization Middleware in Admin Routes
- **Location:** `backend/routes/adminroute.js` (routes `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`).
- **Description:** Sensitive administrative endpoints lack middleware to verify if the requester is authenticated and has administrative privileges.
- **Impact:** High. Any unauthenticated user can list, create, edit, or delete users by sending requests directly to these endpoints.

## 3. Logic/Security: Admin Session Overwrite
- **Location:** `backend/routes/adminroute.js:152` (within `/createuser` endpoint).
- **Description:** When an administrator creates a new user, the backend generates a JWT for the new user and sets it as a cookie. This overwrites the administrator's own session cookie.
- **Impact:** Medium. The administrator is effectively "logged out" or switched to the new user's session after creating a user.

## 4. Security: Sensitive Data Exposure (Password)
- **Location:** `backend/routes/adminroute.js:77` (within `/users` endpoint).
- **Description:** The `/api/admin/users` endpoint returns the full user document, including the hashed password, to the frontend.
- **Impact:** Medium. While hashed, exposing passwords unnecessarily is a security risk and violates the principle of least privilege.

## 5. Logic: User Model Type Mismatch
- **Location:** `backend/models/user.js:16`.
- **Description:** The `is_admin` field is defined as a `String` but is initialized with a boolean default (`false`) and is conceptually a boolean.
- **Impact:** Low. Can lead to confusing behavior or query failures if comparisons are not handled carefully.

## 6. Logic: Missing File Existence Check in Profile Upload
- **Location:** `backend/routes/routes.js:113`.
- **Description:** The code attempts to access `req.file.filename` without first verifying that `req.file` is defined.
- **Impact:** Low/Medium. The server will crash (uncaught exception) if a request is made to this endpoint without an attached file.

## 7. Frontend: Incorrect HttpClient.post Usage
- **Location:**
    - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts:42`
    - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts:72, 82`
- **Description:** In several places, `this.http.post` is called with request options (e.g., `{ withCredentials: true }`) passed as the second argument (the request body) instead of the third.
- **Impact:** Medium. Requests will fail or behave unexpectedly because the body will contain options instead of data, and `withCredentials` will not be set correctly.

## 8. Frontend: Non-functional Search Feature
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html:4`.
- **Description:** The user list includes a search input field, but it is static HTML with no corresponding logic in the component to filter the displayed users.
- **Impact:** Low. Functional regression/missing feature.

## 9. Structural: Misspelled Frontend Directory
- **Location:** Root directory.
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Low. Affects project clarity and developer experience.

## 10. Tests: Failing Frontend Unit Tests
- **Location:** `frondend/jwtapp/`.
- **Description:** 12 out of 14 frontend unit tests are failing. The primary cause is `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` is not imported in the test suites.
- **Impact:** Medium. Lack of reliable automated testing makes it difficult to ensure code quality and prevent regressions.
