# Project Bug Report & Vulnerability Assessment

This report provides a comprehensive review of the security vulnerabilities, logical bugs, and general/architectural issues identified in the repository.

---

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secret Key
- **File(s):**
  - `backend/routes/routes.js`
  - `backend/routes/adminroute.js`
- **Description:** JWT signatures and verifications are done using a hardcoded string literal `"secret"` directly in the code (e.g., `jwt.sign(..., "secret")` and `jwt.verify(..., "secret")`).
- **Impact:** Critical. Anyone with access to the source code can easily craft and sign valid JWTs to forge sessions and escalate privileges to any user or administrator.
- **Recommended Fix:** Extract the secret key to an environment variable. Utilize `process.env.jwtsecret` (which is configured in the `.env` file and loaded via `dotenv`).

---

### 1.2. Missing Authentication & Authorization on Administrative Routes
- **File(s):**
  - `backend/routes/adminroute.js`
- **Description:** Sensitive administrative endpoints—such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`—lack any authentication/authorization checks. They are exposed directly to any HTTP request.
- **Impact:** Critical. Unauthorized users can query lists of all registered users, delete users, modify details, or create accounts without presenting any valid administrative credentials.
- **Recommended Fix:** Implement and mount a robust middleware that:
  1. Parses the JWT cookie and verifies its validity.
  2. Queries the user document and checks that `is_admin` is set to `true` (or the string representation "true").
  Return `401 Unauthorized` or `403 Forbidden` if these checks fail.

---

### 1.3. Information Leakage (User Password Hashes Exposed)
- **File(s):**
  - `backend/routes/adminroute.js` (specifically the `/users` endpoint)
- **Description:** The `/users` administrative endpoint queries all user accounts via `User.find({})` and directly responds with the full MongoDB documents.
- **Impact:** High. The response contains sensitive password hashes of all users. An attacker could use these hashes to run offline dictionary or brute-force attacks to crack user passwords.
- **Recommended Fix:** Exclude the password field from the query projection, for example:
  ```javascript
  const users = await User.find({}, '-password');
  ```

---

### 1.4. CORS Misconfiguration and CSRF Vulnerability
- **File(s):**
  - `backend/index.js`
- **Description:** The backend configures CORS to allow credentials (`credentials: true`) with the origin `['http://localhost:4200']`. While standard for local development, the application relies on cookie-based JWTs without any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Medium-High. If a user is logged in, a malicious third-party site could execute requests on behalf of the user because cookies are sent automatically with cross-origin requests.
- **Recommended Fix:** Implement anti-CSRF tokens, or transition to securing cookies with appropriate `SameSite` attributes (e.g., `SameSite=Strict` or `Lax`) depending on production hosting structures.

---

## 2. Logical & Frontend Bugs

### 2.1. Administrative Session Overwrite on User Creation
- **File(s):**
  - `backend/routes/adminroute.js` (specifically the `/createuser` endpoint)
- **Description:** When an administrator successfully creates a new user, the backend generates a JWT token for the *newly created user* and writes it to the client's administrative session cookie (`jwt`), overwriting the admin's existing cookie:
  ```javascript
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{...})
  ```
- **Impact:** High. Creating a user automatically logs out the administrator and logs them in as the newly created user, completely breaking the admin user management workflow.
- **Recommended Fix:** Remove the token generation and cookie-setting logic from the `/createuser` endpoint. Instead, return a simple JSON response indicating success:
  ```javascript
  res.status(201).send({ message: "User created successfully" });
  ```

---

### 2.2. Incorrect Angular `HttpClient.post` Parameters
- **File(s):**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (inside `deleteUser`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (inside `getusers`)
- **Description:** The `HttpClient.post` method signature is `post(url, body, options)`. In both files, the options object `{ withCredentials: true }` is mistakenly passed as the second argument (the `body` parameter):
  ```typescript
  this.http.post(url, { withCredentials: true })
  ```
- **Impact:** High. Since the options object is sent as the request body, the required configurations (such as sending cookies via credentials) are never applied. Consequently, requests fail with `401 Unauthenticated` because the session cookie is not attached.
- **Recommended Fix:** Pass an empty body or `null` as the second argument, and the options object as the third argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

---

### 2.3. Unhandled Exception on Profile Image Upload (Missing File Check)
- **File(s):**
  - `backend/routes/routes.js` (specifically the `/profile-upload-single` endpoint)
- **Description:** The profile upload route retrieves `req.file.filename` directly. However, it does not check if a file was actually uploaded.
- **Impact:** Medium. If a user triggers the profile upload action without selecting/attaching an image file, `req.file` evaluates to `undefined`. This raises a `TypeError` (reading property `filename` of undefined), triggering the catch block. Because the catch block is completely empty, the backend never responds to the client, causing the web application to hang indefinitely.
- **Recommended Fix:** Check if `req.file` exists first. If missing, return a validation error. Also, always ensure error catch blocks respond with a failure status:
  ```javascript
  if (!req.file) {
      return res.status(400).send({ message: "Please select a file to upload" });
  }
  ```

---

### 2.4. Non-Functional Search Input
- **File(s):**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The user list dashboard contains a search text input, but it is a static HTML element with no data bindings, change handlers, or Angular Form controls.
- **Impact:** Low-Medium. The search bar is entirely non-functional; typing into it does not filter users, which limits administrator usability.
- **Recommended Fix:** Implement search state in NgRx or locally within the component. Bind the input via `ngModel` or `FormControl`, and filter the `userdata$` selector based on the search query.

---

## 3. General & Architectural Issues

### 3.1. Misspelled Frontend Directory Name
- **Location:** Repository root
- **Description:** The directory for the Angular application is named `frondend` instead of `frontend`.
- **Impact:** Minor. Although it doesn't break execution, it introduces spelling inconsistencies and makes local workspace pathing/tooling more prone to errors.
- **Recommended Fix:** Rename the folder from `frondend` to `frontend` and update references if necessary.

---

### 3.2. Type Inconsistency in Mongoose Schema
- **File(s):**
  - `backend/models/user.js`
- **Description:** The `is_admin` field in the user schema is typed as a `String` but given a default value of `false` (boolean):
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
- **Impact:** Medium. This type mismatch leads to inconsistent storage (e.g., boolean values mixed with string representations) and potential issues during database queries that compare `is_admin` with a Boolean.
- **Recommended Fix:** Update the field schema definition to type `Boolean`:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

---

### 3.3. Empty/Silent Error Catch Blocks
- **File(s):**
  - `backend/routes/routes.js`
  - `backend/routes/adminroute.js`
- **Description:** There are several empty or silent catch blocks in administrative and user routes (e.g., in `/profile-upload-single`, `/logout`, and `/deleteUser/:id`).
- **Impact:** Medium. Any database or internal server error inside these blocks will go silently unhandled, failing to notify the user interface or log relevant telemetry. This leaves requests hanging indefinitely.
- **Recommended Fix:** Always catch and log the errors, and respond with an appropriate HTTP error code (e.g., `500 Internal Server Error`).
  ```javascript
  catch (error) {
      console.error(error);
      res.status(500).send({ message: "An unexpected error occurred" });
  }
  ```

---

### 3.4. Broken/Missing Test Coverage
- **Location:** `backend/package.json` & `frondend/jwtapp/`
- **Description:**
  1. The backend lacks any testing files or test scripts.
  2. 12 out of 14 frontend tests fail. This is primarily due to missing testing providers (like `HttpClientTestingModule` or `RouterTestingModule`) or mock store state in Angular component `.spec` configurations.
- **Recommended Fix:**
  1. Add a test runner/framework like Jest and write basic integration tests.
  2. Fix the Angular component tests by adding proper MockStore and routing/HTTP client testing modules to `TestBed.configureTestingModule()`.
