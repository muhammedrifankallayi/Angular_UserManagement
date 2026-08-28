# Comprehensive Bug Report

## Executive Summary
This document provides a detailed summary of security vulnerabilities, logic errors, frontend UI bugs, database/schema inconsistencies, and testing gaps identified across the application repository.

---

## 1. Security Vulnerabilities

### Critical / High Severity
1. **Hardcoded Secrets**
   - **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
   - **Issue**: JWT signing and verification calls use a hardcoded fallback string `"secret"` (e.g., `jwt.sign(..., "secret")`) instead of reading from `process.env.jwtsecret`.
   - **Impact**: Anyone with access to the source code can forge valid JWT session tokens and impersonate users or administrators.

2. **Missing Authentication and Authorization Middleware**
   - **Location**: `backend/routes/adminroute.js`
   - **Issue**: Administrative endpoints (`GET /users`, `POST /deleteUser/:id`, `POST /editDetails/:id`, `POST /editUser`, `POST /createuser`) do not check for valid JWT cookies or verify administrative privileges before processing requests.
   - **Impact**: Any unauthenticated user can view, edit, or delete user records or create new user accounts by calling these API endpoints directly.

3. **Sensitive Data Exposure in API Responses**
   - **Location**: `backend/routes/adminroute.js` (`GET /users`)
   - **Issue**: The `GET /users` endpoint fetches all user objects from the database and returns them directly (`res.send(user)`) without omitting the `password` field.
   - **Impact**: Exposes hashed user passwords to the client.

4. **Session Overwriting / Hijacking on User Creation**
   - **Location**: `backend/routes/adminroute.js` (`POST /createuser`)
   - **Issue**: When an administrator creates a new user, the backend signs a JWT for the *newly created user* and sets it as the `jwt` HTTP cookie in the response.
   - **Impact**: The administrator's active session cookie is immediately overwritten with the new user's token, effectively logging out the admin.

5. **Lack of CSRF Protection**
   - **Location**: `backend/index.js`, `backend/routes/routes.js`, `backend/routes/adminroute.js`
   - **Issue**: Cross-origin requests with credentials (`cors({ credentials: true })`) are accepted, but no anti-CSRF token protection is implemented.
   - **Impact**: Susceptible to Cross-Site Request Forgery attacks if an authenticated user visits a malicious website.

---

## 2. Backend Logic & Schema Issues

1. **Unprotected File Upload Crash Vulnerability**
   - **Location**: `backend/routes/routes.js` (`POST /profile-upload-single`)
   - **Issue**: The handler accesses `req.file.filename` directly without checking if `req.file` exists.
   - **Impact**: Sending a request to `/profile-upload-single` without an attached file triggers an unhandled `TypeError: Cannot read property 'filename' of undefined`, causing server crash or unhandled 500 error.

2. **Incorrect Schema Type for `is_admin`**
   - **Location**: `backend/models/user.js`
   - **Issue**: The `is_admin` field is defined as `type: String` with `default: false` (a boolean).
   - **Impact**: Type mismatch between schema definition and default value, causing inconsistencies when querying admin users (e.g., `{ is_admin: true }`).

3. **Inadequate Error Handling and Suppressed Exceptions**
   - **Location**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
   - **Issue**: Multiple route handlers contain empty `catch (error) {}` blocks or fail to send error responses (e.g., `POST /profile-upload-single`, `POST /deleteUser/:id`, `POST /logout`).
   - **Impact**: Clients receive timed-out requests or empty responses when backend exceptions occur, making debugging difficult.

4. **Hardcoded Database Connection String**
   - **Location**: `backend/index.js`
   - **Issue**: Connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of being loaded from environment variables (`process.env.MONGODB_URI`).

---

## 3. Frontend Bugs & UI Issues

1. **Incorrect Parameters in Angular `HttpClient.post` Calls**
   - **Location**:
     - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
     - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
   - **Issue**: `this.http.post(url, { withCredentials: true })` passes `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (options object).
   - **Impact**: Session cookies are not sent with these requests, causing authentication failures or sending unexpected request payloads to the backend.

2. **Non-Functional Search Input**
   - **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
   - **Issue**: The `<input type="text" placeholder="Search" class="input">` element is static HTML and not bound to any event handlers, NgModel, or state selectors in the component or NgRx store.
   - **Impact**: Users cannot search or filter the user list.

3. **Directory Naming Typo**
   - **Location**: Project root directory (`frondend/`)
   - **Issue**: The frontend directory is misspelled as `frondend` instead of `frontend`.

---

## 4. Testing & Infrastructure Gaps

1. **Missing Backend Tests**
   - **Location**: `backend/package.json`
   - **Issue**: No test script or testing framework (e.g., Jest, Supertest, Mocha) is configured in the backend project.

2. **Failing Frontend Unit Tests**
   - **Location**: `frondend/jwtapp/src/app/components/*/*.spec.ts`
   - **Issue**: Frontend component spec files lack necessary mock providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
   - **Impact**: Unit test suite runs with multiple `NullInjectorError` failures.

3. **Missing `start` Script in Backend `package.json`**
   - **Location**: `backend/package.json`
   - **Issue**: `package.json` does not specify a `"start"` script (e.g., `"start": "node index.js"`).

---

## Recommendations
1. Replace hardcoded JWT secrets with `process.env.jwtsecret`.
2. Implement an authentication/authorization middleware function for all protected and admin routes.
3. Exclude sensitive fields like `password` from all API response payloads.
4. Fix `HttpClient.post` argument signatures in frontend components to pass body as parameter 2 and `{ withCredentials: true }` as parameter 3.
5. Update `backend/models/user.js` to set `is_admin` to `type: Boolean`.
6. Bind the search input in `AdminUserlistComponent` to component logic/NgRx state.
7. Configure mock providers in Angular test specs to ensure tests pass cleanly.
