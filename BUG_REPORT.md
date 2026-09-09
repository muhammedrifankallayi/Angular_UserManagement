# Comprehensive Bug Report

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secret Key
- **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Issue:** Authentication routes use a hardcoded fallback string `"secret"` for signing and verifying JWT tokens instead of using `process.env.jwtsecret` from environment configuration.
- **Impact:** Attainable secret key allows attackers to forge valid JWT tokens for any user or administrator.

### 1.2. Missing Authentication & Authorization Middleware on Admin Endpoints
- **Location:** `backend/routes/adminroute.js`
- **Issue:** Administrative routes such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, and `/createuser` lack authentication verification and role authorization middleware.
- **Impact:** Any unauthenticated user or guest can view user lists, edit user details, create users, or delete user accounts without valid credentials.

### 1.3. Sensitive Password Exposure in User List Endpoint
- **Location:** `backend/routes/adminroute.js` (`/users` route)
- **Issue:** The `/users` route returns raw database user objects without stripping the `password` hash field (`const user = await User.find({})`).
- **Impact:** User password hashes are exposed over API responses to any user querying the list.

### 1.4. Unvalidated Profile Image File Uploads
- **Location:** `backend/routes/routes.js` (`/profile-upload-single` route)
- **Issue:** The file upload handler accesses `req.file.filename` directly without verifying if `req.file` exists. Additionally, file types and file sizes are not validated.
- **Impact:** Requests without a file payload cause server runtime exceptions. Uploading executable files into public static directories creates security risks.

---

## 2. Backend Logic & Schema Deficiencies

### 2.1. Admin JWT Session Overwrite on User Creation
- **Location:** `backend/routes/adminroute.js` (`/createuser` route)
- **Issue:** When an admin creates a new user, `/createuser` generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP cookie on the response.
- **Impact:** The administrator's active session cookie is immediately overwritten by the new user's session.

### 2.2. Incorrect Schema Data Type for `is_admin`
- **Location:** `backend/models/user.js`
- **Issue:** The `is_admin` property is defined as `type: String` in the Mongoose schema, but assigned a boolean default (`false`) and queried as a boolean (`{ is_admin: true }`).
- **Impact:** Type inconsistency can lead to unexpected database query behavior and authentication failures.

### 2.3. Silent Exception Catching and Request Hanging
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`
- **Issue:** Several route catch blocks (e.g., `adminrouter.post('/logout')`, `adminrouter.post('/deleteUser/:id')`, `router.post('/profile-upload-single')`) are empty or omit `res.status(...)` calls during errors.
- **Impact:** Unhandled exceptions result in HTTP requests hanging indefinitely without returning error responses to clients.

### 2.4. Hardcoded Database Connection String
- **Location:** `backend/index.js`
- **Issue:** MongoDB connection URI `mongodb://127.0.0.1:27017/jwtproject` is hardcoded instead of loaded via `process.env`.
- **Impact:** Prevents dynamic configuration across development, testing, and production environments.

---

## 3. Frontend Bugs & Architectural Issues

### 3.1. Incorrect `HttpClient.post` Options Argument
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/` and `admin-useredit/`
- **Issue:** HTTP POST requests pass options (e.g. `{ withCredentials: true }`) as the second argument (body) instead of the third argument (`http.post(url, body, options)`).
- **Impact:** API calls fail or send empty payloads to backend endpoints.

### 3.2. Unimplemented Search Functionality in Admin User List
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/`
- **Issue:** The user search input element is static HTML and is not bound to component state, NgRx selectors, or filtering functions.
- **Impact:** Users cannot search or filter the user list UI.

### 3.3. Misspelled Frontend Directory Name
- **Location:** Repository root
- **Issue:** Root folder is named `frondend/` instead of `frontend/`.
- **Impact:** Inconsistent project structure and non-standard directory naming.

### 3.4. Frontend Unit Test Suite Failures
- **Location:** `frondend/jwtapp/src/app/` component spec files
- **Issue:** Spec tests fail with `NullInjectorError` for `HttpClient`, `Router`, and NgRx store providers.
- **Impact:** Frontend automated tests cannot pass in CI/CD pipelines without proper `TestBed` imports (`HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
