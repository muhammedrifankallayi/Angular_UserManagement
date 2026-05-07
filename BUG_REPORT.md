# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secrets
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** Both backend route files use the hardcoded string `"secret"` for signing and verifying JWT tokens. This should be stored in an environment variable.
- **Lines:**
  - `backend/routes/adminroute.js`: Lines 29, 56, 151
  - `backend/routes/routes.js`: Lines 33, 62, 75, 96, 114

### 1.2 Sensitive Data Exposure
- **Endpoint:** `/api/admin/users` (`backend/routes/adminroute.js`)
- **Description:** The endpoint returns the result of `User.find({})` directly. The logic to exclude passwords is commented out, causing hashed passwords to be sent to the client.
- **Lines:** 72-77 in `backend/routes/adminroute.js`

### 1.3 Missing Authentication/Authorization Middleware
- **Description:** Admin routes (`backend/routes/adminroute.js`) lack centralized middleware to verify if a requester is actually an administrator. Some routes perform a manual check, but it is not consistent across all administrative actions.

## 2. Logic Errors

### 2.1 Broken Search Functionality
- **Component:** `AdminUserlistComponent` (`frondend/jwtapp/src/app/components/admin-userlist/`)
- **Description:** The HTML template contains a search input field, but it is not bound to any property or method in the TypeScript component, making it non-functional.

### 2.2 Session Management Flaw (Admin Logout on User Creation)
- **Endpoint:** `/api/admin/createuser` (`backend/routes/adminroute.js`)
- **Description:** When an administrator creates a new user, the backend issues a new JWT cookie for that created user. This overwrites the administrator's own session cookie, effectively logging them out.
- **Lines:** 151-154 in `backend/routes/adminroute.js`

### 2.3 Incorrect HttpClient Usage
- **Component:** `AdminUserlistComponent` (`frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`)
- **Description:** In the `deleteUser` method, the `withCredentials` option is passed as the second argument to `this.http.post`. In Angular's `HttpClient`, the second argument is the request body, and options should be the third argument.
- **Lines:** 42-43 in `admin-userlist.component.ts`

## 3. Structural Issues

### 3.1 Directory Misspelling
- **Description:** The frontend directory is named `frondend` instead of `frontend`.

### 3.2 Schema Inconsistency
- **File:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as a `String` but has a default value of `false` (boolean).

## 4. Test Failures

### 4.1 Angular Unit Tests
- **Status:** 12 Failed, 2 Success
- **Primary Error:** `NullInjectorError: No provider for HttpClient!`
- **Description:** Most component tests fail because they do not provide `HttpClient` in their testing module configuration.
