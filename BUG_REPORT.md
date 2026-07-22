# Comprehensive Bug & Security Vulnerability Report

This report documents the security vulnerabilities, logical flaws, data inconsistencies, frontend bugs, and test environment issues identified in both the backend (Node.js/Express) and the frontend (Angular) codebases.

---

## Table of Contents
1. [Security Vulnerabilities](#1-security-vulnerabilities)
   - [1.1. Missing Authentication/Authorization Middleware on Admin Routes](#11-missing-authenticationauthorization-middleware-on-admin-routes)
   - [1.2. Administrative Password Leak in API Response](#12-administrative-password-leak-in-api-response)
   - [1.3. Hardcoded JWT Secrets](#13-hardcoded-jwt-secrets)
2. [Backend Logical and Database Model Issues](#2-backend-logical-and-database-model-issues)
   - [2.1. Admin Session Cookie Overwritten on User Creation](#21-admin-session-cookie-overwritten-on-user-creation)
   - [2.2. Type Mismatch on `is_admin` Field in Schema](#22-type-mismatch-on-is_admin-field-in-schema)
   - [2.3. Unhandled Runtime Exception and Empty Catch Blocks](#23-unhandled-runtime-exception-and-empty-catch-blocks)
3. [Frontend Implementation and Quality Issues](#3-frontend-implementation-and-quality-issues)
   - [3.1. Incorrect `HttpClient.post` Method Signature Usage](#31-incorrect-httpclientpost-method-signature-usage)
   - [3.2. Non-Functional Admin Search Input](#32-non-functional-admin-search-input)
   - [3.3. Typographical Directory Naming Error](#33-typographical-directory-naming-error)
4. [Testing and Development Environment Failures](#4-testing-and-development-environment-failures)
   - [4.1. Widespread Angular Unit Test Failures (`NullInjectorError`)](#41-widespread-angular-unit-test-failures-nullinjectorerror)

---

## 1. Security Vulnerabilities

### 1.1. Missing Authentication/Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Severity:** Critical
* **Description:** The routes `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack any checks to verify if the requesting client is logged in, has a valid JSON Web Token (JWT), or possesses administrator privileges (`is_admin: true`). Only the `/active` route verifies the token.
* **Impact:** Any unauthenticated remote client can access, fetch, modify, or delete any user record, or create new administrator accounts simply by hitting these endpoints.
* **Recommended Fix:**
  Create an authentication/authorization middleware (e.g., `auth.js` or `adminAuth.js`) that verifies the `jwt` cookie via `jwt.verify` and checks that the user has `is_admin === true` (or `"true"`). Apply this middleware to all administrative endpoints.

### 1.2. Administrative Password Leak in API Response
* **Location:** `backend/routes/adminroute.js` -> `GET /api/admin/users` (Lines 80–88)
* **Severity:** High
* **Description:** The route fetches user details using `User.find({})` and directly sends the results back to the client. The password exclusion code `// const {password, ...data} = await user.toJSON();` is commented out. Moreover, because `User.find({})` returns an array of documents, `user.toJSON()` cannot be called directly on the array anyway.
* **Impact:** The password bcrypt hashes of all registered users (including administrators) are transmitted across the network and made visible to any client calling this endpoint.
* **Recommended Fix:**
  Project the queried fields to exclude the password at the database layer (e.g., `User.find({}, { password: 0 })`), or map over the returned users array and delete or omit the `password` field from each object before sending.

### 1.3. Hardcoded JWT Secrets
* **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js` (Multiple locations)
* **Severity:** Medium
* **Description:** The string `"secret"` is used as the hardcoded key for signing and verifying JWTs in multiple locations (e.g., `jwt.sign({_id: ...}, "secret")`).
* **Impact:** Production environments will use the same weak, hardcoded secret, making the application highly susceptible to token forgery.
* **Recommended Fix:**
  Use the environment variable `process.env.jwtsecret` (which is already configured in the backend's `.env` file) instead of the hardcoded `"secret"` string.

---

## 2. Backend Logical and Database Model Issues

### 2.1. Admin Session Cookie Overwritten on User Creation
* **Location:** `backend/routes/adminroute.js` -> `POST /createuser` (Lines 171–177)
* **Severity:** High
* **Description:** After a new user is saved successfully, the backend signs a new JWT token for the *newly created user* and writes it to the client's `jwt` cookie:
  ```javascript
  const {_id} = await result.toJSON();
  const token = jwt.sign({_id:_id},"secret");
  res.cookie("jwt",token,{...});
  ```
* **Impact:** When an administrator creates a new user, their own session cookie is overwritten by the new user's session. The administrator is effectively logged out and logged in as the new user.
* **Recommended Fix:**
  Remove the code that generates and sets the JWT cookie in the `createuser` endpoint. The endpoint should only return a success message or the created user details.

### 2.2. Type Mismatch on `is_admin` Field in Schema
* **Location:** `backend/models/user.js` (Lines 16–19) and `backend/routes/adminroute.js` (Line 10)
* **Severity:** Medium
* **Description:** The `is_admin` field in the user schema is defined as a `String` with a default value of `false` (Boolean). This results in Mongoose converting `false` to the string `"false"`. However, in `adminroute.js`, `/login` queries using `is_admin: true` (Boolean).
* **Impact:**
  1. This mismatch can cause query issues and inconsistent behavior when searching or filtering.
  2. In JavaScript, the non-empty string `"false"` is truthy. Any logic that performs truthiness checks (e.g., `if (user.is_admin)`) on a regular user will evaluate to `true`, potentially causing privilege escalation bugs.
* **Recommended Fix:**
  Update the schema definition in `backend/models/user.js` to use `Boolean`:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

### 2.3. Unhandled Runtime Exception and Empty Catch Blocks
* **Location:**
  - `backend/routes/routes.js` -> `POST /profile-upload-single` (Lines 111–125)
  - Various `catch` blocks in both route files.
* **Severity:** Medium
* **Description:**
  1. The single profile upload handler calls `req.file.filename` without verifying if `req.file` exists. If no file is attached, this throws a `TypeError: Cannot read properties of undefined (reading 'filename')`.
  2. The `catch` blocks in `/profile-upload-single` and multiple other routes (e.g., `adminroute.js` lines 38, 46, 90, 146) are completely empty and do not return an HTTP response.
* **Impact:** When an exception is thrown, the empty `catch` blocks fail to respond, causing the client request to hang indefinitely until a timeout occurs.
* **Recommended Fix:**
  1. Check if `req.file` exists before accessing its properties:
     ```javascript
     if (!req.file) {
         return res.status(400).send({ message: "No file uploaded" });
     }
     ```
  2. Implement proper error responses in all catch blocks (e.g., `return res.status(500).send({ message: "Internal server error" });`).

---

## 3. Frontend Implementation and Quality Issues

### 3.1. Incorrect `HttpClient.post` Method Signature Usage
* **Location:**
  - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` -> `deleteUser()` (Line 42)
  - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` -> `getusers()` (Line 82)
* **Severity:** High
* **Description:** Angular's `HttpClient.post` signature is `post(url, body, options)`. In both components, the options object `{ withCredentials: true }` is passed as the *second* argument (the body) instead of the *third* argument (options).
* **Impact:** Because options are treated as the request body, the actual `withCredentials: true` option is omitted. The authentication cookies are not sent with these requests, and the backend returns `419/401 Unauthenticated` errors, causing user deletions and detail fetches to fail completely.
* **Recommended Fix:**
  Pass an empty body `{}` or `null` as the second argument:
  ```typescript
  this.http.post(url, {}, { withCredentials: true })
  ```

### 3.2. Non-Functional Admin Search Input
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` (Line 4)
* **Severity:** Low (UX/Functionality)
* **Description:** The search bar input is defined as a static HTML element: `<input type="text" placeholder="Search" class="input">`. It has no binding (`ngModel`, `formControl`) or event handlers, and no corresponding search filtering logic exists in the component.
* **Impact:** The search input does absolutely nothing when a user types in it.
* **Recommended Fix:**
  Add a search input control or field, bind it in the component, and apply a filter to the user list array (or use selectors/RxJS operators like `combineLatest`) to dynamically filter the displayed list.

### 3.3. Typographical Directory Naming Error
* **Location:** Repository Root
* **Severity:** Low (Maintainability)
* **Description:** The frontend directory is named `frondend` instead of `frontend`.
* **Impact:** Confuses developers and increases the risk of path-related errors in scripts and CI/CD pipelines.
* **Recommended Fix:** Rename the directory `frondend` to `frontend`.

---

## 4. Testing and Development Environment Failures

### 4.1. Widespread Angular Unit Test Failures (`NullInjectorError`)
* **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Severity:** High
* **Description:** 12 out of 14 Angular unit tests fail with a `NullInjectorError` (e.g., `No provider for HttpClient!`, `No provider for Router!`).
* **Impact:** The unit tests cannot be run successfully, blocking automated CI pipelines and preventing verification of code correctness.
* **Recommended Fix:**
  Configure the `TestBed` in each spec file to provide the appropriate mock/testing modules:
  - Import `HttpClientTestingModule` from `@angular/common/http/testing`
  - Import `RouterTestingModule` from `@angular/router/testing`
  - Import `ReactiveFormsModule` or `FormsModule`
  - Provide a Mock Store using `provideMockStore()` from `@ngrx/store/testing` if the component uses NgRx.
