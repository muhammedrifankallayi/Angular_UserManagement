# Bug Report - JWT Application

## 1. Security Vulnerabilities

### Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** The application uses a hardcoded string `"secret"` for signing and verifying JSON Web Tokens. This makes the system highly vulnerable to token forgery.
- **Suggested Fix:** Use environment variables (e.g., `process.env.JWT_SECRET`) to store the secret.

### Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not check for a valid administrator session. Any user (or even unauthenticated users) can access these endpoints by sending direct HTTP requests.
- **Suggested Fix:** Implement a middleware that verifies the JWT and checks if the user has administrative privileges before allowing access to these routes.

### Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (`/users` endpoint)
- **Description:** The `/api/admin/users` endpoint returns the entire user object from the database, including the hashed passwords.
- **Suggested Fix:** Exclude the `password` field from the database query or the response object.

---

## 2. Logic Errors

### Admin Session Overwritten on User Creation
- **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
- **Description:** When an administrator creates a new user, the server issues a new JWT for the newly created user and sets it in the `"jwt"` cookie. This overwrites the administrator's own session cookie, effectively logging the admin out and logging them in as the new user.
- **Suggested Fix:** Do not issue a new JWT cookie when an administrator is creating a user.

### Model Schema Inconsistency
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String`, but it has a `default: false` (a boolean). This inconsistency can lead to unexpected behavior during database operations or type checks.
- **Suggested Fix:** Change the type to `Boolean`.

---

## 3. Frontend & UI/UX Issues

### Misspelled Directory Name
- **Location:** Root directory
- **Description:** The frontend directory is misspelled as `frondend`.
- **Suggested Fix:** Rename the directory to `frontend`.

### Non-functional Search Bar
- **Location:** `AdminUserlistComponent`
- **Description:** The "Search" input field in the Users List view is present in the HTML template but is not bound to any logic in the TypeScript component. Typing in it does nothing.
- **Suggested Fix:** Implement a filter pipe or a search function that filters the `userdata$` observable based on the input value.

### Incorrect `HttpClient.post` Usage
- **Location:** Various components (e.g., `AdminUserlistComponent`, `AdminUsereditComponent`)
- **Description:** Several `http.post` calls pass `{ withCredentials: true }` as the second argument. In Angular's `HttpClient`, the second argument to `post` is the request body. The options object (including `withCredentials`) should be the third argument.
- **Impact:** Authentication cookies are not being sent with these requests, which would cause them to fail if the backend were properly secured.
- **Suggested Fix:** Move the options object to the third argument: `this.http.post(url, body, { withCredentials: true })`.

---

## 4. Test Failures

### Angular Unit Tests
- **Status:** 12 out of 14 tests failing.
- **Primary Reason:** `NullInjectorError: No provider for HttpClient!`. This occurs because `HttpClientTestingModule` is not imported in the `TestBed` configuration for most component spec files.
- **Other Errors:** `Expected undefined to contain 'jwtapp app is running!'` in `AppComponent`.
- **Suggested Fix:** Update spec files to include necessary mock providers and modules (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
