# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
- **Issue:** The JWT signing and verification use a hardcoded string `"secret"` instead of the environment variable `process.env.jwtsecret`.
- **Impact:** Compromises the security of JWT tokens if the source code is exposed.

### 1.2 Missing Authentication/Authorization Middleware
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Sensitive administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have middleware to verify if the requester is authenticated or has administrative privileges.
- **Impact:** Any user or even unauthenticated attackers can potentially perform administrative actions.

### 1.3 Exposure of Sensitive Data (Passwords)
- **Location:** `backend/routes/adminroute.js` (specifically the `/users` endpoint)
- **Issue:** The `/users` route returns all user documents from the database, including the `password` field (hashed but still sensitive).
- **Impact:** Unnecessary exposure of sensitive information.

### 1.4 Missing CSRF Protection
- **Location:** `backend/index.js`
- **Issue:** The application uses cookie-based authentication and has CORS enabled with `credentials: true`, but it lacks CSRF (Cross-Site Request Forgery) protection.
- **Impact:** Users could be vulnerable to CSRF attacks.

---

## 2. Logic Errors

### 2.1 Model Type Inconsistency
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined as a `String`, but its default value is `false` (boolean), and it's used as a boolean in logic.
- **Impact:** Potential type-related bugs or unexpected behavior in database queries.

### 2.2 Unchecked File Upload
- **Location:** `backend/routes/routes.js` (specifically `/profile-upload-single`)
- **Issue:** The code accesses `req.file.filename` without checking if `req.file` exists.
- **Impact:** The backend will crash with a "TypeError: Cannot read property 'filename' of undefined" if a request is made without an image.

### 2.3 Administrative Session Overwrite
- **Location:** `backend/routes/adminroute.js` (specifically `/createuser`)
- **Issue:** When an admin creates a new user, the backend generates a new JWT for the *created user* and sets it in the cookie, effectively logging the admin out and logging them in as the new user.
- **Impact:** Disrupted administrative workflow and poor user experience.

### 2.4 Incorrect HttpClient API Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** `HttpClient.post` calls pass the options object (containing `withCredentials`) as the second argument (which is the body) instead of the third argument.
- **Impact:** API calls fail or behave unexpectedly because the body is incorrectly set and options are ignored.

---

## 3. Frontend & Environment Issues

### 3.1 Misspelled Directory
- **Location:** Root directory
- **Issue:** The frontend directory is misspelled as `frondend`.
- **Impact:** Confusion and non-standard project structure.

### 3.2 Non-functional Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input is a static HTML element with no backing logic in the component.
- **Impact:** The search feature advertised in the UI does not work.

### 3.3 Failing Unit Tests
- **Location:** `frondend/jwtapp/`
- **Issue:** 12 out of 14 Angular unit tests fail, primarily due to `NullInjectorError` (missing providers for `HttpClient`, `Router`, and `Store`).
- **Impact:** Lack of reliable automated testing for the frontend.

### 3.4 Hardcoded Database Connection
- **Location:** `backend/index.js`
- **Issue:** The MongoDB connection string `mongodb://127.0.0.1:27017/jwtproject` is hardcoded.
- **Impact:** Difficult to configure for different environments (development, staging, production).
