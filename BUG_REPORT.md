# Comprehensive Bug and Security Audit Report

This document details the security vulnerabilities, backend/frontend logic errors, and testing deficiencies identified within the JWT-based User Management application. A proposed remediation plan is included at the end to guide fixes and bring the system to standard quality, security, and test coverage.

---

## 1. Executive Summary
An audit of the codebase has revealed critical security and architectural flaws across the backend (Express/Node.js) and frontend (Angular 16) layers:
*   **Authentication & Security Concerns**: Hardcoded JWT secrets, missing authentication/authorization on administrative routes, sensitive data exposure (including plaintext-equivalent password hashes in general user lists), and lack of CSRF defenses.
*   **Logical Flaws**: Administrators' active sessions are overwritten by newly created users during manual user registration, unvalidated/dangerous file upload processing causing application crashes, and silent exception blocks that swallow errors.
*   **Frontend Issues**: Angular `HttpClient.post` parameter mismatches (preventing authentication cookies from propagating), a completely static and non-functional search bar in the user administration view, and incorrect repository naming ("frondend" directory spelling error).
*   **Testing Gaps**: 12 out of 14 Angular unit tests fail due to missing dependencies/mocking setups (`HttpClient`, `Router`, and NgRx `Store`).

---

## 2. Security Vulnerabilities & Critical Risks

### 2.1 Hardcoded JWT Secret Keys
*   **Files Affected**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
*   **Vulnerability Type**: Hardcoded Secret Key (CWE-798)
*   **Description**: The JWT signing and verification calls use the hardcoded secret string `"secret"` instead of utilizing the environment variable.
*   **Vulnerable Code Examples**:
    ```javascript
    const token = jwt.sign({_id:user._id},"secret");
    const claims = jwt.verify(cookie,"secret");
    ```
*   **Impact**: Anyone who reverse-engineers or gets access to the repository can easily sign valid administrative or user tokens, leading to a complete compromise of the application.
*   **Remediation**: Replace `"secret"` with `process.env.jwtsecret` (defined in `.env`).

### 2.2 Missing Authentication and Authorization Middleware on Admin Endpoints
*   **Files Affected**: `backend/routes/adminroute.js`
*   **Vulnerability Type**: Missing Authorization (CWE-862) / Missing Authentication for Critical Function (CWE-306)
*   **Description**: Sensitive administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`) lack any authentication check (no cookie parsing/JWT verification) or admin authorization roles check.
*   **Impact**: An attacker or an unauthorized user can directly access, edit, or delete any user by calling these endpoints (e.g., via Postman) without providing any credentials.
*   **Remediation**: Wrap all non-public admin endpoints with authentication middleware that extracts the cookie, validates the JWT, and verifies that the logged-in user has administrative rights (`is_admin: true`).

### 2.3 Data Exposure: Sensitive Information Leak
*   **Files Affected**: `backend/routes/adminroute.js` (inside `/users` route)
*   **Vulnerability Type**: Exposure of Sensitive Information to an Unauthorized Actor (CWE-200)
*   **Description**: The `/users` route retrieves and returns full user documents directly from the database without filtering out sensitive fields.
*   **Vulnerable Code Example**:
    ```javascript
    adminrouter.get('/users',async (req,res)=>{
        try {
            const user = await User.find({})
            res.send(user)
        } ...
    })
    ```
*   **Impact**: The password hashes of all users are sent to the client, facilitating offline brute-force attacks if intercepted or if the client-side state is exposed.
*   **Remediation**: Project out or delete the `password` field from the user documents before sending them in the response:
    ```javascript
    const users = await User.find({}, { password: 0 });
    ```

### 2.4 Mismatched Schema Datatype (`is_admin`)
*   **Files Affected**: `backend/models/user.js`
*   **Vulnerability Type**: Type Confusion / Inconsistent Data Definition
*   **Description**: The schema defines `is_admin` as a `String` but assigns a default value of `false` (boolean).
    ```javascript
    is_admin:{
        type:String,
        default:false
    }
    ```
*   **Impact**: This causes type inconsistency and potential bugs in Mongo/Mongoose queries. For example, queries checking `is_admin: true` (boolean) might fail or produce unexpected behavior since Mongoose has to coerce between String and Boolean.
*   **Remediation**: Update the schema type for `is_admin` to `Boolean`.

### 2.5 Cross-Site Request Forgery (CSRF) Exposure
*   **Files Affected**: `backend/index.js`
*   **Vulnerability Type**: Cross-Site Request Forgery (CSRF - CWE-352)
*   **Description**: The backend configuration allows credentials from `http://localhost:4200` but does not enforce any CSRF protection (e.g., anti-CSRF tokens or SameSite cookie attributes).
*   **Impact**: Users authenticated via cookies are vulnerable to cross-site request forgery attacks if they visit a malicious site while logged in.
*   **Remediation**: Implement CSRF protection middleware and configure SameSite cookie attributes (`sameSite: 'strict'` or `'lax'`).

---

## 3. Backend Logic Errors & Bugs

### 3.1 Admin Session Overwrite on User Creation
*   **Files Affected**: `backend/routes/adminroute.js` (inside `/createuser` route)
*   **Vulnerability Type**: Logic Error / Session Manipulation
*   **Description**: When an administrator creates a new user via `/api/admin/createuser`, the server signs a new JWT token for the *newly created user* and overwrites the active admin's `jwt` session cookie.
*   **Vulnerable Code Example**:
    ```javascript
    const {_id} = await result.toJSON();
    const token = jwt.sign({_id:_id},"secret");

    res.cookie("jwt",token,{
        httpOnly:true,
        maxAge:24*60*60*1000
    })
    ```
*   **Impact**: Immediately after creating a user, the administrator is silently logged out of their own account and logged into the newly created user's account, disrupting administrative workflow.
*   **Remediation**: Remove the code that generates and sets the JWT cookie on `/createuser`, and simply return a success response containing the created user info.

### 3.2 Lack of File Existence Validation in Upload Route
*   **Files Affected**: `backend/routes/routes.js` (inside `/profile-upload-single` route)
*   **Vulnerability Type**: Improper Null/Undefined Pointer Dereference (CWE-476)
*   **Description**: The route attempts to access `req.file.filename` directly without checking if `req.file` is defined.
*   **Vulnerable Code Example**:
    ```javascript
    const updateimg = await User.updateOne({_id:claims._id},{$set:{image:req.file.filename}});
    ```
*   **Impact**: If an upload request is sent without a file (e.g., empty or incorrect request form key), the backend crashes with a `TypeError: Cannot read properties of undefined (reading 'filename')`.
*   **Remediation**: Add validation to check if `req.file` is present before processing:
    ```javascript
    if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" });
    }
    ```

### 3.3 Silent Errors and Hangs (Poor Exception Handling)
*   **Files Affected**: Various routes in `backend/routes/routes.js` and `backend/routes/adminroute.js`
*   **Vulnerability Type**: Improper Output Handling / Suppressed Exceptions
*   **Description**: Several `catch` blocks are completely empty or only log to the console without sending an HTTP response to the client.
*   **Vulnerable Code Example**:
    ```javascript
    } catch (error) {

    }
    ```
*   **Impact**: If an unhandled exception or database error occurs during these calls, the server remains silent, and the client connection hangs indefinitely until a timeout occurs.
*   **Remediation**: Ensure all `catch` blocks send an error response (e.g., `res.status(500).send({ message: "Internal Server Error" })`).

---

## 4. Frontend Bugs & Deficiencies

### 4.1 Misspelled Frontend Directory Name
*   **Files Affected**: Repository root
*   **Description**: The Angular frontend root directory is misspelled as `frondend` instead of `frontend`.
*   **Impact**: This harms project professionalism, makes build/deploy scripts error-prone, and violates developer expectations.

### 4.2 Incorrect `HttpClient.post` Parameter Order Bugs
*   **Files Affected**:
    1. `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (inside `deleteUser`)
    2. `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts` (inside `getusers`)
*   **Description**: In Angular, `HttpClient.post()` has the signature: `post(url: string, body: any, options?: HttpOptions)`. The options object containing `{ withCredentials: true }` is incorrectly passed as the second argument (the request `body`) instead of the third.
*   **Vulnerable Code Example (Incorrect)**:
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, { withCredentials: true })
    ```
*   **Impact**:
    *   The request body is set to `{ withCredentials: true }`.
    *   Credentials (such as the admin JWT session cookie) are *not* sent with the request since the options argument is empty. This can cause authentication failures if security middleware is correctly implemented.
*   **Remediation**: Pass `null` or `{}` as the body (second argument) and `{ withCredentials: true }` as the options (third argument):
    ```typescript
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, null, { withCredentials: true })
    ```

### 4.3 Static, Non-functional Search Bar
*   **Files Affected**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
*   **Description**: The search input in the admin user list component is static HTML and lacks any logic hook:
    ```html
    <input type="text" placeholder="Search" class="input">
    ```
*   **Impact**: Admins typing into the search input experience no reaction, rendering the search feature non-functional.
*   **Remediation**: Bind the input to a component property (e.g., using `[(ngModel)]` or a `FormControl`) and implement filtering logic within the NgRx selectors or component controller to dynamically filter `userdata$`.

---

## 5. Testing Status (12 of 14 Failing Frontend Tests)
*   **Current Status**: 12 out of 14 frontend unit tests are failing when running `ng test`.
*   **Primary Failure Cause**:
    Almost all component test suites fail because they do not mock/provide essential Angular services, causing a `NullInjectorError` at test execution time.
    *   **No provider for HttpClient**: Occurs because components inject `HttpClient` but their spec files' `TestBed` configuration does not import `HttpClientTestingModule`.
    *   **No provider for Router**: Occurs because components inject `Router` or `ActivatedRoute` but their spec files' `TestBed` configuration does not import `RouterTestingModule`.
    *   **No provider for Store**: Components utilizing NgRx inject `Store` but their specs lack mock store providers (such as `provideMockStore()`).

---

## 6. Recommended Remediation Plan
1.  **Fix Parameter Bugs**: Update the parameter order in `HttpClient.post` calls across frontend components to ensure proper credentials propagation.
2.  **Implement Security Middlewares**: Create an authentication middleware in the backend, apply it to all administrative routes, and verify user roles properly.
3.  **Correct Database Schema**: Change the `is_admin` attribute in Mongoose to `Boolean` to ensure datatype consistency.
4.  **Clean Sensitive Data Responses**: Clean any route that exposes password hashes.
5.  **Adjust Session Cookie Behavior**: Fix `/api/admin/createuser` so it does not issue a cookie replacing the administrator's active session.
6.  **Fix Test Environment Errors**: Add `HttpClientTestingModule`, `RouterTestingModule`, and mock NgRx Store providers to all failing `.spec.ts` files to bring the unit test success rate to 100%.
