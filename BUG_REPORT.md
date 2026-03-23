# Bug Report

This document outlines the identified security vulnerabilities, logic errors, architectural issues, and test failures within the JWT application.

## 1. Security Vulnerabilities

### 1.1 Password Leakage in User List Endpoint
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `GET /api/admin/users`
- **Issue:** The logic to exclude passwords from the user list is currently commented out. As a result, the endpoint returns the entire user object, including hashed passwords, to the frontend.
- **Impact:** High. Exposes sensitive user data.

### 1.2 Unprotected Administrative Endpoints
- **File:** `backend/routes/adminroute.js`
- **Issue:** Several administrative endpoints (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware.
- **Impact:** Critical. Any user (or even unauthenticated visitors) can potentially perform administrative actions if they know the endpoint.

### 1.3 Session Overwriting during User Creation
- **File:** `backend/routes/adminroute.js`
- **Endpoint:** `POST /api/admin/createuser`
- **Issue:** After successfully creating a new user, the endpoint issues a new JWT cookie for that newly created user. This overwrites the administrator's existing session cookie.
- **Impact:** Medium. Disrupts the administrator's workflow by logging them out and logging them in as the new user.

### 1.4 Hardcoded JWT Secret
- **File:** `backend/routes/adminroute.js`
- **Issue:** The JWT signing logic uses a hardcoded string `"secret"` instead of an environment variable.
- **Impact:** High. Compromises the security of the tokens if the source code is exposed.

---

## 2. Logic Errors

### 2.1 Non-functional Search Filter
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input in the `AdminUserlistComponent` template is not bound to any component logic (no `ngModel` or event binding).
- **Impact:** Low. The search feature is present in the UI but does nothing.

### 2.2 Incorrect HttpClient.post Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** In several places, `HttpClient.post` is called with the `options` object (containing `withCredentials: true`) as the second argument. For `post` requests, the second argument is the request body, and the options should be the third argument.
- **Impact:** High. Authentication cookies are not sent with these requests, causing them to fail on the backend.

---

## 3. Architectural and Naming Issues

### 3.1 Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Low (naming consistency).

### 3.2 Inconsistent Data Type for `is_admin`
- **File:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a default value of `false` (Boolean).
- **Impact:** Low/Medium. May lead to unexpected behavior during database queries or data validation.

### 3.3 Missing Start Script in Backend
- **File:** `backend/package.json`
- **Issue:** The `scripts` section lacks a `"start": "node index.js"` entry.
- **Impact:** Low. Requires manual invocation of the server.

---

## 4. Test Failures

### 4.1 Angular Unit Test Failures
- **Status:** 12 out of 14 tests failing.
- **Primary Error:** `NullInjectorError: No provider for HttpClient!`.
- **Cause:** Components are being tested without providing `HttpClientTestingModule` or other necessary mock providers (like `provideMockStore`) in the `TestBed` configuration.
- **Impact:** Medium. Prevents automated verification of frontend components.
