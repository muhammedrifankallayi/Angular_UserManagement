# Comprehensive Bug & Vulnerability Report

This report documents the security vulnerabilities, logic errors, architectural defects, and UI/UX issues found in the JWT Project. The project consists of a Node.js/Express backend (`backend/`) and an Angular 16 frontend (`frondend/jwtapp/`).

---

## 1. Executive Summary
The JWT Project suffers from several critical security vulnerabilities and logical errors that compromise user data, session security, and overall application stability. Additionally, the frontend application contains broken functionality (such as a non-functional search feature and incorrectly structured HTTP POST calls) and extensive failing unit tests (12 of 14 failing).

Addressing these issues is critical to making the application secure, functional, and maintainable.

---

## 2. Backend Vulnerabilities & Security Issues

### 2.1. Hardcoded JWT Secret String
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Both the user and administrator route files use the hardcoded string `"secret"` for JWT signing and verification (e.g., `jwt.sign(claims, "secret")` and `jwt.verify(cookie, "secret")`).
* **Impact:** High. If source code is leaked, the JWT signing secret is compromised, allowing attackers to forge valid tokens and gain unauthorized access to any user or administrator account.
* **Remediation:** Retrieve the JWT secret securely from environmental variables using `process.env.jwtsecret` (configured in `backend/.env`).

### 2.2. Completely Unprotected Administrative Endpoints (No Auth/Admin Middleware)
* **Location:** `backend/routes/adminroute.js`
* **Description:** Most of the administrative endpoints (including `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`) do not implement any authentication or authorization middleware checks. They do not parse or verify the incoming JWT cookies to ensure the requester is a logged-in administrator.
* **Impact:** Critical. Any unauthenticated attacker can query, create, edit, or delete any user in the database simply by sending HTTP requests directly to these backend endpoints.
* **Remediation:** Introduce a robust authentication/authorization middleware that verifies the user's JWT cookie and checks that `is_admin === true` (or matches the admin schema) before granting access to admin routes.

### 2.3. Sensitive Information Disclosure (Passwords Sent to Client)
* **Location:** `backend/routes/adminroute.js` (inside `/users` endpoint)
* **Description:** In the `/api/admin/users` endpoint, the query returns all user documents including their hashed password fields:
  ```javascript
  const user = await User.find({})
  // const {password, ...data} = await user.toJSON(); // Commented out / non-functional
  res.send(user)
  ```
  Since the destructuring line is commented out and cannot be called on an array anyway, the raw user documents (with `password` hashes) are sent directly to the client.
* **Impact:** High. Attackers or malicious clients can harvest hashed user passwords, which can then be cracked offline.
* **Remediation:** Exclude the `password` field from the Mongoose query projection (e.g., `User.find({}, '-password')`) or map the array of user documents to omit the password property before sending the response.

### 2.4. Lack of Cross-Site Request Forgery (CSRF) Protection
* **Location:** `backend/index.js`
* **Description:** The backend configures CORS to accept credentials from `http://localhost:4200` and relies solely on HTTP-only cookies for authentication, but does not implement any form of CSRF protection (e.g., anti-CSRF tokens or `SameSite` cookie attributes).
* **Impact:** High. Users are vulnerable to CSRF attacks where malicious third-party websites can trigger authenticated actions (such as changing profiles, registering, or deleting users) in the user's browser context.
* **Remediation:** Implement standard CSRF protection middleware or enforce strict `SameSite=Strict` cookie attributes if applicable.

---

## 3. Backend Logic & Error Handling Bugs

### 3.1. User Schema Type Inconsistency (`is_admin`)
* **Location:** `backend/models/user.js`
* **Description:** The `is_admin` field in the user schema is defined as a `String` type with a default of `false` (which is a boolean):
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
* **Impact:** Medium. This type mismatch leads to inconsistent querying behavior. For example, querying `is_admin: true` (boolean) might fail if the database stores the value as a string representation `"false"`.
* **Remediation:** Change the schema type of `is_admin` to `Boolean` to match its intended usage and default value.

### 3.2. Empty Catch Blocks & Suppressed Exceptions (Client Hangs)
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
* **Description:** Multiple routes (e.g., `/profile-upload-single`, `/profile`, `/deleteUser/:id`, `/logout`) use try-catch blocks with entirely empty `catch` blocks or blocks that only log to `console.log`.
* **Impact:** High. If an exception is thrown inside these routes, the execution stops, and no response is sent back to the client. The client request will hang indefinitely until timing out, leading to a degraded UI experience and difficulty debugging.
* **Remediation:** Always return a proper HTTP response status (e.g., 500 Internal Server Error) with a meaningful JSON error message in the catch block.

### 3.3. File Upload Route Crash/Hang on Missing File
* **Location:** `backend/routes/routes.js` (inside `/profile-upload-single` endpoint)
* **Description:** The route uses `multer` for handling profile image uploads but immediately accesses `req.file.filename` without verifying if `req.file` is defined:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
* **Impact:** Medium. If a user triggers a profile upload without attaching a file, `req.file` is `undefined`, causing a `TypeError: Cannot read properties of undefined (reading 'filename')`. Since the error is swallowed by an empty catch block, the client request hangs.
* **Remediation:** Check for the existence of `req.file` before attempting to access its properties, and return a 400 Bad Request if no file was uploaded.

### 3.4. Session Overwrite on Admin User Creation
* **Location:** `backend/routes/adminroute.js` (inside `/createuser` endpoint)
* **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the *newly created user* and calls `res.cookie("jwt", token, ...)` to write it to the client's cookies.
* **Impact:** High. This overwrites the administrator's own session cookie with that of the newly created user, automatically logging the administrator out and logging them in as the newly created user.
* **Remediation:** Do not set a new JWT session cookie on the administrator's client when they are merely creating a user account. The endpoint should only return a success message.

---

## 4. Frontend Bugs & UI/UX Issues

### 4.1. Misplaced Angular HttpClient Options in POST Requests (Broken functionality)
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Description:** In Angular's `HttpClient`, the signature for `post()` is `post(url, body, options)`. In the following files, request options containing `{ withCredentials: true }` are passed as the second argument (the request body):
  - **In AdminUserlistComponent:**
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
      withCredentials: true
    })
    ```
  - **In AdminUsereditComponent:**
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`, {
      withCredentials: true
    })
    ```
* **Impact:** High. Because the options object is treated as the request body, no actual configuration options are set. Consequently, the request is sent without credentials (`withCredentials: true`), meaning the cookie containing the JWT is omitted from the request, leading to authorization failures.
* **Remediation:** Pass `null` or the correct payload object as the second argument (body) and the options object as the third argument:
  ```typescript
  this.http.post(url, null, { withCredentials: true })
  ```

### 4.2. Completely Non-Functional Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
* **Description:** The UI renders a search bar:
  ```html
  <input type="text" placeholder="Search" class="input">
  ```
  However, this input element is not bound to any Angular form control or event handler, and there is no logic in the component, state, selectors (`app.selectors.ts`), or NgRx store to filter users based on query strings.
* **Impact:** Medium UI/UX bug. The input box is a dead/static element that does not work.
* **Remediation:** Bind the search input to a search query property or form control, and filter the user list displayed in the table (either via a component-level filter or an NgRx selector).

### 4.3. Misspelled Frontend Directory Name
* **Location:** Root directory
* **Description:** The directory containing the frontend Angular application is misspelled as `frondend` instead of `frontend`.
* **Impact:** Minor. It increases friction for new developers, violates naming standards, and can break automated scripts.

---

## 5. Frontend Unit Test Failures

### 5.1. Summary of Failing Tests
Out of 14 Angular unit tests, 12 are currently failing.
* **Command to run:** `cd frondend/jwtapp && ./node_modules/.bin/ng test --no-watch --no-progress --browsers=ChromeHeadless`
* **Primary Cause (NullInjectorError):**
  - Most components fail with: `NullInjectorError: No provider for HttpClient!` or `No provider for Router!` or state store errors.
* **Impact:** High. Lack of a passing test suite means code health cannot be automatically verified, leading to regressions and high maintenance overhead.
* **Remediation:** Update `spec` files to import `HttpClientTestingModule`, `RouterTestingModule`, and provide necessary mock stores (e.g., using `provideMockStore()`).

---

## 6. Recommendations & Action Plan
To resolve these issues and secure the application, we recommend:
1. **Secure the backend:** Implement robust middleware to verify JWTs and admin permissions, replace hardcoded secrets with `process.env.jwtsecret`, sanitize user list payloads to exclude passwords, and correct the `is_admin` schema type.
2. **Correct logic errors:** Fix file upload checks to prevent hung requests and remove session-overwriting cookie writes during user creation.
3. **Fix frontend integrations:** Correct the `HttpClient.post` signatures to correctly pass the credentials flag, and implement the search filter functionality.
4. **Clean up tests and directories:** Resolve the `NullInjectorError` issues in spec files to achieve a 100% passing test suite.
