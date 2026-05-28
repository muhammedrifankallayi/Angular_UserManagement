# Bug Report - JWT App

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Description:** Both files use the hardcoded string "secret" for JWT signing and verification instead of utilizing the environment variable `jwtsecret` defined in `backend/.env`.

### 1.2 Missing Authentication and Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Description:** Several administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`) lack middleware to verify the JWT token and ensure the requesting user has administrator privileges.

### 1.3 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (GET `/users` endpoint)
- **Description:** The `/users` endpoint returns the entire user document from MongoDB, including the hashed `password` field, which should never be exposed to the client.

### 1.4 Administrator Session Overwriting
- **Location:** `backend/routes/adminroute.js` (POST `/createuser` endpoint)
- **Description:** When an administrator creates a new user, the backend generates a new JWT for the created user and sets it in the "jwt" cookie, effectively logging out the administrator and logging them in as the new user.

### 1.5 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Description:** The application uses cookie-based authentication but does not implement any Cross-Site Request Forgery (CSRF) protection, making it vulnerable to CSRF attacks.

---

## 2. Logic Errors and Code Quality Issues

### 2.1 Misspelled Directory Name
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of the standard `frontend`.

### 2.2 Incorrect HttpClient Usage in Angular
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (and potentially others)
- **Description:** The `deleteUser` method passes `{ withCredentials: true }` as the second argument to `http.post`. In Angular's `HttpClient`, the second argument for `post` is the request body, and options (like `withCredentials`) should be the third argument.

### 2.3 Missing Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** There is a search input field in the template, but no corresponding logic or `onSearch` method is implemented in the component class to filter the user list.

### 2.4 Inconsistent Data Types in Mongoose Schema
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as a `String` type, yet its default value is the boolean `false`. This can lead to confusion and potential logic errors during type checking.

### 2.5 Poor Error Handling
- **Location:** Throughout `backend/routes/`
- **Description:** Many route handlers use empty `catch` blocks or only `console.log(error.message)`, which silences failures and makes debugging difficult for both developers and client-side applications.

---

## 3. Testing Issues

### 3.1 Failing Frontend Unit Tests
- **Status:** 12 out of 14 tests failing.
- **Primary Cause:** `NullInjectorError: No provider for HttpClient!`.
- **Description:** Most component specifications (`.spec.ts` files) do not include `HttpClientTestingModule` or appropriate providers for `HttpClient`, causing the tests to fail during initialization.
