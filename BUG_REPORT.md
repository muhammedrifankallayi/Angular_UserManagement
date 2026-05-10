# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT secret is hardcoded as `"secret"` in multiple places for both signing and verification, despite a `.env` file existing with a `jwtsecret` variable.
- **Impact:** Compromises the security of the authentication system.

### 2. Missing Authentication Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Admin routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack a centralized authentication middleware. They either perform manual verification or none at all, making the API unprotected if not handled correctly in every route.
- **Impact:** Potential unauthorized access to administrative functions.

### 3. Exposure of Sensitive User Data
- **Location:** `backend/routes/adminroute.js` (endpoint `/api/admin/users`)
- **Issue:** The code to exclude passwords from the user list is commented out, causing hashed passwords to be sent to the frontend.
- **Impact:** Exposure of sensitive user credentials.

---

## Functional Bugs

### 1. Broken Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** There is a search input field in the template, but it is not bound to any property or logic in the component.
- **Impact:** Users cannot filter the user list.

### 2. Incorrect HttpClient Parameter Ordering
- **Location:** `AdminUserlistComponent` (deleteUser method), `AdminUsereditComponent` (submit and getusers methods).
- **Issue:** `this.http.post` is called with `{withCredentials: true}` as the second argument (which is the request body) instead of the third argument (options).
- **Impact:** Authentication cookies are not sent with these requests, leading to 401 errors.

### 3. Admin Session Overwrite
- **Location:** `backend/routes/adminroute.js` (endpoint `/createuser`)
- **Issue:** When an admin creates a new user, the server issues a new JWT cookie for that newly created user, overwriting the admin's session cookie.
- **Impact:** The administrator is automatically logged out after creating a user.

---

## Architectural and Consistency Issues

### 1. Directory Name Typo
- **Issue:** The frontend directory is misspelled as `frondend` instead of `frontend`.
- **Impact:** Inconsistent naming convention and potential confusion.

### 2. Model Type Inconsistency
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as a `String` but initialized with a boolean `false` as the default value.
- **Impact:** Potential data integrity issues and confusing type handling in the backend.
