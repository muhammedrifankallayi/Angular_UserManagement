# Comprehensive Bug & Vulnerability Report

This document outlines security vulnerabilities, logic errors, architectural deficiencies, and test failures identified across the full-stack repository (Node.js/Express backend and Angular frontend).

---

## Executive Summary

The application is a full-stack JWT-based authentication system with user and admin portals. Multiple critical security vulnerabilities were discovered in the backend (including exposed credentials/hashes, missing authentication middleware on administrative endpoints, hardcoded JWT secrets, and session overwriting). Additionally, backend error handling is severely deficient, and frontend components contain invalid HTTP request signatures, non-functional features, and widespread unit test failures due to missing testing module imports.

---

## 1. Security Vulnerabilities

### Critical Risk

1. **Missing Authentication and Authorization Middleware on Admin Endpoints**
   - **Location:** `backend/routes/adminroute.js`
   - **Endpoints Affected:**
     - `GET /api/admin/users`
     - `POST /api/admin/deleteUser/:id`
     - `POST /api/admin/editDetails/:id`
     - `POST /api/admin/editUser`
     - `POST /api/admin/createuser`
   - **Description:** These administrative endpoints perform privileged actions (listing users, modifying user names, deleting accounts, creating users) without verifying if the incoming request includes a valid JWT token or if the requester possesses admin privileges (`is_admin: true`). Unauthenticated attackers can access or mutate sensitive database records directly.
   - **Remediation:** Implement administrative authentication and authorization middleware that validates the JWT cookie and checks `is_admin` status before executing route handlers.

2. **Sensitive Data Exposure (Password Hash Leakage)**
   - **Location:** `backend/routes/adminroute.js` -> `adminrouter.get('/users')`
   - **Description:** The `/api/admin/users` endpoint executes `User.find({})` and returns raw user documents directly to the client (`res.send(user)`). This leaks password hashes and internal metadata (`__v`) for every registered user. Note that `adminrouter.post('/editDetails/:id')` strips the password before sending, but `/users` omits this sanitization step.
   - **Remediation:** Project out or exclude the `password` field from Mongoose queries (e.g., `.select('-password')`) or omit the password field from response objects before sending them to clients.

3. **Admin Session Cookie Overwrite on User Creation**
   - **Location:** `backend/routes/adminroute.js` -> `adminrouter.post('/createuser')`
   - **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route handler generates a JWT token for the *newly created user* and sets it as the HTTP cookie (`res.cookie("jwt", token)`). This immediately overwrites the administrator's active session cookie with the newly created non-admin user's identity, logging the admin out.
   - **Remediation:** Do not issue or set a new JWT cookie when an administrator creates a user account on behalf of someone else.

### Medium / High Risk

4. **Hardcoded JWT Secret String**
   - **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
   - **Description:** JWT signing (`jwt.sign`) and verification (`jwt.verify`) hardcode `"secret"` as the HMAC secret key across all routes instead of utilizing environment variables (`process.env.jwtsecret` or `process.env.JWT_SECRET`). Anyone reading the source code can forge arbitrary JWT tokens.
   - **Remediation:** Use `process.env.jwtsecret` (or `process.env.JWT_SECRET`) from `.env` across all routes and ensure a fallback key is not hardcoded.

5. **Hardcoded MongoDB Database Connection String**
   - **Location:** `backend/index.js`
   - **Description:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded directly in `backend/index.js`.
   - **Remediation:** Move the database connection string to `process.env.MONGODB_URI` or `process.env.DB_URL`.

6. **Missing CSRF (Cross-Site Request Forgery) Protections**
   - **Location:** `backend/index.js`
   - **Description:** CORS is configured with `credentials: true` allowing `http://localhost:4200`, relying solely on `httpOnly` JWT cookies for stateful authentication without CSRF token validation or SameSite cookie attributes.
   - **Remediation:** Enable `SameSite` cookie policies (`SameSite=Strict` or `Lax`) and implement CSRF protection middleware where appropriate.

---

## 2. Backend Logic & Robustness Issues

1. **Unhandled Null/Undefined Access on Profile File Upload**
   - **Location:** `backend/routes/routes.js` -> `/profile-upload-single`
   - **Description:** The route handler directly accesses `req.file.filename` without verifying if `req.file` exists. If a user submits a POST request to `/api/profile-upload-single` without attaching an image payload, `req.file` is `undefined`, triggering an unhandled `TypeError: Cannot read properties of undefined (reading 'filename')`.
   - **Remediation:** Check `if (!req.file)` and return `res.status(400).send({ message: "No file uploaded" })` before accessing properties.

2. **Empty Catch Blocks and Silent HTTP Request Hanging**
   - **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
   - **Endpoints Affected:**
     - `/api/profile-upload-single`
     - `/api/profile`
     - `/api/admin/login`
     - `/api/admin/logout`
     - `/api/admin/deleteUser/:id`
     - `/api/admin/editDetails/:id`
     - `/api/admin/editUser`
     - `/api/admin/createuser`
   - **Description:** Multiple asynchronous route handlers wrap logic in `try { ... } catch (error) { ... }` where the `catch` block is either completely empty (`catch (error) {}`) or only logs `console.log(error.message)` without returning an HTTP response to the client. When exceptions occur, HTTP requests hang indefinitely until timing out.
   - **Remediation:** Ensure all `catch` blocks send an appropriate HTTP status response (e.g., `res.status(500).send({ message: "Internal Server Error" })`).

3. **Mongoose Schema Type Mismatch for `is_admin` Field**
   - **Location:** `backend/models/user.js`
   - **Description:** In `userSchema`, `is_admin` is defined with `type: String`, but given `default: false` (a boolean). Meanwhile, queries in `adminroute.js` check `{ is_admin: true }` (a boolean).
   - **Remediation:** Change `type: String` to `type: Boolean` in `backend/models/user.js`.

4. **Missing npm Start Script**
   - **Location:** `backend/package.json`
   - **Description:** `package.json` lacks a `"start"` script entry in `"scripts"`.
   - **Remediation:** Add `"start": "node index.js"` to `backend/package.json`.

---

## 3. Frontend Bugs & Deficiencies

1. **Invalid HttpClient POST Parameter Signature**
   - **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`) and `admin-useredit.component.ts` (`getusers`)
   - **Description:** Angular `HttpClient.post` signature is `post(url, body, options)`.
     - In `deleteUser`: `this.http.post('...', { withCredentials: true })` passes `{ withCredentials: true }` as the 2nd argument (`body`), leaving options omitted (`withCredentials` is not set on the request options).
     - In `getusers`: `this.http.post('...', { withCredentials: true })` also passes options object as the 2nd argument (`body`).
   - **Remediation:** Pass an explicit body (e.g. `{}` or `null`) as the second parameter and options object as the third parameter: `this.http.post(url, {}, { withCredentials: true })`.

2. **Non-Functional User Search Component**
   - **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
   - **Description:** The search bar HTML `<input type="text" placeholder="Search" class="input">` is purely static. It lacks Angular template binding (`[(ngModel)]` or `(input)` listeners), and no filter logic or selectors exist in `AdminUserlistComponent` or NgRx state to handle filtering users by name or email.
   - **Remediation:** Bind search input to a search query variable/action, and filter `userdata$` list dynamically via component logic or NgRx selectors.

3. **Frontend Unit Test Suite Failures**
   - **Location:** Component spec files in `frondend/jwtapp/src/app/components/`
   - **Description:** Running `ng test` results in 12 failed specs (out of 14) with `NullInjectorError` errors (e.g., `No provider for HttpClient!`, `No provider for Router!`, `No provider for Store!`).
   - **Remediation:** Update TestBed configurations in component spec files to import `HttpClientTestingModule`, `RouterTestingModule`, and provide NgRx mock store via `provideMockStore()`.

4. **Directory Misspelling in Repository Structure**
   - **Location:** Repository root
   - **Description:** The frontend folder is named `frondend/` instead of `frontend/`.
   - **Remediation:** Rename directory `frondend` to `frontend` and update documentation/scripts accordingly if desired.

---

## Summary Table of Issues

| ID | Module | Category | Issue Description | Severity |
|---|---|---|---|---|
| SEC-01 | Backend | Security | Missing auth/admin middleware on admin routes | Critical |
| SEC-02 | Backend | Security | Password hashes exposed in `GET /api/admin/users` | Critical |
| SEC-03 | Backend | Security | Admin session cookie overwritten when creating user | Critical |
| SEC-04 | Backend | Security | Hardcoded JWT secret string `"secret"` in routes | High |
| SEC-05 | Backend | Security | Hardcoded MongoDB connection URI | Medium |
| LOG-01 | Backend | Robustness | Unchecked `req.file.filename` access causes server crash | Medium |
| LOG-02 | Backend | Error Handling | Empty catch blocks cause HTTP requests to hang | High |
| LOG-03 | Backend | Schema | Mongoose `is_admin` type mismatch (`String` vs `Boolean`) | Low |
| FE-01 | Frontend | Logic | `HttpClient.post` options passed as body parameter | High |
| FE-02 | Frontend | Feature | User search input is non-functional static HTML | Low |
| FE-03 | Frontend | Testing | 12/14 unit tests failing due to missing mock providers | Medium |
| ENV-01 | Frontend | Naming | Root directory misspelled as `frondend` | Low |
