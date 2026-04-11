# Bug Report

This report documents several security vulnerabilities, logic errors, and architectural/environment issues identified in the JWT project.

## 1. Security Vulnerabilities

### 1.1 Password Hash Leakage
- **Location:** `backend/routes/adminroute.js` in the `/users` GET endpoint.
- **Issue:** The endpoint fetches all users and sends the entire objects to the client. The line that would exclude the password field is currently commented out.
- **Impact:** Administrative users can see the hashed passwords of all users in the system.

### 1.2 Hardcoded JWT Secrets
- **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`.
- **Issue:** The JWT signing and verification processes use a hardcoded secret string `"secret"`. While there is a `.env` file, it's not being utilized for this purpose in the code.
- **Impact:** Compromising the hardcoded secret allows attackers to forge valid JWTs.

### 1.3 Unprotected Administrative Endpoints
- **Location:** `backend/routes/adminroute.js`.
- **Issue:** Routes such as `/users`, `/deleteUser/:id`, `/editDetails/:id`, and `/editUser` lack authentication and authorization middleware.
- **Impact:** Any client can access and modify user data by hitting these endpoints directly.

### 1.4 Missing CSRF Protection
- **Location:** Global backend configuration.
- **Issue:** The application uses cookies for authentication but does not implement any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Users are vulnerable to CSRF attacks where malicious sites can perform actions on their behalf.

---

## 2. Logic Errors

### 2.1 Broken User Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`.
- **Issue:** The search input field is present in the template but is not bound to any component logic (no `ngModel` or event handling).
- **Impact:** The search functionality is non-functional for administrators.

### 2.2 Administrator Session Overwrite
- **Location:** `backend/routes/adminroute.js` in the `/createuser` POST endpoint.
- **Issue:** When an admin creates a new user, the backend generates a new JWT for that user and sends it back as a cookie.
- **Impact:** This overwrites the administrator's own session cookie with the new user's session, effectively logging the admin out.

### 2.3 Incorrect `HttpClient.post` Usage
- **Location:** `AdminUserlistComponent` and `AdminUsereditComponent` in the frontend.
- **Issue:** The `http.post` calls pass the options object (containing `withCredentials: true`) as the second argument. In Angular's `HttpClient`, the second argument is the request body, and options should be the third.
- **Impact:** Authentication cookies might not be sent with these requests, and the options object is being sent as the payload.

### 2.4 Data Type Inconsistency
- **Location:** `backend/models/user.js`.
- **Issue:** The `is_admin` field is defined with `type: String` but has a default value of `false` (a boolean).
- **Impact:** This can lead to unexpected behavior during database queries and logic checks.

---

## 3. Architectural and Environment Issues

### 3.1 Misspelled Directory Name
- **Issue:** The frontend directory is named `frondend` instead of the standard `frontend`.
- **Impact:** Confusion and potential breakage in automated scripts or for new developers.

### 3.2 Missing Backend Start Script
- **Location:** `backend/package.json`.
- **Issue:** There is no `start` script defined in `package.json`.
- **Impact:** Developers must know to run `node index.js` manually, which is non-standard.

### 3.3 Broken Frontend Unit Tests
- **Location:** `frondend/jwtapp/src/app/components/**/*.spec.ts`.
- **Issue:** 12 out of 14 unit tests fail with `NullInjectorError` because required providers (like `HttpClient`, `Store`, etc.) are not configured in the `TestBed`.
- **Impact:** The project lacks a reliable automated testing suite for the frontend.
