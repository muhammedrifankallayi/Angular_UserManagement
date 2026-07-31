# Bug Report

This document outlines the bugs, logical flaws, architectural issues, and security vulnerabilities identified in the project codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **File(s):** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** The JSON Web Token (JWT) secret key used for signing and verifying tokens is hardcoded as the string `"secret"` instead of using an environment variable.
- **Impact:** Compromises the overall security of the authentication system. Attackers with access to the source code can easily forge or modify JWTs to gain unauthorized access to any account.
- **Recommended Fix:** Replace `"secret"` with a secure environment variable retrieved via `process.env.jwtsecret`.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
- **File(s):** `backend/routes/adminroute.js`
- **Description:** Administrative endpoints (such as listing users under `/users`, deleting a user under `/deleteUser/:id`, editing details under `/editDetails/:id`, and updating a user under `/editUser`) lack any middleware to verify that the request is authenticated and originates from an authorized administrator.
- **Impact:** Any user or external actor can directly trigger these administrative routes to retrieve list of all users, modify profile information, or delete users without administrative permissions.
- **Recommended Fix:** Implement and register a `verifyToken` and `isAdmin` check middleware on all admin route handlers.

### 1.3 Sensitive Data Exposure (Password Hash Leak)
- **File(s):** `backend/routes/adminroute.js` (specifically the `/users` GET endpoint)
- **Description:** The backend retrieves all users from MongoDB using `User.find({})` and directly returns the complete object, which includes sensitive hashed password fields (`password`).
- **Impact:** Potential security breach as password hashes are exposed over API responses. Attackers could perform offline dictionary or brute-force attacks on these hashes.
- **Recommended Fix:** Use Mongoose projections to exclude password (e.g., `User.find({}, { password: 0 })`) or manually destructure/delete the `password` field from each returned object before sending.

### 1.4 Missing File Existence Check in Profile Upload
- **File(s):** `backend/routes/routes.js` (specifically the `/profile-upload-single` endpoint)
- **Description:** The file upload handler directly accesses `req.file.filename` inside the DB update without first verifying if a file was actually uploaded.
- **Impact:** If a request is sent to `/profile-upload-single` without a file attachment, the server throws a `TypeError: Cannot read properties of undefined (reading 'filename')` and crashes, causing a denial of service.
- **Recommended Fix:** Add a verification check: `if (!req.file) { return res.status(400).send({ message: "No file uploaded" }); }` before accessing the filename.

### 1.5 Missing CSRF Protection & Wide CORS Settings
- **File(s):** `backend/index.js`
- **Description:** The CORS configuration uses `credentials: true` allowing requests from `'http://localhost:4200'`, but the backend doesn't implement any CSRF protection mechanisms.
- **Impact:** High risk of Cross-Site Request Forgery (CSRF) attacks because cookies containing the authentication JWTs are automatically attached to requests from cross-origin pages.
- **Recommended Fix:** Implement standard double-submit cookie pattern, CSRF tokens, or use modern cookie attributes like `SameSite: Strict/Lax`.

---

## 2. Logic, API and Schema Issues

### 2.1 Inconsistent `is_admin` Field Type
- **File(s):** `backend/models/user.js`
- **Description:** In the Mongoose schema, the `is_admin` field is defined as `String` but its default value is set to `false` (a Boolean).
- **Impact:** This type inconsistency can cause unexpected bugs during truthiness checks and MongoDB queries, where the string `"false"` might be treated as a truthy value, or a boolean `false` might not query correctly against a string type.
- **Recommended Fix:** Redefine `is_admin` with `type: Boolean, default: false`.

### 2.2 overwriting Administrator Session Cookie on Creating User
- **File(s):** `backend/routes/adminroute.js` (specifically the `/createuser` endpoint)
- **Description:** When an admin creates a new user, the backend signs a JWT for the *newly created user* and writes it to the administrator's `jwt` cookie via `res.cookie("jwt", token, ...)`.
- **Impact:** The administrator gets logged out and is automatically re-authenticated as the newly created user, interrupting the administrator's active session.
- **Recommended Fix:** Do not set a new JWT cookie when an admin creates a user. Simply return a success message after user creation.

### 2.3 Incorrect Argument Placement in Angular HTTP Requests
- **File(s):**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (specifically inside `deleteUser()`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (specifically inside `getusers()`)
- **Description:** Both methods make HTTP POST requests using `this.http.post(...)`. However, they pass the request options (such as `{ withCredentials: true }`) as the *second* parameter (the request body), instead of the *third* parameter.
- **Impact:** The POST request body gets set to the options object, and the actual options (such as credentials cookies) are ignored or not sent correctly.
- **Recommended Fix:** Supply an empty object `{}` as the second parameter (the body) and pass the options as the third parameter: `this.http.post(url, {}, { withCredentials: true })`.

### 2.4 Unimplemented Search Feature in Admin Dashboard
- **File(s):** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Description:** The search input in the admin users list is static HTML and is completely unfunctional. There is no binding or implementation in the component logic or the NgRx state management (selectors, actions, or reducers) to filter the list of users based on search queries.
- **Impact:** The administrator cannot filter or search for specific users, resulting in a degraded user experience.
- **Recommended Fix:** Implement search input binding (`ngModel` or Reactive Forms), add state filter logic inside NgRx selectors or component state, and filter the users dynamically.

---

## 3. Code Quality, Directory Architecture and Error Handling

### 3.1 Misspelled Frontend Root Directory Name
- **Description:** The frontend folder in the repository root is named `frondend` instead of `frontend`.
- **Impact:** Confusing directory name that deviates from convention and can lead to path errors in scripts or deployment pipelines.
- **Recommended Fix:** Rename `frondend` to `frontend` and update paths accordingly.

### 3.2 Inadequate Error Handling and Suppressed Exceptions
- **File(s):** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Description:** Numerous backend catch blocks are left empty or only perform a console log (e.g., `catch (error) {}`) without sending any response back to the client.
- **Impact:** If an exception occurs, the HTTP request is left hanging or times out, resulting in a poor user experience. It also masks errors from administrators during production runs.
- **Recommended Fix:** Ensure all catch blocks log the stack trace and respond to the client with an appropriate HTTP error code (e.g., `500 Internal Server Error`).

---

## 4. Automated Testing and Execution Failures

### 4.1 Failing Angular Frontend Unit Tests
- **Description:** Out of 14 Angular unit tests, 12 fail when running `ng test`. The primary causes are:
  - `NullInjectorError: No provider for HttpClient!`
  - `NullInjectorError: No provider for Router!`
- **Impact:** The frontend application lacks verification. Developers cannot run tests to guarantee that changes don't cause regressions.
- **Recommended Fix:** Configure component test suites (`TestBed.configureTestingModule`) in `.spec.ts` files to import `HttpClientTestingModule`, `RouterTestingModule`, and provide necessary NgRx mock stores using `provideMockStore`.
