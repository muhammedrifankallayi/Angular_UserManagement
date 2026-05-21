# Bug Report

## Security Vulnerabilities

### 1. Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Issue:** The JWT signing and verification processes use a hardcoded string `"secret"` instead of the environment variable `jwtsecret` defined in `backend/.env`.
- **Risk:** Compromises the security of the tokens if the source code is exposed.

### 2. Missing Administrative Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Administrative endpoints such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` do not have any middleware to verify if the requesting user is authenticated or has administrative privileges.
- **Risk:** Unauthorized users can perform administrative actions.

### 3. Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (endpoint `/users`)
- **Issue:** The `/api/admin/users` endpoint returns the entire user object from the database, including the hashed passwords.
- **Risk:** Hashed passwords should never be sent to the frontend.

### 4. Admin Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (endpoint `/createuser`)
- **Issue:** When an administrator creates a new user, the backend generates a JWT for the *newly created* user and sets it in the `jwt` cookie.
- **Risk:** This effectively logs the administrator out and logs them in as the new user.

### 5. Lack of CSRF Protection
- **Location:** `backend/index.js`
- **Issue:** The application uses cookie-based authentication and has CORS enabled with `credentials: true`, but it lacks CSRF (Cross-Site Request Forgery) protection.
- **Risk:** Users could be tricked into performing unintended actions on the site.

## Functional Bugs

### 1. Incorrect `HttpClient.post` Parameter Usage
- **Location:**
    - `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
    - `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
    - `frondend/jwtapp/src/app/components/admin-createuser/admin-createuser.component.ts`
- **Issue:** The `withCredentials: true` option is being passed as the second argument (the request body) instead of the third argument (the options object) in `this.http.post()` calls.
- **Effect:** Requests may fail to send or receive cookies correctly.

### 2. Missing Search Functionality
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
- **Issue:** A search input is present in the template, but there is no corresponding `onSearch` method or logic in the component to handle filtering the user list.

## Code Quality and Inconsistencies

### 1. Misspelled Frontend Directory
- **Issue:** The directory containing the Angular application is named `frondend` instead of `frontend`.

### 2. Inconsistent Data Type for `is_admin`
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a default value of `false` (a boolean).
