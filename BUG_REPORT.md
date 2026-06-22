# Bug Report

This report documents several critical issues identified in the JWT project codebase, ranging from security vulnerabilities to logic errors and testing gaps.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
The backend uses a hardcoded secret string `"secret"` for signing and verifying JWT tokens in both `backend/routes/routes.js` and `backend/routes/adminroute.js`, instead of utilizing the `jwtsecret` value defined in the `.env` file.

### 1.2 Missing Authentication/Authorization Middleware
Administrative routes in `backend/routes/adminroute.js` do not implement middleware to verify if the requesting user is an authenticated administrator. Any user can potentially access administrative endpoints if they know the URLs.

### 1.3 Exposure of Sensitive Data
The `GET /api/admin/users` endpoint returns the entire user object, including the hashed `password` field, to the client. This is a significant security risk.

### 1.4 Lack of CSRF Protection
The application lacks Cross-Site Request Forgery (CSRF) protection, making it vulnerable to attacks where malicious sites can perform actions on behalf of an authenticated user.

---

## 2. Logic and Type Errors

### 2.1 Inconsistent `is_admin` Type
In `backend/models/user.js`, the `is_admin` field is defined with `type: String` but has a default value of `false` (boolean). This inconsistency can lead to unexpected behavior during database operations and logic checks.

### 2.2 Admin Session Overwrite on User Creation
In `backend/routes/adminroute.js`, the `POST /api/admin/createuser` endpoint generates a new JWT for the newly created user and sets it in the `jwt` cookie. This action overwrites the administrator's existing session cookie, effectively logging the admin out and logging them in as the new user.

### 2.3 Incorrect `HttpClient` Parameter Usage
In the Angular frontend, some `http.post` calls (e.g., in `AdminUserlistComponent.deleteUser`) pass the request options (like `{ withCredentials: true }`) as the second argument. According to Angular's `HttpClient` API, the second argument should be the request body, and options should be the third argument.

### 2.4 Poor Error Handling
Multiple routes in `backend/routes/routes.js` and `backend/routes/adminroute.js` contain empty `catch` blocks or only `console.log` errors without sending an appropriate error response to the client, leading to hung requests or opaque failures.

---

## 3. Frontend Issues

### 3.1 Non-functional Search
The search input field in the `AdminUserlistComponent` template (`admin-userlist.component.html`) is currently a static HTML element with no backing logic in the TypeScript component to filter the user list.

### 3.2 Directory Misspelling
The main frontend directory is misspelled as `frondend` in the repository root, which may lead to confusion and configuration issues.

---

## 4. Testing and Environment

### 4.1 Missing Backend Tests
The backend `package.json` does not have any tests defined, and there are no test files in the `backend/` directory.

### 4.2 Failing Frontend Unit Tests
Currently, 12 out of 14 Angular unit tests in `frondend/jwtapp/` are failing. The primary cause is the lack of necessary providers (like `HttpClient`, `Router`, or `MockStore`) in the `TestBed` configuration within the `.spec.ts` files.
