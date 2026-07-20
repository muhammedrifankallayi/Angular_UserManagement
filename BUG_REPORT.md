# Comprehensive Bug and Security Vulnerability Report

This document outlines the critical bugs, security vulnerabilities, architectural inconsistencies, and testing issues identified in the codebase of the JWT Authentication and Admin Dashboard application.

---

## Table of Contents
1. [Security Vulnerabilities](#1-security-vulnerabilities)
2. [Backend Logic & Data Consistency Issues](#2-backend-logic--data-consistency-issues)
3. [Frontend Bugs & Angular Component Issues](#3-frontend-bugs--angular-component-issues)
4. [Testing & DevOps Issues](#4-testing--devops-issues)

---

## 1. Security Vulnerabilities

### 1.1. Missing Authentication/Authorization Middleware in Admin Routes
* **File Affected:** `backend/routes/adminroute.js`
* **Description:** Administrative endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack any authentication or authorization middleware checks. No verification of JWT session cookies or administrator privileges is performed before executing these critical administrative operations.
* **Impact:** High. Any unauthenticated attacker or guest can directly hit these endpoints to retrieve, edit, delete, or create user accounts, bypassing all access control controls.
* **Recommended Solution:** Implement and apply a robust auth and role-verification middleware (e.g., `verifyAdminToken`) on all administrative routes:
  ```javascript
  const verifyAdminToken = async (req, res, next) => {
      try {
          const cookie = req.cookies["jwt"];
          if (!cookie) return res.status(401).send({ message: "Unauthenticated" });

          const claims = jwt.verify(cookie, process.env.jwtsecret);
          const user = await User.findOne({ _id: claims._id });
          if (!user || !user.is_admin) {
              return res.status(403).send({ message: "Forbidden: Admin access required" });
          }
          req.user = user;
          next();
      } catch (error) {
          return res.status(401).send({ message: "Unauthenticated" });
      }
  };

  adminrouter.get('/users', verifyAdminToken, async (req, res) => { ... });
  ```

### 1.2. Hardcoded JWT Secret Key
* **Files Affected:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Description:** Inside the route handlers, signing (`jwt.sign`) and verification (`jwt.verify`) methods use the hardcoded string `"secret"` as the HMAC secret, completely bypassing the `.env` configuration file which has defined `jwtsecret`.
* **Impact:** High. Attackers who inspect the repository can view the secret key, forge valid JWT cookies, and impersonate any user (including administrators) on the server.
* **Recommended Solution:** Replace all hardcoded `"secret"` references with the environment variable `process.env.jwtsecret`:
  ```javascript
  const token = jwt.sign({ _id: user._id }, process.env.jwtsecret);
  ```

### 1.3. Insecure CORS Configuration & Missing CSRF Protection
* **File Affected:** `backend/index.js`
* **Description:** The Express application enables `cors` with `credentials: true` allowing `http://localhost:4200` to make authenticated cross-origin requests. However, since JWT tokens are stored in cookies and sent automatically with every request, the backend has no anti-CSRF protection mechanism (such as double-submit cookies or custom headers).
* **Impact:** Medium-High. The application is vulnerable to Cross-Site Request Forgery (CSRF). Malicious external websites visited by an authenticated user could issue state-changing requests to the API without the user's consent.
* **Recommended Solution:** Implement standard anti-CSRF token validation or configure cookie attributes to use `SameSite: 'Strict'` or `SameSite: 'Lax'` with `Secure` flags in production to mitigate cross-site request attacks.

### 1.4. Sensitive Fields Exposure in API Responses
* **File Affected:** `backend/routes/adminroute.js` (inside the `/users` endpoint)
* **Description:** The `/users` route executes `User.find({})` and returns the resulting user objects directly to the client via `res.send(user)` without stripping out the `password` field (which contains bcrypt hash strings).
* **Impact:** Medium. Although the passwords are cryptographically hashed, sending password hashes over the wire exposes sensitive cryptographic material that could be brute-forced off-line.
* **Recommended Solution:** Exclude the `password` field from the query projection or sanitize the returned array of users:
  ```javascript
  const users = await User.find({}, { password: 0 });
  res.send(users);
  ```

---

## 2. Backend Logic & Data Consistency Issues

### 2.1. Admin Session Cookie Overwritten on User Creation
* **File Affected:** `backend/routes/adminroute.js` (inside `/createuser` endpoint)
* **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route generates a JWT token for the *newly created user* and writes it to the `jwt` cookie via `res.cookie("jwt", token, ...)` before responding.
* **Impact:** High. By sending the cookie update, the administrator's session cookie is overwritten by the database ID of the newly created non-admin user. The administrator is immediately logged out of their own session and gets downgraded/logged into the user account they just created.
* **Recommended Solution:** Remove the JWT token generation and cookie-setting logic from the administrative `/createuser` route. Administrators should only receive a success message, while keeping their own active administrative cookie untouched:
  ```javascript
  // Remove token signing and cookie-setting block
  res.send({
      message: "success"
  });
  ```

### 2.2. Server Crash and Hanging Connections on Profile Upload (Missing File Check)
* **File Affected:** `backend/routes/routes.js` (inside `/profile-upload-single` endpoint)
* **Description:** The file upload route assumes a file is always present in the request and accesses `req.file.filename` directly:
  ```javascript
  const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
  ```
  If a client triggers this endpoint without attaching an image, `req.file` is `undefined`, resulting in a `TypeError: Cannot read properties of undefined (reading 'filename')`. The thrown exception enters the empty catch block:
  ```javascript
  } catch (error) {

  }
  ```
* **Impact:** Medium. The server suppresses the exception silently, but because no response (`res.status(...).send(...)`) is ever returned inside the catch block, the client's HTTP request hangs indefinitely, leading to socket/connection exhaustion.
* **Recommended Solution:** Add a safety check for `req.file` presence and ensure the catch block returns a clean HTTP `500` or `400` status:
  ```javascript
  if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
  }
  ```
  And inside the `catch` block:
  ```javascript
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
  }
  ```

### 2.3. Mongoose Schema Type Mismatch (`is_admin`)
* **File Affected:** `backend/models/user.js`
* **Description:** The `is_admin` schema field is defined as `type: String` with `default: false` (a boolean literal). This is inconsistent with how it is stored and queried. In `adminroute.js`, it is queried using a boolean: `User.findOne({ email: req.body.email, is_admin: true })`.
* **Impact:** Low-Medium. Type coercion bugs or DB inconsistency can occur depending on Mongoose version or how values are saved.
* **Recommended Solution:** Define the field as a proper boolean type in the user model:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

### 2.4. Hardcoded MongoDB Connection String
* **File Affected:** `backend/index.js`
* **Description:** The MongoDB connection URI is hardcoded as `'mongodb://127.0.0.1:27017/jwtproject'`.
* **Impact:** Medium. Prevents running the application across different environments (e.g., Docker, staging, production) without altering source code.
* **Recommended Solution:** Fetch the connection string from environment variables:
  ```javascript
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwtproject';
  mongoose.connect(mongoURI, { useNewUrlParser: true });
  ```

---

## 3. Frontend Bugs & Angular Component Issues

### 3.1. Incorrect `HttpClient.post` Parameter Signature Order
* **Files Affected:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
* **Description:** In `AdminUserlistComponent`, the delete user operation is implemented as:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`,{
    withCredentials:true
  })
  ```
  And in `AdminUsereditComponent`:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`,{
    withCredentials: true
  })
  ```
  The signature of Angular `HttpClient.post` is `post(url: string, body: any, options?: { ... })`. Here, `{ withCredentials: true }` is mistakenly passed as the second argument (the `body`), while the third argument (`options`) is left empty.
* **Impact:** High. Since the options argument is undefined, the `withCredentials` setting is ignored. The browser will NOT send authentication cookies along with these requests, causing the backend to reject them as unauthorized (or fail silently).
* **Recommended Solution:** Supply an empty body as the second argument and pass the configuration options as the third argument:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, {
    withCredentials: true
  })
  ```

### 3.2. Non-Functional Search Bar in Admin User List Component
* **Files Affected:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
* **Description:** The search input `<input type="text" placeholder="Search" class="input">` in the Admin Users List view is a static HTML element. It lacks any Angular data bindings, event listeners, form controls, or connections to NgRx state/selectors to filter the users array.
* **Impact:** Medium. The feature is completely broken, giving administrative users the false impression that they can search for user profiles, but typing in the input has no effect on the list.
* **Recommended Solution:** Implement a proper reactive form control or two-way data binding in Angular, and write selector/filtering logic in the NgRx store to filter the users dynamic list.

### 3.3. Misspelled Root Frontend Directory
* **Description:** The root directory housing the Angular 16 application is misspelled as `frondend` instead of `frontend`.
* **Impact:** Low. It causes minor developer confusion and violates naming conventions.
* **Recommended Solution:** Rename the directory to `frontend`.

---

## 4. Testing & DevOps Issues

### 4.1. Angular Unit Test Failures (NullInjectorError)
* **File Affected:** All components' spec files under `frondend/jwtapp/src/app/components/`
* **Description:** 12 out of 14 Angular unit tests fail. This is due to missing dependencies in the TestBed setup. The components inject dependencies (`HttpClient`, `Router`, and NgRx `Store`), but their testing configuration does not import or provide mock implementations.
* **Impact:** High. CI/CD pipelines cannot run tests successfully, making it impossible to guarantee regression-free code releases.
* **Recommended Solution:** Add `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore()` to the `TestBed.configureTestingModule` declarations within the `spec.ts` files:
  ```typescript
  import { HttpClientTestingModule } from '@angular/common/http/testing';
  import { RouterTestingModule } from '@angular/router/testing';
  import { provideMockStore } from '@ngrx/store/testing';

  // Inside beforeEach:
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [provideMockStore()],
    declarations: [YourComponent]
  });
  ```

### 4.2. Lack of Backend Tests
* **File Affected:** `backend/package.json`
* **Description:** The backend contains no test suite, and the `"test"` script is a default template placeholder (`"echo \"Error: no test specified\" && exit 1"`).
* **Impact:** High. Business logic in user authentication, session management, and admin workflows cannot be validated automatically.
* **Recommended Solution:** Introduce a test framework (e.g., Jest or Supertest) to write unit and integration tests for all Express routers, models, and middleware.
