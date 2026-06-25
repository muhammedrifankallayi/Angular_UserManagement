# Bug Report

## Security Vulnerabilities

1. **Hardcoded JWT Secret**
   - **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
   - **Description**: The JWT secret key is hardcoded as `"secret"` in multiple locations instead of being loaded from environment variables.
   - **Suggested Fix**: Use `process.env.jwtsecret` (which is already defined in `.env`).

2. **Missing Authorization Middleware**
   - **Location**: `backend/routes/adminroute.js`
   - **Description**: Several administrative routes (e.g., `/users`, `/deleteUser/:id`, `/editUser`) lack middleware to verify if the requester is an authenticated administrator.
   - **Suggested Fix**: Implement and apply an authorization middleware that checks for a valid admin JWT.

3. **Sensitive Data Exposure**
   - **Location**: `backend/routes/adminroute.js` (specifically the `/users` GET route)
   - **Description**: The endpoint returns the entire user object, including the hashed `password` field, to the frontend.
   - **Suggested Fix**: Exclude the password field from the query results or filter it out before sending the response.

4. **Lack of CSRF Protection**
   - **Location**: `backend/index.js`
   - **Description**: The application does not implement CSRF protection, leaving it vulnerable to Cross-Site Request Forgery attacks, especially since it uses cookies for authentication.
   - **Suggested Fix**: Implement CSRF protection using a library like `csurf` or similar mechanisms.

---

## Logic Errors

1. **JWT Session Overwrite during User Creation**
   - **Location**: `backend/routes/adminroute.js` (specifically the `/createuser` POST route)
   - **Description**: When an admin creates a new user, the backend generates a JWT for the new user and sets it in the response cookie, which overwrites the admin's own session cookie.
   - **Suggested Fix**: Remove the JWT generation and cookie-setting logic from the user creation endpoint meant for administrators.

2. **Suppressed Exceptions (Empty Catch Blocks)**
   - **Location**: `backend/routes/routes.js`, `backend/routes/adminroute.js`
   - **Description**: Numerous asynchronous operations are wrapped in try-catch blocks where the `catch` block is empty. This hides errors and results in hung requests or silent failures.
   - **Suggested Fix**: Implement proper error handling and return appropriate HTTP status codes (e.g., 500 Internal Server Error) in catch blocks.

3. **Mismatched Data Types for `is_admin`**
   - **Location**: `backend/models/user.js`
   - **Description**: The `is_admin` field is defined with `type: String` but has a default value of `false` (boolean) and is treated as a boolean in logic.
   - **Suggested Fix**: Change the type to `Boolean` in the Mongoose schema.

4. **Incorrect `HttpClient.post` Usage**
   - **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts`, `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
   - **Description**: In multiple locations, `this.http.post(url, options)` is called, where `options` (containing `withCredentials: true`) is passed as the second argument (the body) instead of the third.
   - **Suggested Fix**: Pass `null` or the appropriate body as the second argument and the options as the third argument.

---

## Structural and Frontend Issues

1. **Misspelled Directory Name**
   - **Location**: Root directory
   - **Description**: The frontend directory is named `frondend` instead of `frontend`.
   - **Suggested Fix**: Rename the directory to `frontend`.

2. **Non-functional Search Feature**
   - **Location**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
   - **Description**: The search input field is a static HTML element with no `ngModel` or event binding, and no search logic exists in the component.
   - **Suggested Fix**: Implement search logic using Angular forms and filtering in the component or through NgRx selectors.

3. **Widespread Test Failures**
   - **Location**: `frondend/jwtapp/`
   - **Description**: 12 out of 14 unit tests are failing. The primary cause is `NullInjectorError: No provider for HttpClient!` and `No provider for Router!` in the component test specs.
   - **Suggested Fix**: Update test files to include `HttpClientTestingModule`, `RouterTestingModule`, and `provideMockStore` in the `TestBed` configuration.
