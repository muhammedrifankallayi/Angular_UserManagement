# Comprehensive Bug and Security Vulnerability Report

This document outlines the security vulnerabilities, logical flaws, architectural weaknesses, and testing issues identified in the JWT Project. The codebase is divided into a Node.js/Express backend (`backend/`) and an Angular v16 frontend (`frondend/jwtapp/`).

---

## 1. Executive Summary

A comprehensive audit of the application revealed several critical-severity security flaws, logical defects that break core functionalities, structural naming inconsistencies, and major gaps in the test configuration.

Immediate attention is required to secure the administrative endpoints, prevent session corruption, resolve data leaks, fix incorrect API request signatures in the frontend, and resolve the failing unit test suite.

---

## 2. Security Vulnerabilities (Critical & High Severity)

### 2.1 Hardcoded JWT Secret Key
* **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Vulnerability**: The signing and verification of JSON Web Tokens (JWT) are performed using a hardcoded string literal `"secret"` rather than retrieving the secret from an environment variable.
* **Impact**: Attackers with read-access to the repository can easily forge valid administrative and user JWTs, gaining full unauthorized access to any account.
* **Remediation**: Use `process.env.jwtsecret` (or a standardized `process.env.JWT_SECRET`) which is loaded via the `dotenv` package.
  ```javascript
  const secretKey = process.env.jwtsecret || 'fallback_secure_random_string';
  const token = jwt.sign({ _id: user._id }, secretKey);
  ```

### 2.2 Missing Authentication & Authorization on Administrative Routes
* **Location**: `backend/routes/adminroute.js`
* **Vulnerability**: Endpoints such as `/api/admin/users`, `/api/admin/deleteUser/:id`, `/api/admin/editDetails/:id`, `/api/admin/editUser`, and `/api/admin/createuser` lack any authentication (JWT cookie verification) or authorization (admin privilege check) middleware.
* **Impact**: Any unauthenticated actor on the network can list, create, edit, or delete registered users simply by making direct HTTP requests to these endpoints.
* **Remediation**: Create and apply an authentication middleware (e.g., `authenticateAdmin`) that verifies the incoming `jwt` cookie and asserts that the corresponding user database record has administrative privileges (`is_admin: true`).

### 2.3 Broken Access Control on `/api/admin/active`
* **Location**: `backend/routes/adminroute.js`
* **Vulnerability**: While `/api/admin/active` verifies the presence of a valid JWT, it fails to verify whether the authenticated user is an administrator.
* **Impact**: A standard non-admin user can access administrative metadata or trigger dashboards by presenting a standard user JWT cookie.
* **Remediation**: Ensure the JWT payload or user record is verified for the `is_admin` property:
  ```javascript
  if (!user || user.is_admin !== true) {
      return res.status(403).send({ message: "Access denied: Admins only" });
  }
  ```

### 2.4 Data Exposure of Sensitive Fields (Hashed Passwords)
* **Location**: `backend/routes/adminroute.js` (Route: GET `/users`)
* **Vulnerability**: The user retrieval list route does not exclude the password hashes before sending the records back to the client. The line that strips password data is commented out:
  ```javascript
  // const {password, ...data} = await user.toJSON();
  ```
* **Impact**: Anyone retrieving the user list gets complete access to the bcrypt password hashes of all registered users, facilitating offline brute-force attacks.
* **Remediation**: Query only the required fields or strip the password field during response formatting:
  ```javascript
  const users = await User.find({}, { password: 0 });
  ```

### 2.5 Cross-Site Request Forgery (CSRF) & Cors Vulnerability
* **Location**: `backend/index.js`
* **Vulnerability**: CORS configuration allows credentials to be sent (`credentials: true`) from the origin `http://localhost:4200` but lacks any anti-CSRF tokens or protection mechanisms.
* **Impact**: Malicious websites can make cross-origin requests on behalf of an authenticated user using their active cookies, leading to state-changing actions (e.g., user deletion, modification).
* **Remediation**: Use standard anti-CSRF middleware (such as `csurf` or similar token-based verification) and enforce strict `SameSite` flags on cookies.

---

## 3. Logical and Functional Bugs (Medium Severity)

### 3.1 Admin Session Cookie Overwritten on Admin User Creation
* **Location**: `backend/routes/adminroute.js` (Route: POST `/createuser`)
* **Bug**: When an admin creates a user, the controller generates a new JWT token for the *newly created user* and overwrites the active cookie:
  ```javascript
  res.cookie("jwt", token, { ... });
  ```
* **Impact**: The administrator is automatically logged out of their own account and logged in as the newly created user upon completion of the request.
* **Remediation**: Remove token generation and cookie attachment logic from the administrative user creation route. The endpoint should only persist the user and return a success response.

### 3.2 Server-Side Crash on Missing Upload File
* **Location**: `backend/routes/routes.js` (Route: POST `/profile-upload-single`)
* **Bug**: The code references `req.file.filename` without first checking if `req.file` is defined.
* **Impact**: Sending a POST request to this endpoint without an attached file leads to an unhandled `TypeError` exception. Since the catch block is empty and has no response handling, the connection is left hanging indefinitely, causing resource exhaustion.
* **Remediation**: Check for the existence of `req.file` and send a `400 Bad Request` if it is missing:
  ```javascript
  if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
  }
  ```

### 3.3 User Schema Type Inconsistency
* **Location**: `backend/models/user.js`
* **Bug**: The `is_admin` schema definition uses `type: String` but specifies a default value of `false` (boolean):
  ```javascript
  is_admin: {
      type: String,
      default: false
  }
  ```
* **Impact**: Queries or comparison checks like `user.is_admin === true` or `user.is_admin === "true"` can easily fail due to unexpected type coercion or string vs. boolean mismatches.
* **Remediation**: Correct the schema definition to enforce a Boolean type:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

### 3.4 Incorrect HTTP Post Options Signature in Frontend Components
* **Location**:
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser()`)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers()`)
* **Bug**: The `HttpClient.post()` signature is `post(url, body, options)`. The components incorrectly pass the HTTP options object as the second argument (the `body` payload):
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
* **Impact**: No custom headers/options (like `withCredentials`) are sent to the server because they are treated as the payload, and an empty config object is used. The server may reject the requests due to missing cookies.
* **Remediation**: Pass `null` or `{}` as the second parameter and the options as the third parameter:
  ```typescript
  this.http.post(`.../deleteUser/${userId}`, {}, { withCredentials: true })
  ```

### 3.5 Non-Functional Admin Search Input
* **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Bug**: The search input field `placeholder="Search"` is static and has no binding (e.g. `ngModel`, event listeners, or reactive forms logic) and no matching logic in the TypeScript class or NgRx state selectors.
* **Impact**: Users cannot search or filter the user list.
* **Remediation**: Add a reactive form control or two-way binding on the search input, and filter the users list either via an updated selector or frontend string matching.

---

## 4. Architectural & Design Flaws

### 4.1 Misspelled Frontend Root Directory
* **Location**: Root Repository
* **Issue**: The Angular frontend directory is named `frondend/` instead of `frontend/`.
* **Impact**: This creates confusion for developers, breaks automated deployment scripts or paths, and does not conform to industry naming practices.
* **Remediation**: Rename `frondend/` to `frontend/` and update references across deployment scripts.

### 4.2 Hardcoded Database Connection String
* **Location**: `backend/index.js`
* **Issue**: The MongoDB connection is hardcoded to `mongodb://127.0.0.1:27017/jwtproject`.
* **Impact**: The database connection cannot be dynamically adjusted for staging, production, or dockerized environments without altering the source code.
* **Remediation**: Move the URI to environment configuration:
  ```javascript
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jwtproject';
  mongoose.connect(mongoURI, { useNewUrlParser: true });
  ```

### 4.3 Missing Client Error Responses in `catch` Blocks
* **Location**: Backend Controllers (`routes.js`, `adminroute.js`)
* **Issue**: Many try-catch blocks are empty or log errors to `console.log` but do not send a response to the client (e.g. inside `adminrouter.post('/deleteUser/:id')`, `routes.post('/profile-upload-single')`).
* **Impact**: When errors occur, requests hang forever. The browser or client remains in a pending state until a timeout occurs, leading to poor UX and resource holding.
* **Remediation**: Always respond to the client in catch blocks:
  ```javascript
  catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
  ```

---

## 5. Test Failures & Development Environment Roadblocks

### 5.1 Unit Test Failures (NullInjectorErrors)
* **Location**: Frontend test files (`*.spec.ts`)
* **Issue**: Out of 14 unit tests, 12 fail when executing `npm test`. The failures are primarily due to missing mock providers or testing imports in the component specs:
  - `NullInjectorError: No provider for HttpClient!`
  - `NullInjectorError: No provider for Router!`
  - `NullInjectorError: No provider for Store!`
* **Impact**: Code correctness cannot be automatically verified in CI/CD pipelines, making regressions highly likely.
* **Remediation**: Update each component `.spec.ts` test suite configuration to import testing helper modules:
  ```typescript
  import { HttpClientTestingModule } from '@angular/common/http/testing';
  import { RouterTestingModule } from '@angular/router/testing';
  import { provideMockStore } from '@ngrx/store/testing';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [ComponentName],
      providers: [provideMockStore()]
    });
  });
  ```

---

## 6. Recommendations & Roadmap for Mitigation

1. **Step 1: Security Hardening (Critical)**
   - Implement route-guarding middleware on the backend to enforce session verification and check the `is_admin` boolean flag on the user model before fulfilling any administrative requests.
   - Replace hardcoded secret keys with `process.env.jwtsecret` (configured via a secure environment vault).
   - Strip sensitive fields like `password` from all API response payloads.

2. **Step 2: Correct Core Business Logic (High)**
   - Fix the incorrect `HttpClient.post` signatures in the frontend components (`deleteUser` & `getusers`).
   - Remove the `res.cookie` overwrite logic from `/api/admin/createuser`.
   - Add robust input/file validation to the profile picture upload router.

3. **Step 3: Resolve Developer Quality-of-Life & Testing (Medium)**
   - Refactor frontend unit tests to configure testing modules appropriately, ensuring a 100% pass rate.
   - Rename `frondend/` to `frontend/` to fix the path misspelling.
   - Externalize MONGODB URI configurations via environment variables.
