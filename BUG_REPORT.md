# Bug Report

## 1. Security Vulnerabilities

### Password Hash Leak
- **File:** `backend/routes/adminroute.js`
- **Issue:** The `/users` endpoint does not exclude the password field when returning user data because the exclusion logic is commented out.
- **Impact:** Administrative users can see the hashed passwords of all users.

### Unprotected Administrative Routes
- **File:** `backend/routes/adminroute.js`, `backend/index.js`
- **Issue:** Administrative endpoints are not protected by any authentication middleware. There is no `auth.js` middleware or similar to verify if the requester is an admin.
- **Impact:** Anyone can potentially access administrative endpoints if they know the URL.

### Hardcoded JWT Secret
- **Files:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, `backend/.env`
- **Issue:** The JWT secret is hardcoded as `"secret"` in multiple files and also defined in the `.env` file.
- **Impact:** If an attacker knows the secret, they can forge JWT tokens.

### Administrator Session Overwrite
- **File:** `backend/routes/adminroute.js`
- **Issue:** In the `/createuser` endpoint, after creating a new user, the backend issues a new JWT cookie for that new user.
- **Impact:** This overwrites the administrator's own session cookie, effectively logging the admin out or switching their session to the newly created user.

## 2. Logic Errors

### Broken Search Functionality
- **File:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Issue:** The search input field is present in the template but is not bound to any component logic.
- **Impact:** Users cannot filter the user list.

### Incorrect HttpClient.post Usage
- **Files:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Issue:** The `withCredentials: true` option is passed as the second argument to `this.http.post`, which is interpreted as the request body. It should be the third argument.
- **Impact:** Authentication cookies are not sent with the POST requests, leading to authentication failures if the backend were to check for them.

### Type Inconsistency for `is_admin`
- **File:** `backend/models/user.js`
- **Issue:** The `is_admin` field is defined with `type: String` but has a `default: false` (a boolean).
- **Impact:** Potential data integrity issues and confusion in logic that expects a boolean.

## 3. Environment and Structural Issues

### Misspelled Frontend Directory
- **Issue:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Inconsistency and potential confusion for developers.

### Missing Backend Start Script
- **File:** `backend/package.json`
- **Issue:** There is no `"start"` script defined in `package.json`.
- **Impact:** Standard commands like `npm start` will fail for the backend.

## 4. Testing Issues

### Angular Unit Test Failures
- **Issue:** Many Angular unit tests are expected to fail with `NullInjectorError` because the `TestBed` configuration is missing necessary providers like `HttpClientTestingModule`, `RouterTestingModule`, `FormsModule`, and `provideMockStore`.
- **Impact:** Decreased confidence in code quality and difficulty in maintaining the application.
