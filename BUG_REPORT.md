# Comprehensive Bug Report

This bug report provides a detailed breakdown of security vulnerabilities, logic errors, API misconfigurations, frontend component defects, and testing issues identified across the application codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** JWT tokens are signed and verified using the hardcoded string `"secret"` (e.g., `jwt.sign({_id: ...}, "secret")`) instead of loading the secret from environment variables (`process.env.jwtsecret`).
- **Impact:** High. Hardcoded secrets can be easily extracted from source code, allowing attackers to forge arbitrary JWT tokens and compromise authentication.

### 1.2 Missing Authentication and Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js` (`/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`)
- **Description:** Endpoints such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, and `POST /api/admin/editUser` do not verify JWT cookies or check if the requesting user is an administrator.
- **Impact:** Critical. Unauthenticated users can view, edit, or delete any user account without authorization.

### 1.3 Disclosure of Sensitive User Password Hashes in API Responses
- **Location:** `backend/routes/adminroute.js` (`GET /users`)
- **Description:** The `GET /api/admin/users` endpoint returns raw user objects from MongoDB using `User.find({})` without stripping out the `password` hash field.
- **Impact:** High. Exposes bcrypt password hashes of all registered users to anyone querying the user list endpoint.

### 1.4 Type Inconsistency in User Model (`is_admin`)
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field in `userSchema` is defined as `type: String` with `default: false` (a boolean).
- **Impact:** Medium. Schema type mismatch can lead to unexpected behavior during database queries (e.g. querying `{ is_admin: true }` vs string comparisons).

### 1.5 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Description:** Cross-Origin Resource Sharing (CORS) is configured with `credentials: true` for `http://localhost:4200`, but there is no Anti-CSRF token mechanism or CSRF cookie/header validation implemented.
- **Impact:** Medium. Authenticated sessions using HTTP-only cookies are susceptible to Cross-Site Request Forgery attacks if exploited from allowed cross-origins.

---

## 2. Backend Logic Errors & System Deficiencies

### 2.1 Admin Create User Session Hijacking / Overwrite
- **Location:** `backend/routes/adminroute.js` (`POST /createuser`)
- **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the *newly created user* and attaches it to the response cookie `res.cookie("jwt", token, ...)` instead of keeping the admin's cookie intact.
- **Impact:** High. Creating a user instantly overwrites the administrator's JWT cookie, replacing their admin session with the newly created user's session.

### 2.2 Profile Upload Unhandled Exception / Crash
- **Location:** `backend/routes/routes.js` (`POST /profile-upload-single`)
- **Description:** The `/profile-upload-single` route accesses `req.file.filename` directly without validating whether `req.file` exists. If a request is sent without a file payload, `req.file` is `undefined`, causing an unhandled exception.
- **Impact:** Medium. Can lead to server errors / unhandled request failures.

### 2.3 Poor Exception Handling and Suppressed Errors
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description:** Multiple routes contain empty `catch (error) {}` blocks or catch blocks that log `console.log(error.message)` without sending an HTTP response to the client (e.g., `router.post('/profile-upload-single')`, `adminrouter.post('/deleteUser/:id')`).
- **Impact:** Low-Medium. Causes client HTTP requests to hang until timeout when an error occurs server-side.

### 2.4 Missing npm `start` Script in Backend Configuration
- **Location:** `backend/package.json`
- **Description:** The `package.json` file in `backend/` lacks a standard `"start": "node index.js"` script in its `scripts` section.
- **Impact:** Low. Developers or automated scripts expecting `npm start` in backend will encounter errors.

---

## 3. Frontend Component & Logic Defects

### 3.1 Incorrect Options Parameter in `HttpClient.post` Calls
- **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
- **Description:** In Angular's `HttpClient.post(url, body, options)`, `{ withCredentials: true }` was passed as the second argument (`body`) instead of the third argument (`options`). For POST requests without a body (like `deleteUser` or `editDetails`), the options object was treated as the body payload and sent without credentials header config.
- **Impact:** High. Causes authentication cookies to be omitted in cross-site requests, leading to request authorization failures.

### 3.2 Non-functional Admin User List Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input element `<input type="text" placeholder="Search" class="input">` in the template is static HTML. It lacks `[(ngModel)]`, event listeners, or corresponding filtering logic in `AdminUserlistComponent` / NgRx selectors.
- **Impact:** Low. The search bar UI component does not filter users as expected.

### 3.3 Misspelled Root Frontend Directory
- **Location:** Root directory
- **Description:** The frontend application directory is misspelled as `frondend/` instead of `frontend/`.
- **Impact:** Low. Minor repository naming inconsistency.

---

## 4. Frontend Testing Issues

### 4.1 Unit Test Failures across Angular Component Specs
- **Location:** `frondend/jwtapp/src/app/components/*/*.spec.ts`
- **Description:** Running Angular unit tests (`ng test`) yields failures across multiple component specs due to missing dependencies in `TestBed` setups (`NullInjectorError: No provider for HttpClient!`, `No provider for Router!`, and missing Store providers).
- **Impact:** High. 12 of 14 default Angular tests fail. Specs require `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` in `TestBed.configureTestingModule`.
