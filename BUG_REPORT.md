# BUG REPORT

## Security Issues

### 1. Password Leak in Admin Users Endpoint
- **Location:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/users` endpoint returns all user documents from the database without excluding the `password` field. This exposes hashed passwords to anyone with access to the endpoint.
- **Verification:** The exclusion logic `// const {password, ...data} = await user.toJSON();` is currently commented out.

### 2. Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Description:** None of the administrative routes (delete user, edit user, create user, etc.) are protected by authentication or authorization middleware. A `backend/middleware/auth.js` file is missing.
- **Impact:** Anyone can call administrative APIs to modify or delete user data.

### 3. Administrator Session Overwrite
- **Location:** `backend/routes/adminroute.js`
- **Description:** The `/api/admin/createuser` endpoint issues a new JWT cookie upon successful user creation.
- **Impact:** When an administrator creates a new user, their own session cookie (`jwt`) is overwritten by the new user's token, effectively logging the administrator out or switching their session.

### 4. Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`, and `backend/.env`
- **Description:** The JWT secret `"secret"` is hardcoded in the source code during token signing and verification. Although it is also present in `.env`, the code uses the literal string.

### 5. Missing CSRF Protection
- **Location:** `backend/index.js`
- **Description:** The application does not implement any Cross-Site Request Forgery (CSRF) protection, despite using cookies for authentication and allowing credentials from the frontend origin.

---

## Logic Errors

### 1. Broken Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field is a static HTML element not bound to any component logic or filter pipe. It does nothing when the user types.

### 2. Incorrect HttpClient Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `admin-useredit.component.ts`
- **Description:** In `deleteUser`, `editUser`, and `getusers` methods, the `HttpClient.post` calls pass `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (options).
- **Impact:** Authentication cookies are not sent with these requests, and the request body is incorrectly populated.

### 3. Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (boolean).

---

## Environment and Testing Issues

### 1. Directory Misspelling
- **Description:** The frontend directory is named `frondend` instead of `frontend`.

### 2. Missing Start Script in Backend
- **Location:** `backend/package.json`
- **Description:** There is no `"start"` script defined. The server must be started manually with `node index.js`.

### 3. Failing Frontend Unit Tests
- **Description:** 12 out of 14 Angular unit tests fail with `NullInjectorError`.
- **Reason:** Missing providers for `HttpClient`, `Store`, `Router`, and `FormBuilder` in the `TestBed` configuration of various `.spec.ts` files.
