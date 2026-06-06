# Bug Report - JWT Project

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
*   **Location**: `backend/routes/adminroute.js` and `backend/routes/routes.js`
*   **Issue**: The JWT secret is hardcoded as `"secret"` in multiple places instead of using the value from the `.env` file.
*   **Impact**: Compromises the security of the tokens if the source code is exposed.
*   **Suggested Fix**: Use `process.env.jwtsecret` after ensuring `dotenv` is configured correctly.

### 1.2 Missing Admin Authentication Middleware
*   **Location**: `backend/routes/adminroute.js`
*   **Issue**: Several admin routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) lack authentication and authorization middleware.
*   **Impact**: Any user or even an unauthenticated attacker can perform administrative actions like deleting or creating users.
*   **Suggested Fix**: Implement and apply `verifyToken` and `isAdmin` middleware to all sensitive admin routes.

### 1.3 Sensitive Data Exposure
*   **Location**: `backend/routes/adminroute.js` (route `/users`)
*   **Issue**: The `/users` route returns the entire user object, including the hashed password.
*   **Impact**: Exposes hashed passwords to the frontend, which is a security risk.
*   **Suggested Fix**: Use projection in Mongoose (e.g., `.find({}, '-password')`) or manually exclude the password field before sending the response.

### 1.4 Missing CSRF Protection
*   **Issue**: The application uses cookies for authentication but lacks CSRF protection.
*   **Impact**: Susceptible to Cross-Site Request Forgery attacks.
*   **Suggested Fix**: Implement CSRF protection using a library like `csurf` or by using SameSite cookie attributes properly.

---

## 2. Backend Logic Errors

### 2.1 Incorrect Data Type for `is_admin`
*   **Location**: `backend/models/user.js`
*   **Issue**: The `is_admin` field is defined as `String` but its default value is `false` (boolean).
*   **Impact**: Potential type inconsistency issues when querying or updating the field.
*   **Suggested Fix**: Change the type to `Boolean`.

### 2.2 Silenced Errors
*   **Location**: Multiple routes in `backend/routes/adminroute.js` and `backend/routes/routes.js`
*   **Issue**: Several `catch` blocks are empty or only use `console.log` without sending an error response to the client.
*   **Impact**: The frontend might hang or receive a successful status code even when an operation fails.
*   **Suggested Fix**: Always return an appropriate HTTP error status and message in `catch` blocks.

---

## 3. Frontend Logic and UI Issues

### 3.1 Unimplemented Search Functionality
*   **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
*   **Issue**: There is a search input field in the UI, but no logic is implemented to filter the user list.
*   **Impact**: Confusing user experience as the search bar does nothing.
*   **Suggested Fix**: Implement a search filter in the component using a Pipe or by filtering the `userdata$` observable.

### 3.2 Inconsistent API Configuration
*   **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`
*   **Issue**: API calls are hardcoded with `http://localhost:5000`.
*   **Impact**: Makes deployment difficult as the URL needs to be changed in many places.
*   **Suggested Fix**: Use Angular environment files to store the API base URL.

---

## 4. Testing Failures

### 4.1 Broken Frontend Unit Tests
*   **Location**: `frondend/jwtapp/src/app/components/**/*.spec.ts`
*   **Issue**: 12 out of 14 unit tests are failing due to `NullInjectorError` (missing providers like `HttpClient` and `Router`).
*   **Impact**: No reliable way to verify frontend changes through automated tests.
*   **Suggested Fix**: Update test files to include `HttpClientTestingModule`, `RouterTestingModule`, and provide necessary mocks (e.g., `provideMockStore`).

---

## 5. Architectural Issues

### 5.1 Misspelled Frontend Directory
*   **Issue**: The frontend directory is named `frondend` instead of `frontend`.
*   **Impact**: Minor annoyance and unconventional naming.
*   **Suggested Fix**: Rename the directory to `frontend`.
