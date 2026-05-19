# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Description**: The application uses a hardcoded string `"secret"` for JWT signing and verification instead of using environment variables.
- **Location**:
  - `backend/routes/routes.js`
  - `backend/routes/adminroute.js`
- **Impact**: Highly insecure, as the secret is exposed in the source code.

### 1.2 Missing/Inconsistent Authentication Middleware
- **Description**: Sensitive administrative routes lack a centralized authentication and authorization middleware. Some routes perform manual checks, while others are unprotected.
- **Location**: `backend/routes/adminroute.js`
- **Impact**: Potential unauthorized access to administrative functions.

### 1.3 Sensitive Data Exposure
- **Description**: The `/api/admin/users` endpoint returns full user objects, including hashed passwords.
- **Location**: `backend/routes/adminroute.js`
- **Impact**: Exposure of password hashes increases the risk of successful brute-force or rainbow table attacks if the data is intercepted or leaked.

### 1.4 CSRF Vulnerability
- **Description**: The application uses cookies for authentication but does not appear to have CSRF protection.
- **Location**: Global (Express backend/Angular frontend)
- **Impact**: Users could be tricked into performing unintended actions.

## 2. Logic Errors

### 2.1 Non-functional Search
- **Description**: The search input field in the Admin User List is not bound to any filtering logic.
- **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` & `.ts`
- **Impact**: Administrators cannot search for specific users.

### 2.2 Incorrect HttpClient Usage
- **Description**: `HttpClient.post` calls pass `withCredentials: true` as the body instead of as an option.
- **Location**:
  - `AdminUserlistComponent.deleteUser`
  - `AdminUsereditComponent.getusers`
- **Impact**: Authentication cookies are not sent with these requests, leading to authentication failures.

### 2.3 Admin Session Overwrite
- **Description**: Creating a user via the admin dashboard issues a new JWT cookie, overwriting the administrator's session and logging them out.
- **Location**: `backend/routes/adminroute.js` (endpoint `/createuser`)
- **Impact**: Poor user experience for administrators.

## 3. Configuration & Code Quality

### 3.1 Model Type Mismatch
- **Description**: The `is_admin` field in the User model is defined as a `String` but initialized with a boolean `false`.
- **Location**: `backend/models/user.js`

### 3.2 Directory Naming Typo
- **Description**: The frontend directory is misspelled as `frondend`.

### 3.3 Silenced Errors
- **Description**: Many catch blocks are empty or only use `console.log`, preventing proper error propagation and handling.
- **Location**: Multiple files in `backend/routes/`.

## 4. Test Failures

### 4.1 Frontend Unit Test Failures
- **Description**: Multiple Angular tests fail with `NullInjectorError: No provider for HttpClient!`.
- **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
- **Impact**: Broken CI/CD pipeline and unreliable test suite.
