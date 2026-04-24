# Bug Report - JWT App Project

## 1. Security Vulnerabilities

### 1.1 Password Exposure in Admin API
- **Endpoint:** `/api/admin/users`
- **File:** `backend/routes/adminroute.js`
- **Issue:** The endpoint returns all user data, including hashed passwords, because the exclusion logic is commented out.
- **Impact:** Attackers who gain administrative access can retrieve all user password hashes for offline cracking.

### 1.2 Hardcoded JWT Secret
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`
- **Issue:** The JWT signing secret is hardcoded as `"secret"`.
- **Impact:** Anyone with access to the source code can forge valid JWT tokens and impersonate any user, including administrators.

### 1.3 Session Overwrite on User Creation
- **Endpoint:** `/api/admin/createuser`
- **File:** `backend/routes/adminroute.js`
- **Issue:** When an administrator creates a new user, the backend issues a new JWT cookie for the newly created user, effectively overwriting the administrator's own session cookie.
- **Impact:** The administrator is logged out or forced into the newly created user's session after creating a user.

### 1.4 Missing Authentication Middleware
- **Directory:** `backend/middleware/` (Missing)
- **Issue:** There is no centralized authentication middleware. Administrative routes in `backend/routes/adminroute.js` (except `/active`) do not verify if the requester is an authenticated administrator before performing sensitive actions like deleting or editing users.
- **Impact:** Unauthorized users could potentially perform administrative actions if they know the endpoints.

### 1.5 Missing CSRF Protection
- **Issue:** The backend enables `credentials: true` for CORS but does not implement any CSRF protection mechanisms.
- **Impact:** Users are vulnerable to Cross-Site Request Forgery attacks.

---

## 2. Logic and Functional Errors

### 2.1 Broken User Search
- **Component:** `AdminUserlistComponent`
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field is present in the template but is not bound to any logic in the component.
- **Impact:** The search functionality is completely non-functional.

### 2.2 Incorrect HttpClient Usage
- **Components:** `AdminUserlistComponent`, `AdminUsereditComponent`
- **Issue:** `http.post` calls pass options (like `{ withCredentials: true }`) as the second argument, which Angular treats as the request body.
- **Impact:** Authentication cookies are not sent with these requests, leading to authentication failures on the backend.

### 2.3 Type Inconsistency in User Model
- **File:** `backend/models/user.js`
- **Issue:** `is_admin` is defined as `type: String` but has a `default: false` (boolean).
- **Impact:** Can lead to unexpected behavior during database queries and logic checks.

---

## 3. Environment and Configuration Issues

### 3.1 Misspelled Directory Name
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Confusion and non-standard project structure.

### 3.2 Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** The `scripts` section lacks a `start` entry.
- **Impact:** Standard `npm start` command fails; developers must use `node index.js`.

---

## 4. Test Failures

### 4.1 Frontend Unit Tests
- **Result:** 12 FAILED, 2 SUCCESS
- **Primary Error:** `NullInjectorError: No provider for HttpClient!`
- **Reason:** Most components (Register, Login, Profile, Dashboard, etc.) depend on `HttpClient` but their spec files do not provide `HttpClientTestingModule`.
- **Secondary Error:** `AppComponent should render title FAILED` (Expected undefined to contain 'jwtapp app is running!').
