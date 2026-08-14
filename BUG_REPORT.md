# Bug Report

## 1. Architectural & Repository Structure
- **Directory Naming Anomaly**: The frontend directory in the root repository is misspelled as `frondend/` instead of `frontend/`.
- **Hardcoded Database Connection**: `backend/index.js` hardcodes `mongodb://127.0.0.1:27017/jwtproject` rather than using environment variables (`process.env.MONGODB_URI`).

## 2. Security Vulnerabilities
- **Missing Authentication & Authorization Middleware**: Administrative endpoints in `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack authentication and authorization verification middleware. Any unauthenticated user can call these administrative endpoints directly.
- **Sensitive Data Exposure**: Endpoint `GET /api/admin/users` returns complete user documents from MongoDB, including hashed `password` fields.
- **Hardcoded Secrets**: JWT token generation and verification across `backend/routes/routes.js` and `backend/routes/adminroute.js` use a hardcoded secret string (`"secret"`) rather than `process.env.jwtsecret`.
- **Missing CSRF Protection**: Backend CORS configuration allows credentials (`credentials: true`) from `http://localhost:4200` without CSRF token validation on state-changing endpoints.

## 3. Backend Logic & Error Handling
- **Admin Cookie Overwrite on User Creation**: In `POST /api/admin/createuser`, after creating a user, the route sets a new JWT cookie (`res.cookie("jwt", token)`) for the new user, overwriting the administrator's existing session cookie.
- **Profile Image Upload Null Reference**: `POST /profile-upload-single` in `backend/routes/routes.js` attempts to access `req.file.filename` without validating that `req.file` was attached to the request, causing runtime errors when files are omitted.
- **Suppressed Exceptions & Hanging Requests**: Multiple routes in `routes.js` and `adminroute.js` feature empty `catch (error) {}` blocks or failure cases without returning an HTTP response, leaving client requests hanging or timing out.
- **Mongoose Schema Type Mismatch**: In `backend/models/user.js`, the `is_admin` property is declared with `type: String`, but given a default boolean value `default: false`.

## 4. Frontend Logic & UI Issues
- **Incorrect HttpClient POST Options**:
  - `AdminUserlistComponent.deleteUser()` passes `{ withCredentials: true }` as the second argument (request body) to `HttpClient.post()` instead of the third argument (HTTP options).
  - `AdminUsereditComponent.getusers()` passes `{ withCredentials: true }` as the second argument (request body) to `HttpClient.post()` instead of the third argument (HTTP options).
- **Non-Functional User Search Input**: `AdminUserlistComponent` has a static `<input type="text" placeholder="Search" class="input">` element in its template (`admin-userlist.component.html`) that lacks template bindings, event listeners, or NgRx filter integration.

## 5. Testing & Verification Issues
- **Backend Test Suite**: `backend/package.json` does not contain test scripts or test suites.
- **Frontend Unit Test Failures**: Frontend unit test suite in `frondend/jwtapp/` suffers from `NullInjectorError` exceptions due to missing test module providers (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
