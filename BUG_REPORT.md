# Bug Report: JWT Project

This bug report covers identified security vulnerabilities, logic and implementation errors, and environment/configuration issues across both the backend (Node.js/Express) and the frontend (Angular) codebases.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
* **Description:** Both the backend authentication routes (`backend/routes/routes.js`) and admin routes (`backend/routes/adminroute.js`) use the hardcoded string `"secret"` to sign and verify JSON Web Tokens (JWT) instead of utilizing the environment variable defined in the `.env` file.
* **Impact:** Exposes the token signing key, making it extremely easy for attackers to forge JWTs and gain unauthorized access.
* **Remediation:** Replace `"secret"` with `process.env.jwtsecret` (or `process.env.JWT_SECRET`) and ensure the environment configuration is loaded appropriately.

### 1.2 Lack of Authentication & Authorization on Administrative Routes
* **Description:** Most endpoints in `backend/routes/adminroute.js` (such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) do not check for valid admin credentials or enforce active sessions.
* **Impact:** Anyone can perform administrative actions (view users, edit users, delete users, and create users) simply by hitting these endpoints.
* **Remediation:** Implement and apply a centralized authentication/authorization middleware that verifies the JWT token and checks the user's `is_admin` status.

### 1.3 Exposure of Sensitive Fields in User Lists
* **Description:** The `/api/admin/users` endpoint returns raw user database records from MongoDB directly (`User.find({})`) to the client without filtering.
* **Impact:** Exposes sensitive password hashes (and potentially other private fields) of all registered users to any client accessing this endpoint.
* **Remediation:** Exclude password hashes when querying user data (e.g., using `.select('-password')` in Mongoose) or filter the output object before sending it in the response.

### 1.4 Missing Cross-Site Request Forgery (CSRF) Protection
* **Description:** The backend allows credentials (`credentials: true`) from the origin `http://localhost:4200` but does not implement any CSRF mitigation/protection strategy.
* **Impact:** An attacker can perform actions on behalf of authenticated users if they are tricked into visiting a malicious site.
* **Remediation:** Introduce CSRF middleware or double-submit cookie validation pattern to secure credential-carrying requests.

---

## 2. Logic and Implementation Errors

### 2.1 Overwriting Admin Cookie on Admin-initiated User Creation
* **Description:** In `backend/routes/adminroute.js` under the `/createuser` endpoint, after saving a newly created user, the code generates a new JWT token for the created user and overwrites the active administrator's `"jwt"` session cookie:
  ```javascript
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{ ... })
  ```
* **Impact:** The administrator is logged out and automatically logged in as the newly created user upon creation.
* **Remediation:** Avoid signing and setting a new session cookie for newly created users when the operation is performed by an administrator.

### 2.2 Incorrect HttpClient.post Usage in Frontend Components
* **Description:** In `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`, `HttpClient.post` calls pass options (such as `{ withCredentials: true }`) as the second argument:
  ```typescript
  // AdminUserlistComponent.deleteUser:
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`,{
    withCredentials:true
  })
  ```
* **Impact:** The `HttpClient.post` signature is `post(url, body, options)`. Passing options as the second argument treats it as the request body, and credentials (cookies) are not sent. This leads to authentication failures.
* **Remediation:** Pass an empty body `{}` as the second argument and options as the third argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

### 2.3 Type Mismatch in User Schema `is_admin` Field
* **Description:** The `is_admin` field in `backend/models/user.js` is defined as a `String` with a default value of `false` (boolean):
  ```javascript
  is_admin:{
      type:String,
      default:false
  }
  ```
  However, administrative queries treat it as a boolean:
  ```javascript
  const user = await User.findOne({email:req.body.email, is_admin:true});
  ```
* **Impact:** This structural mismatch can cause query inconsistencies or unexpected behavior in MongoDB due to comparing String typed values to Boolean.
* **Remediation:** Change the schema definition of `is_admin` to `Boolean`.

### 2.4 Missing Safe Validation in Single Profile File Upload Route
* **Description:** In `/profile-upload-single` in `backend/routes/routes.js`, the code directly attempts to read `req.file.filename` without first ensuring that `req.file` exists:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
* **Impact:** If a user submits a request without attaching a file, `req.file` will be `undefined`, causing a runtime TypeError. Because of the empty `catch` block, the exception is suppressed, and the request hangs indefinitely without sending a response to the client.
* **Remediation:** Validate that `req.file` exists before accessing its properties and return a `400 Bad Request` if it is missing.

### 2.5 Suppressed Exceptions and Poor Error Handling
* **Description:** Throughout backend routes (e.g., in `/profile-upload-single`, `/logout`, `/deleteUser/:id`), there are multiple empty or inadequate `catch` blocks.
* **Impact:** When runtime errors occur, they are silently ignored, and no response is returned to the client, leading to hanging connections and difficult debugging.
* **Remediation:** Avoid empty `catch` blocks. Log errors and respond with appropriate HTTP status codes (such as `500 Internal Server Error`).

### 2.6 Non-functional Search Bar in Admin Dashboard
* **Description:** The search input element in the `AdminUserlistComponent` template is a static HTML component that is not wired to any component logic, search events, or NgRx state selectors.
* **Impact:** The search bar is purely visual and does not filter users.
* **Remediation:** Bind the search input to a component property or reactive form control, and implement search filtering logic in either the state selectors or component logic.

---

## 3. Environment and Configuration Issues

### 3.1 Misspelled Frontend Directory Name
* **Description:** The frontend directory is named `frondend` instead of `frontend`.
* **Impact:** May lead to confusion, configuration errors, and poor maintainability.
* **Remediation:** Rename the directory `frondend` to `frontend` and update path references accordingly.

### 3.2 Missing `start` Script in Backend Configuration
* **Description:** The backend `package.json` file does not define a `start` script.
* **Impact:** Standard tooling/commands like `npm start` fail to run the backend application.
* **Remediation:** Add a `"start": "node index.js"` script to `backend/package.json`.

### 3.3 Failing Frontend Unit Tests
* **Description:** Running `ng test` in `frondend/jwtapp/` results in multiple test failures (12 out of 14 failing). The errors are mainly:
  * `NullInjectorError: No provider for HttpClient!`
  * `NullInjectorError: No provider for Router!`
* **Impact:** Testing suites are broken, making it difficult to catch regressions.
* **Remediation:** Update Angular unit tests spec configuration files (`.spec.ts`) to import and provide `HttpClientTestingModule`, `RouterTestingModule`, and mock the NgRx store with `provideMockStore`.
