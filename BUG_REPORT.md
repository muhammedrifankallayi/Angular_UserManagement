# Bug Report & Analysis

This report documents the security vulnerabilities, backend logic errors, frontend bugs, and testing/structural issues identified in the repository.

---

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret Key
* **Location:** `backend/routes/routes.js`, `backend/routes/adminroute.js`
* **Issue:** The JWT signing and verification code uses hardcoded string `"secret"` instead of reading from environment variables (`process.env.jwtsecret`).
* **Impact:** Sensitive token signatures can easily be forged or compromised if exposed.

### 1.2 Missing Authentication and Authorization Middleware on Admin Routes
* **Location:** `backend/routes/adminroute.js`
* **Issue:** Endpoints such as `GET /api/admin/users`, `POST /api/admin/deleteUser/:id`, `POST /api/admin/editDetails/:id`, and `POST /api/admin/editUser` do not verify authentication or check if the user is an administrator.
* **Impact:** Unauthenticated requests can access, modify, or delete user data.

### 1.3 Exposure of Passwords and Sensitive Fields in API Responses
* **Location:** `backend/routes/adminroute.js` (`GET /api/admin/users`)
* **Issue:** `adminrouter.get('/users')` returns raw User documents directly (`res.send(user)`), which includes hashed passwords and other internal fields.
* **Impact:** User passwords (hashes) are leaked in plain responses.

---

## 2. Backend Logic Errors & Schema Mismatches

### 2.1 Admin Session Overwritten Upon User Creation
* **Location:** `backend/routes/adminroute.js` (`POST /api/admin/createuser`)
* **Issue:** When an admin creates a new user, `adminrouter.post('/createuser')` generates a JWT token for the *newly created user* and sets it as the `jwt` HTTP-only cookie in the response.
* **Impact:** The admin's session cookie is immediately overwritten by the newly created user's token.

### 2.2 `is_admin` Schema Type Inconsistency
* **Location:** `backend/models/user.js`
* **Issue:** The `is_admin` field is defined as `type: String` with `default: false` (a boolean). In `adminroute.js`, queries search for `{ is_admin: true }` (boolean).
* **Impact:** Type mismatches can cause query inconsistencies or unexpected behavior in Mongoose queries.

### 2.3 Unhandled Errors and Missing Responses in File Upload & Routes
* **Location:** `backend/routes/routes.js` (`POST /api/routes/profile-upload-single`)
* **Issue:**
  1. Empty `catch` blocks silently swallow exceptions.
  2. Accessing `req.file.filename` without validating `req.file` leads to uncaught `TypeError` if no file is attached in the request.

---

## 3. Frontend Bugs & Deficiencies

### 3.1 Incorrect `HttpClient.post` Parameter Formatting
* **Location:**
  * `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (`deleteUser`)
  * `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (`getusers`)
* **Issue:** `this.http.post(url, { withCredentials: true })` passes options as the second argument (the request body) instead of the third argument (`http.post(url, body, options)`).
* **Impact:** The request body is sent as `{ withCredentials: true }` while credentials/cookies are omitted from HTTP options.

### 3.2 Non-Functional Search Input Field
* **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
* **Issue:** Search `<input type="text" placeholder="Search" class="input">` is plain HTML without data binding (`[(ngModel)]` or `FormControl`) or search filtering logic in `AdminUserlistComponent` / NgRx selectors.
* **Impact:** Users cannot filter or search through the user list in the UI.

### 3.3 Angular Unit Test Setup Failures
* **Location:** Component spec files in `frondend/jwtapp/src/app/components/**/*.spec.ts`
* **Issue:** Most test suites fail due to missing module imports/providers in `TestBed` setup (e.g., `HttpClientTestingModule`, `RouterTestingModule`, `provideMockStore`).
* **Impact:** Test execution yields `NullInjectorError` for `HttpClient`, `Router`, and NgRx `Store`.

---

## 4. Repository & Directory Structure

### 4.1 Frontend Directory Misspelling
* **Location:** `./frondend` (root)
* **Issue:** The frontend root directory is named `frondend` instead of `frontend`.
