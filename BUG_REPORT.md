# Bug Report - JWT Authentication Project

This report documents several critical issues found in the JWT-based authentication project, categorized into security vulnerabilities, functional bugs, and environment/setup issues.

## 1. Security Vulnerabilities

### 1.1 Password Hash Leakage
The admin endpoint for listing users (`/api/admin/users`) returns all user details, including hashed passwords, because the logic to exclude passwords is currently commented out in `backend/routes/adminroute.js`.

### 1.2 Unprotected Administrative Routes
Many endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`) lack any authentication or authorization middleware. This allows anyone to manage users without being an authenticated admin.

### 1.3 Hardcoded JWT Secrets
Both `backend/routes/routes.js` and `backend/routes/adminroute.js` use a hardcoded secret string `"secret"` for signing and verifying JSON Web Tokens instead of using environment variables.

### 1.4 Admin Session Overwrite on User Creation
The `createuser` endpoint in `backend/routes/adminroute.js` issues a new JWT cookie for the newly created user upon success. This overwrites the administrator's own session cookie, effectively logging the admin out.

### 1.5 Type Inconsistency in User Model
In `backend/models/user.js`, the `is_admin` field is defined with `type: String` but has a `default: false` (Boolean). This can lead to unexpected behavior during queries or updates.

### 1.6 Missing CSRF Protection
The backend application lacks CSRF (Cross-Site Request Forgery) protection, which is particularly critical given that it uses cookies for authentication and has CORS enabled with `credentials: true`.

## 2. Functional Bugs

### 2.1 Broken User Search Filter
In the `AdminUserlistComponent`, the search input field in the template is not connected to any logic in the component. As a result, typing in the search box does nothing.

### 2.2 Incorrect HttpClient Usage in Angular
In several places (e.g., `AdminUserlistComponent.deleteUser`, `AdminUsereditComponent.submit`, `AdminUsereditComponent.getusers`), `HttpClient.post` is called with the `withCredentials` option as the second argument. For POST requests, the second argument is the request body, and options should be the third argument. This prevents authentication cookies from being sent.

## 3. Environment and Setup Issues

### 3.1 Misspelled Directory Name
The frontend directory is misspelled as `frondend` instead of `frontend` in the root of the repository.

### 3.2 Missing Backend Start Script
The `backend/package.json` file is missing a `start` script, making it less intuitive to start the server (e.g., `npm start` fails).

### 3.3 Broken Angular Unit Tests
The majority of Angular unit tests (12 out of 14) are failing with `NullInjectorError` because necessary providers (like `MockStore`, `HttpClientTestingModule`, `FormsModule`, `RouterTestingModule`) are missing from the `TestBed` configuration.

## 4. Test Results

### 4.1 Backend Tests
Running `npm test` in the `backend/` directory results in:
```
> backend@1.0.0 test
> echo "Error: no test specified" && exit 1

Error: no test specified
```

### 4.2 Frontend Tests
Running `ng test` in the `frondend/jwtapp/` directory results in:
```
TOTAL: 12 FAILED, 2 SUCCESS
```
The failures are predominantly `NullInjectorError` due to missing providers in the test suites.
