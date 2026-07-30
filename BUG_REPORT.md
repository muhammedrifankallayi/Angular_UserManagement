# Bug Report - JWT App

This report documents identified bugs, vulnerabilities, and issues in the JWT application, covering backend security, logic and schema errors, frontend UI/UX flaws, and test infrastructure problems.

---

## 1. Security Vulnerabilities

### 1.1. Hardcoded JWT Secret
*   **Locations:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
*   **Severity:** Critical
*   **Description:** The secret key used for signing and verifying JSON Web Tokens (JWT) is hardcoded as `"secret"`. If the source code is leaked, any attacker can forge administrative or user tokens and gain complete unauthorized access.
*   **Remediation:** Retrieve the secret key from environment variables using `process.env.jwtsecret` (configured in `backend/.env`).

### 1.2. Completely Unprotected Administrative Endpoints (Missing Auth Middleware)
*   **Location:** `backend/routes/adminroute.js`
*   **Severity:** Critical
*   **Description:** Several crucial admin endpoints do not have any authentication or authorization checks. They do not parse or verify the incoming JWT cookies to ensure the caller is an active, authorized administrator.
*   **Affected Endpoints:**
    *   `GET /api/admin/users`
    *   `POST /api/admin/deleteUser/:id`
    *   `POST /api/admin/editDetails/:id`
    *   `POST /api/admin/editUser`
    *   `POST /api/admin/createuser`
*   **Remediation:** Introduce a middleware that parses the JWT cookie, verifies its signature using the secret key, and confirms that the authenticated user's `is_admin` attribute is true before allowing access to administrative routes.

### 1.3. Sensitive Information Disclosure (Hashed Passwords Leaked to Client)
*   **Location:** `backend/routes/adminroute.js` (inside `/users` endpoint)
*   **Severity:** High
*   **Description:** The `/api/admin/users` endpoint returns raw user documents directly to the client, including their hashed password values. The code to omit the password from the JSON response is commented out/non-functional:
    ```javascript
    const user = await User.find({})
    // const {password, ...data} = await user.toJSON();
    console.log(user);
    res.send(user)
    ```
*   **Remediation:** Exclude the `password` field from the projection in the Mongoose query, e.g., `User.find({}, '-password')`.

### 1.4. Session Overwrite on Admin User Creation
*   **Location:** `backend/routes/adminroute.js` (inside `/createuser` endpoint)
*   **Severity:** High
*   **Description:** When an administrator creates a new user via `/api/admin/createuser`, the route generates a new JWT token for the *newly created user* and overwrites the existing session cookie with it:
    ```javascript
    res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 24*60*60*1000
    })
    ```
    This immediately logs the administrator out of their own session and logs them in as the new user.
*   **Remediation:** Remove the token generation and session cookie write logic from the admin user creation endpoint. It should only return a success message.

### 1.5. Lack of Cross-Site Request Forgery (CSRF) Protection
*   **Location:** `backend/index.js`
*   **Severity:** High
*   **Description:** The backend accepts credentials from the frontend origin `http://localhost:4200` but does not enforce CSRF tokens or configure modern `SameSite` cookie attributes, making users vulnerable to cross-site request forgery attacks.
*   **Remediation:** Set `SameSite=Strict` or `SameSite=Lax` cookie options and integrate standard anti-CSRF protection middleware.

---

## 2. Backend Logic & Schema Errors

### 2.1. User Schema Type Inconsistency (`is_admin`)
*   **Location:** `backend/models/user.js`
*   **Severity:** Medium
*   **Description:** The `is_admin` field is defined as a `String` with a boolean default value:
    ```javascript
    is_admin: {
        type: String,
        default: false
    }
    ```
    This leads to type inconsistency when checking and querying for the admin flag.
*   **Remediation:** Update the schema type of `is_admin` to `Boolean`.

### 2.2. Suppressed Exceptions & Empty Catch Blocks
*   **Location:** `backend/routes/routes.js` and `backend/routes/adminroute.js`
*   **Severity:** Medium
*   **Description:** Multiple endpoints use empty `catch (error) {}` blocks or blocks that only print to `console.log`. If an exception is thrown, the request is neither completed nor failed with a status code, causing client requests to hang indefinitely.
*   **Remediation:** Ensure all catch blocks respond to the client with an appropriate HTTP status code (such as 500) and a descriptive error message in JSON format.

### 2.3. Missing Profile Upload File Check
*   **Location:** `backend/routes/routes.js` (inside `/profile-upload-single` endpoint)
*   **Severity:** Medium
*   **Description:** The profile upload route accesses `req.file.filename` directly without verifying if `req.file` actually exists:
    ```javascript
    const updateimg = await User.updateOne({_id:claims._id}, {$set:{image:req.file.filename}});
    ```
    If no file is attached to the request, `req.file` is undefined, throwing a `TypeError` that is swallowed by an empty catch block, hanging the client request.
*   **Remediation:** Check if `req.file` is defined before attempting to access its filename. Return a 400 Bad Request status code if the file is missing.

---

## 3. Frontend Bugs & UX Flaws

### 3.1. Incorrect `HttpClient.post` Options Argument Order
*   **Locations:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
*   **Severity:** High
*   **Description:** In Angular's `HttpClient`, the post method signature is `post(url, body, options)`. However, the configuration option `{ withCredentials: true }` is incorrectly passed as the second argument (the request body) instead of the third argument:
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
        withCredentials: true
    })
    ```
    As a result, no configuration is set, and the request is sent without credentials/cookies, leading to authorization errors.
*   **Remediation:** Pass `null` or `{}` as the body (second argument) and the configuration object as the third argument:
    ```typescript
    this.http.post(url, {}, { withCredentials: true })
    ```

### 3.2. Dead Search Filter Input
*   **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
*   **Severity:** Low
*   **Description:** The admin user list template includes a search bar, but it is not bound to any form controls or event handlers, and no filter logic exists in the component, state, selectors, or NgRx store.
*   **Remediation:** Implement a filtering mechanism using Angular form controls or a search query property that filters the user list displayed in the table.

### 3.3. Misspelled Frontend Directory Name
*   **Location:** Root directory
*   **Severity:** Low
*   **Description:** The folder containing the Angular application is misspelled as `frondend` instead of `frontend`.
*   **Remediation:** Rename the directory to `frontend` and update references if necessary.

---

## 4. Frontend Unit Test Failures

### 4.1. Widespread Test Failures
*   **Severity:** High
*   **Description:** 12 out of 14 unit tests are currently failing. Running `ng test` throws numerous `NullInjectorError` errors because the components lack providers for dependencies like `HttpClient`, `Router`, or the NgRx store.
*   **Remediation:** Refactor the test `spec.ts` files to include `HttpClientTestingModule`, `RouterTestingModule`, and mock the state store (e.g., using `provideMockStore()`) in the test bed configurations.
