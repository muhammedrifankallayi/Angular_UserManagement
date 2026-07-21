# Comprehensive Bug and Security Report

This report outlines key security vulnerabilities, logic errors, and architectural/frontend bugs discovered in the backend and frontend systems of the JWT project.

---

## 1. Security Vulnerabilities

### A. Lack of Authentication & Authorization Middleware on Admin Routes
- **File affected**: `backend/routes/adminroute.js`
- **Description**: The administrative endpoints (such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack any authentication or authorization checking middleware. Consequently, any unauthenticated client can trigger these endpoints, allowing them to delete users, modify details, or create new users without admin credentials.
- **Remediation**: Create an authorization middleware (e.g., `isAdmin`) that extracts and validates the JWT from `req.cookies["jwt"]`, verifies that the user exists, and checks that their `is_admin` attribute is `true` before proceeding to the route handler.

### B. Sensitive Data Exposure (Passwords in API Responses)
- **File affected**: `backend/routes/adminroute.js` (Route: `/users`)
- **Description**: The `/users` route performs `await User.find({})` and directly returns the resulting objects to the client. This exposes hashed passwords, which represents a significant security leak.
- **Remediation**: Exclude the password field using Mongoose selection (e.g., `User.find({}).select('-password')`) or destructure and omit the password from each user object before sending the response.

### C. Misconfigured CORS and Lack of CSRF Protection
- **File affected**: `backend/index.js`
- **Description**: The backend CORS configuration has `credentials: true` and permits requests from `http://localhost:4200`. Since the session identifiers (JWTs) are stored in cookies, the application is highly susceptible to Cross-Site Request Forgery (CSRF) attacks unless appropriate Anti-CSRF tokens or `SameSite` cookie attributes are set.
- **Remediation**: Use anti-CSRF tokens or configure the JWT cookie with security attributes:
  ```javascript
  res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
  });
  ```

### D. Hardcoded Secret Key (Use of "secret" instead of environment variables)
- **Files affected**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: The application signs and verifies JWTs using a hardcoded secret string `"secret"`. While `.env` defines `jwtsecret="secret"`, the backend routes completely ignore `process.env.jwtsecret` and use the string literal `"secret"`.
- **Remediation**: Replace all hardcoded occurrences of `"secret"` with `process.env.jwtsecret` (or fallback safely):
  ```javascript
  const token = jwt.sign({ _id: user._id }, process.env.jwtsecret);
  ```

### E. Type Inconsistency in Mongoose User Model Schema
- **File affected**: `backend/models/user.js`
- **Description**: The `is_admin` field is defined as a `String` with a default of `false` (a boolean). This results in type inconsistencies and makes queries like `{ is_admin: true }` tricky or buggy depending on MongoDB coercion.
- **Remediation**: Define `is_admin` as a `Boolean`:
  ```javascript
  is_admin: {
      type: Boolean,
      default: false
  }
  ```

---

## 2. Backend Logic Errors

### A. JWT Overwriting Admin Session in User Creation
- **File affected**: `backend/routes/adminroute.js` (Route: `/createuser`)
- **Description**: When an administrator creates a new user, the `/createuser` handler generates a new JWT token for the *created user* and saves it to the response cookies. This immediately logs out the administrator and logs them in as the newly created user.
- **Remediation**: Remove the cookie generation and setting code from the administrative `/createuser` endpoint. It should simply save the user and return a success message.

### B. Unchecked File Upload (Multer Middleware)
- **File affected**: `backend/routes/routes.js` (Route: `/profile-upload-single`)
- **Description**: The profile-upload handler attempts to access `req.file.filename` directly without first checking if `req.file` exists. If a user triggers the route without sending a file, the backend will crash due to a `TypeError` (Cannot read properties of undefined (reading 'filename')).
- **Remediation**: Check if `req.file` is defined before accessing its attributes:
  ```javascript
  if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
  }
  ```

### C. Poor Error Handling (Empty Catch Blocks)
- **Files affected**: `backend/routes/routes.js` and `backend/routes/adminroute.js`
- **Description**: Multiple routes feature empty catch blocks (e.g., `catch(error) {}`) or only log the error on the console without sending any response back to the client. This leaves the connection hanging until it times out.
- **Remediation**: Ensure all catch blocks return an error response, e.g.:
  ```javascript
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
  ```

---

## 3. Frontend Bugs and Architectural Issues

### A. Incorrect Argument Placement in `HttpClient.post` API Requests
- **Files affected**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` (and possibly other files calling `this.http.post`)
- **Description**: When making POST requests using Angular's `HttpClient`, the arguments are passed incorrectly. In `admin-userlist.component.ts`, the deletion request is structured as:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {
    withCredentials: true
  })
  ```
  In Angular's `HttpClient.post`, the second parameter is the request **body**, and the third parameter is the **options** object. Passing options as the second argument means they are treated as the payload, and options like `withCredentials` are completely ignored (meaning cookies will not be sent to the backend).
- **Remediation**: Supply a body argument (or `null`) as the second parameter:
  ```typescript
  this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, null, {
    withCredentials: true
  })
  ```

### B. Non-functional Admin User Search
- **Files affected**: `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html` and `.ts`
- **Description**: The template includes a search input field `<input type="text" placeholder="Search" class="input">` but lacks any model binding, reactive form controls, or corresponding logic/selectors in NgRx state to actually filter the user list.
- **Remediation**:
  1. Bind the input to a component class property using `[(ngModel)]` or use `ReactiveForms`.
  2. Implement a local filter in the component or write an NgRx selector/action to handle search and update the displayed user list dynamically.

### C. Misspelled Frontend Directory Name
- **Vulnerability**: The directory containing the Angular application is named `frondend` instead of `frontend`. While not causing execution crashes, it degrades developer experience and makes path resolution confusing.

---

## 4. Frontend Test Failures & Resolution Strategies

### A. The Core Problem
Executing the frontend unit test suite via `ng test` results in **12 out of 14 failing tests**. The primary errors are:
1. `NullInjectorError: No provider for HttpClient!`
2. `NullInjectorError: No provider for Router!`
3. Missing Store Mocking (for NgRx-dependent components).

### B. Resolution Strategy for Spec Files
To fix these failures, the test setup in `*.spec.ts` files must be updated with the appropriate testing modules.

1. **For HttpClient Injection**:
   Import and add `HttpClientTestingModule` from `@angular/common/http/testing` to the `imports` array in `TestBed.configureTestingModule`.

2. **For Router Injection**:
   Import and add `RouterTestingModule` from `@angular/router/testing` to the `imports` array.

3. **For NgRx Store**:
   Instead of importing the full store, import `provideMockStore` from `@ngrx/store/testing` and add it to the `providers` list of the TestBed configuration:
   ```typescript
   import { provideMockStore } from '@ngrx/store/testing';
   // ...
   TestBed.configureTestingModule({
     imports: [HttpClientTestingModule, RouterTestingModule],
     providers: [provideMockStore({})]
   });
   ```
