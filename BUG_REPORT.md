# Comprehensive Bug & Vulnerability Report

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** The string `"secret"` is hardcoded as the JWT signing key across authentication and authorization routes (e.g., `jwt.sign({_id:...}, "secret")` and `jwt.verify(cookie, "secret")`) instead of using the environment variable `process.env.jwtsecret` (defined in `backend/.env`).
* **Impact:** Insecure key handling compromises token security, making signature spoofing easy in production environments.

### 1.2 Missing Authentication & Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Description:** Critical administrative endpoints (such as `GET /users`, `POST /deleteUser/:id`, `POST /editDetails/:id`, `POST /editUser`, and `POST /createuser`) do not verify JWT cookies or check for admin privileges (`is_admin: true`).
* **Impact:** Any unauthenticated user or guest client can invoke administrative endpoints to view, edit, or delete user accounts without permission.

### 1.3 Exposure of Sensitive Password Hashes in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /users` endpoint)
* **Description:** The `GET /api/admin/users` endpoint retrieves user documents using `User.find({})` and directly returns the full array of user objects without stripping the `password` field.
* **Impact:** Password hashes are leaked to client callers, increasing risk for password cracking attacks.

### 1.4 Schema Type Mismatch for `is_admin`
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field in the Mongoose schema is defined with `type: String` but has a boolean default `default: false`. In `adminroute.js`, queries check for `is_admin: true` (boolean comparison).
* **Impact:** Type inconsistency can lead to unexpected database query behavior and authentication failures.

---

## 2. Backend Logic Errors & Quality Issues

### 2.1 Admin Session Cookie Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /createuser` endpoint)
* **Description:** When an administrator creates a new user via `/api/admin/createuser`, the endpoint generates a new JWT token for the newly created user and sets it in the response cookie (`res.cookie("jwt", token, ...)`).
* **Impact:** The logged-in administrator's active session cookie is overwritten with the new user's token, effectively logging the admin out.

### 2.2 Unhandled Null File Upload Exception
* **Location:** `backend/routes/routes.js` (`POST /profile-upload-single` endpoint)
* **Description:** The route handler directly accesses `req.file.filename` without verifying if `req.file` exists (e.g., when a request is submitted without an attached image).
* **Impact:** If no file is uploaded, accessing `req.file.filename` throws an uncaught `TypeError: Cannot read property 'filename' of undefined`, triggering an unhandled route failure.

### 2.3 Silent Error Handling & Suppressed Exceptions
* **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
* **Description:** Multiple try-catch blocks are empty or only log `error.message` to console without sending error response status codes or messages back to the HTTP client (e.g. `POST /deleteUser/:id`, `POST /logout`, `POST /profile-upload-single`).
* **Impact:** Clients receive hanging or empty responses instead of proper HTTP error status codes (e.g., 500 Internal Server Error).

---

## 3. Frontend Bugs & Architectural Defects

### 3.1 Incorrect Directory Naming
* **Location:** Repository Root (`frondend/` vs `frontend/`)
* **Description:** The frontend directory is misspelled as `frondend` in the workspace root.
* **Impact:** Inconsistency in project naming conventions and potential script path mismatches.

### 3.2 Non-Functional User Search Bar
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
* **Description:** The `<input type="text" placeholder="Search" class="input">` in `AdminUserlistComponent` is purely static HTML and is not bound via Angular `[(ngModel)]`, form control, or connected to NgRx selectors/actions for filtering.
* **Impact:** Admin users cannot search or filter the user list.

### 3.3 Incorrect `HttpClient.post` Parameter Format
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` & `admin-useredit.component.ts`
* **Description:** In methods such as `deleteUser` and `getusers`, `http.post(url, { withCredentials: true })` passes the options object as the body parameter (second argument) rather than the HTTP options parameter (third argument).
* **Impact:** `withCredentials` is sent inside the JSON body payload instead of configuring HTTP request headers/credentials, resulting in unauthenticated request failures.

---

## 4. Test Suite & Build Verification Issues

### 4.1 Frontend Unit Test Failures
* **Location:** `frondend/jwtapp/`
* **Description:** Angular unit tests fail due to missing dependencies in test setup (`NullInjectorError: No provider for HttpClient!` and `No provider for Router!`).
* **Impact:** Running frontend test suites results in 12 failing test specs out of 14 total.
