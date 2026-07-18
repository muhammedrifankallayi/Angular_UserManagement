# Bug Report: JWT-Based Authentication Project

This comprehensive bug report outlines key security vulnerabilities, logic/code bugs, architectural issues, and frontend unit test failures identified across the codebase.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` (lines 35, 68, 93, 114, 137) and `backend/routes/adminroute.js` (lines 20, 52, 169)
- **Vulnerability:** The secret key used for signing and verifying JSON Web Tokens (JWT) is hardcoded as the string `"secret"`.
- **Impact:** Compromises application security by allowing anyone with access to the codebase (or through common secret guessing) to forge valid administrative or user JWT signatures.
- **Remediation:** Retrieve the secret key from environment variables using `process.env.jwtsecret` (which is already configured in the `.env` file).

### 1.2 Missing Authentication and Authorization on Administrative Routes
- **Location:** `backend/routes/adminroute.js` (endpoints: `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
- **Vulnerability:** These endpoints do not perform any JWT token validation. Additionally, the `/active` route verifies the token but fails to check whether the authenticated user has administrative privileges.
- **Impact:** Any unauthenticated actor or regular user can access administrative operations, such as listing all users, modifying user details, creating new users, and deleting existing accounts.
- **Remediation:** Implement custom authentication and role-checking Express middleware (e.g., `authenticateAdmin`) that verifies the JWT cookie and validates that the user's `is_admin` attribute is `true`/`"true"`.

### 1.3 Exposure of Sensitive Password Fields in User List API
- **Location:** `backend/routes/adminroute.js` (`/users` endpoint)
- **Vulnerability:** The API retrieves and returns all database user documents directly using `User.find({})` without excluding the hashed `password` fields.
- **Impact:** Hashed password hashes are leaked to client-side browsers, exposing users to offline dictionary attacks or brute-force decryption.
- **Remediation:** Project out or delete the `password` field before sending the response:
  ```javascript
  const users = await User.find({}, { password: 0 });
  ```

### 1.4 Missing Cross-Site Request Forgery (CSRF) Protection
- **Location:** `backend/index.js` (CORS and cookie parsing configuration)
- **Vulnerability:** The backend enables credentials-sharing (`credentials: true`) for `http://localhost:4200` but lacks any defense mechanisms (like CSRF double-submit cookies, anti-CSRF token headers, or SameSite cookie attributes) to prevent CSRF attacks.
- **Impact:** Malicious external sites can trigger actions on behalf of authenticated users if they are logged into the application.
- **Remediation:** Configure `SameSite=Lax` or `SameSite=Strict` on cookies, or implement CSRF protection middleware (e.g., `csurf` or custom headers verification).

---

## 2. Logic and Code Bugs

### 2.1 Admin Session Overwritten during User Creation
- **Location:** `backend/routes/adminroute.js` (`/createuser` endpoint)
- **Bug:** When an administrator creates a new user, the backend signs a JWT for the newly created user and sets it back on the client's `"jwt"` cookie.
- **Impact:** Creating a new user immediately overwrites the administrator's own session cookie, logging out the administrator and logging in the newly created user.
- **Remediation:** Remove the code that signs and sets a new JWT cookie from the `/createuser` endpoint, returning only a success status message.

### 2.2 Mongoose Schema Type Inconsistency for `is_admin`
- **Location:** `backend/models/user.js`
- **Bug:** The `is_admin` field is typed as a `String` but initialized with a boolean default of `false`.
- **Impact:** Leads to inconsistent comparisons and bugs when querying or verifying admin status (e.g., querying for a boolean `true` vs. a string `"true"`).
- **Remediation:** Change the model definition to type `Boolean`:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

### 2.3 Unsafe File Upload in Profile Route
- **Location:** `backend/routes/routes.js` (`/profile-upload-single` endpoint)
- **Bug:** The route updates the database with `req.file.filename` without first validating that `req.file` is defined.
- **Impact:** If a user submits a profile picture update without attaching a file, the server encounters a `TypeError: Cannot read properties of undefined (reading 'filename')` and crashes or fails ungracefully.
- **Remediation:** Add a check to verify that `req.file` is present:
  ```javascript
  if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
  }
  ```

### 2.4 Angular HttpClient POST Signature Mismatch
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser()`) and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers()`)
- **Bug:** The HTTP POST requests are called passing `{ withCredentials: true }` as the second argument:
  ```typescript
  this.http.post(url, { withCredentials: true })
  ```
- **Impact:** Since `HttpClient.post` expects `(url, body, options)`, the `{ withCredentials: true }` object is sent as the body of the POST request. The request is sent without credentials options, which prevents cookies from being attached to the request, causing authentication failures.
- **Remediation:** Pass an empty body `{}` as the second argument and options as the third:
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

### 2.5 Non-Functional Admin Search Input
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (line 4)
- **Bug:** The Search `<input>` element is purely static HTML and lacks two-way binding (`ngModel`), reactive form controls, or event bindings to filter users in the store or component.
- **Impact:** Users are unable to search or filter the administration list.
- **Remediation:** Implement a search query model/control in `AdminUserlistComponent` and bind it to filter the displayed users in the table.

### 2.6 Poor Backend Exception Handling
- **Location:** Multiple catch blocks across `routes.js` and `adminroute.js`
- **Bug:** Many try-catch blocks contain empty catch blocks or catch blocks that log the error but do not respond to the client (e.g., `catch (error) {}` in `/profile-upload-single`).
- **Impact:** Connections are left hanging until they time out, causing a poor user experience and making debugging difficult.
- **Remediation:** Always respond to the client with a meaningful error message and status code (e.g., `res.status(500).send({ message: "Internal Server Error" })`).

---

## 3. Architectural Issues

### 3.1 Misspelled Frontend Root Directory Name
- **Location:** Repository Root
- **Issue:** The directory containing the Angular client is misspelled as `frondend/` instead of `frontend/`.
- **Impact:** Contributes to architectural confusion and breaks automated workflows or standard naming conventions.
- **Remediation:** Rename the `frondend/` folder to `frontend/`.

---

## 4. Frontend Unit Test Failures

### 4.1 Missing TestBed Configuration & Mock Providers
- **Location:** `frondend/jwtapp/src/app/**/*.spec.ts`
- **Issue:** 12 of the 14 frontend tests fail. The failing tests encounter `NullInjectorError`s because components requiring `HttpClient`, `Router`, and NgRx state are tested without mocking these dependencies.
- **Impact:** Breaks continuous integration (CI/CD) pipelines and prevents automated verification of frontend behavior.
- **Remediation:** Update component spec files to configure the `TestBed` with testing modules:
  - Add `HttpClientTestingModule` from `@angular/common/http/testing` to `imports`.
  - Add `RouterTestingModule` from `@angular/router/testing` to `imports`.
  - Import `provideMockStore()` from `@ngrx/store/testing` inside the `providers` list.
