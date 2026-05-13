# Bug Report - JWT Authentication Project

This report documents identified security vulnerabilities, logic errors, and frontend issues in the project.

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
- **Location:** `backend/routes/adminroute.js`, `backend/routes/routes.js`, and `backend/.env`
- **Description:** The JWT secret is hardcoded as `"secret"` in the route files. Although it is defined in `.env`, the code uses the hardcoded string directly.
- **Impact:** High. Attackers can easily forge JWT tokens if they obtain the secret.

### 1.2 Sensitive Data Exposure
- **Location:** `backend/routes/adminroute.js` (Endpoint: `GET /api/admin/users`)
- **Description:** The `/users` endpoint returns all user data directly from the database without filtering out sensitive fields.
- **Impact:** High. Hashed passwords and other internal fields are exposed to anyone who can access the endpoint.

### 1.3 Missing Administrative Authentication
- **Location:** `backend/routes/adminroute.js` (Endpoints: `/users`, `/deleteUser/:id`, `/editDetails/:id`, `/editUser`, `/createuser`)
- **Description:** Most administrative endpoints do not check if the requester is actually an administrator or even logged in (except for `/active`).
- **Impact:** Critical. Any user (or even unauthenticated visitors) can delete users, edit details, or create new users if they know the API structure.

### 1.4 Lack of CSRF Protection
- **Location:** `backend/index.js`
- **Description:** The application uses cookies for authentication but does not implement any Cross-Site Request Forgery (CSRF) protection.
- **Impact:** Medium/High. Authenticated users can be tricked into performing unintended actions.

## 2. Logic Errors

### 2.1 Administrator Session Overwrite
- **Location:** `backend/routes/adminroute.js` (Endpoint: `POST /createuser`)
- **Description:** When an administrator creates a new user, the backend issues a new JWT cookie for the *newly created user*, overwriting the administrator's own session cookie.
- **Impact:** Low/Medium. The administrator is effectively logged out and replaced by the new user session after creating a user.

### 2.2 Incorrect `HttpClient.post` Usage
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`
- **Description:** The `http.post` calls pass `{ withCredentials: true }` as the second argument (the request body) instead of the third argument (options).
- **Impact:** Medium. Authentication cookies are not sent with these POST requests, which would cause them to fail if proper authentication were implemented on the backend.

### 2.3 Invalid Model Schema Definition
- **Location:** `backend/models/user.js`
- **Description:** The `is_admin` field is defined as `type: String` but is given a default value of `false` (boolean).
- **Impact:** Low. May lead to inconsistent data types in the database.

## 3. Frontend & Environment Issues

### 3.1 Misspelled Directory
- **Location:** Root directory
- **Description:** The frontend directory is named `frondend` instead of `frontend`.
- **Impact:** Low (consistency/professionalism).

### 3.2 Non-functional Search
- **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`
- **Description:** The search input field in the User List is a static HTML element with no data binding or logic attached to it.
- **Impact:** Medium (feature parity).

### 3.3 Significant Unit Test Failures
- **Location:** `frondend/jwtapp/`
- **Description:** 12 out of 14 Angular unit tests are failing. Most fail due to `NullInjectorError: No provider for HttpClient!`.
- **Impact:** Medium. Indicates poor test maintenance and lack of automated verification.
