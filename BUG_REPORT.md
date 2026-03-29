# Bug Report

## Security Vulnerabilities

### 1. Password Leaks in Admin Users Endpoint
- **Location:** `backend/routes/adminroute.js` (Route: `/users`)
- **Description:** The endpoint returns the full user object including the hashed password. The code intended to exclude the password field is commented out.
- **Impact:** Compromises user security by exposing password hashes to anyone who can access this endpoint.

### 2. Administrator Session Overwrite during User Creation
- **Location:** `backend/routes/adminroute.js` (Route: `/createuser`)
- **Description:** After successfully creating a new user, the endpoint generates a new JWT for the newly created user and sets it as the 'jwt' cookie.
- **Impact:** An administrator's session is overwritten and they are effectively logged out or transitioned into the new user's session.

### 3. Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Description:** The JWT signing and verification secret is hardcoded as `"secret"`.
- **Impact:** Makes it significantly easier for an attacker to forge JWT tokens if they know or can guess the secret.

### 4. Unprotected Administrative Routes
- **Location:** `backend/routes/adminroute.js`
- **Description:** Many administrative endpoints (like `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser`) do not have any middleware to verify that the requester is an authenticated administrator.
- **Impact:** Allows unauthorized users to perform administrative actions.

### 5. Missing CSRF Protection
- **Location:** Backend configuration (`backend/index.js`)
- **Description:** The application uses cookies for authentication but does not implement any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Users are vulnerable to CSRF attacks where a malicious site can make requests to the API on their behalf.

---

## Logic Errors

### 1. Non-functional Search in Admin User List
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `admin-userlist.component.ts`
- **Description:** The search input in the template is not bound to any component property or method, and no filtering logic is implemented in the component.
- **Impact:** The search feature is completely broken.

### 2. Incorrect `HttpClient.post` Argument Order
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** `HttpClient.post` is called with the options object (containing `withCredentials: true`) as the second argument. In Angular, the second argument is the request body, and options should be the third argument.
- **Impact:** Authentication cookies are not sent with these POST requests, and the `withCredentials` property is sent as part of the body instead.

### 3. Data Type Inconsistency in User Model
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined with `type: String` but has a `default: false` (boolean).
- **Impact:** Can lead to unexpected behavior and bugs when checking the `is_admin` status.

---

## Environment and Configuration Issues

### 1. Misspelled Frontend Directory
- **Location:** Project Root
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusion and potential path issues.

### 2. Missing Backend Start Script
- **Location:** `backend/package.json`
- **Description:** There is no `"start"` script defined in `package.json`.
- **Impact:** Standard `npm start` command fails; developers must know to run `node index.js`.

### 3. Failing Frontend Unit Tests
- **Location:** `frondend/jwtapp/`
- **Description:** Running `ng test` results in 12 out of 14 tests failing, mostly with `NullInjectorError` due to missing providers (`MockStore`, `HttpClientTestingModule`, `FormsModule`, `RouterTestingModule`).
- **Impact:** Lack of reliable automated testing for the frontend.
