# BUG REPORT

## Security Vulnerabilities

### Password Leaks
- **Endpoint:** `/api/admin/users` in `backend/routes/adminroute.js`
- **Issue:** The endpoint returns all user records including hashed passwords. The code to exclude the password field is currently commented out.
- **Verification:** Observed in `backend/routes/adminroute.js` around line 76: `// const {password, ...data} = await user.toJSON();`.

### Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware. Any user can potentially access these routes if they know the URL.
- **Verification:** No middleware is applied to these routes in `backend/routes/adminroute.js`.

### Hardcoded JWT Secrets
- **Files:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Issue:** The JWT signing and verification processes use a hardcoded secret string `"secret"`. While there is a `.env` file with `jwtsecret="secret"`, it is not consistently used across all routes.
- **Verification:** Found multiple instances of `jwt.sign(..., "secret")` and `jwt.verify(..., "secret")` in both route files.

### Administrative Session Overwriting
- **Endpoint:** `/api/admin/createuser` in `backend/routes/adminroute.js`
- **Issue:** When an administrator creates a new user, the backend issues a new JWT for the newly created user and sets it in the `jwt` cookie. This overwrites the administrator's own session cookie, effectively logging them out as an admin and potentially logging them in as the new user.
- **Verification:** Observed in `backend/routes/adminroute.js` within the `createuser` route where `res.cookie("jwt", token, ...)` is called after creating a new user.

## Logic Errors and Model Inconsistencies

### Broken Search in User List
- **Component:** `AdminUserlistComponent`
- **Issue:** The search input in the component template (`admin-userlist.component.html`) is not bound to any property or event in the component class. As a result, users cannot filter the list by name or email.
- **Verification:** Observed in `admin-userlist.component.html`: `<input type="text" placeholder="Search" class="input">`.

### Incorrect `HttpClient.post` Usage
- **Components:** `AdminUserlistComponent` and `AdminUsereditComponent`
- **Issue:** `HttpClient.post` calls in several methods (e.g., `deleteUser`, `editUser`, `getusers`) incorrectly pass the options object as the second argument instead of the third. This causes the request body to be an empty object or the options object itself, and parameters like `withCredentials: true` are ignored.
- **Verification:** Observed in `AdminUserlistComponent.deleteUser`: `this.http.post(url, { withCredentials: true })` and `AdminUsereditComponent.getusers`: `this.http.post(url, { withCredentials: true })`.

### User Model Type Inconsistency
- **Model:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as a `String` type but has a `Boolean` default value of `false`. This can lead to unexpected behavior during database queries and type checks in the application.
- **Verification:** Observed in `backend/models/user.js`: `is_admin: { type: String, default: false }`.

## Environment and Test Issues

### Misspelled Frontend Directory
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend` in the root directory. This inconsistency can cause confusion and potential issues with scripts and documentation.
- **Verification:** Observed in the root directory structure: `frondend/`.

### Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** The `package.json` file in the `backend` directory does not contain a `start` script. Users must manually run `node index.js` or similar, which is not standard for Node.js projects.
- **Verification:** Checked `backend/package.json` and found only a `test` script.

### Failing Angular Unit Tests
- **Issue:** There are 12 failing unit tests in the frontend application out of a total of 14 tests. Most failures are due to `NullInjectorError`, indicating missing providers like `HttpClient` in the test configurations.
- **Verification:** Ran `npm test` in `frondend/jwtapp/` and observed `TOTAL: 12 FAILED, 2 SUCCESS`.
