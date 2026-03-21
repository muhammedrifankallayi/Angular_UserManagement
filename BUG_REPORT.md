# BUG REPORT

This document outlines the identified security leaks, logic errors, and infrastructure issues within the project.

## Security Issues

1. **Hashed Password Leak**
   - **Location:** `backend/routes/adminroute.js`, `/api/admin/users` endpoint.
   - **Description:** The endpoint returns all user data, including hashed passwords, because the code responsible for excluding the password field is currently commented out.

2. **Unprotected Administrative Endpoints**
   - **Location:** `backend/routes/adminroute.js`.
   - **Description:** Administrative endpoints such as `/users`, `/deleteUser/:id`, `/editUser`, and `/createuser` are not protected by authentication middleware, allowing unauthorized access.

3. **Admin Session Overwrite during User Creation**
   - **Location:** `backend/routes/adminroute.js`, `/api/admin/createuser` endpoint.
   - **Description:** When an administrator creates a new user, the backend issues a new JWT cookie for the created user, effectively logging out the administrator and replacing their session with the new user's.

4. **Hardcoded JWT Secret**
   - **Location:** `backend/routes/adminroute.js` and `backend/routes/routes.js`.
   - **Description:** The JWT signing and verification process uses a hardcoded secret string `"secret"` instead of a value retrieved from environment variables, posing a security risk.

## Logic and Implementation Errors

5. **`is_admin` Type Inconsistency**
   - **Location:** `backend/models/user.js`.
   - **Description:** The `is_admin` field is defined as a `String`, but its default value is set to `false` (a Boolean). This type mismatch can lead to unexpected behavior.

6. **Non-functional Search Filter**
   - **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`.
   - **Description:** The search input in the admin user list is not connected to any component logic, rendering the filtering functionality completely broken.

7. **Incorrect HttpClient.post Usage**
   - **Location:** `frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts` and `frondend/jwtapp/src/app/components/admin-useredit/admin-useredit.component.ts`.
   - **Description:** Several POST requests pass the options object (containing `withCredentials: true`) as the second argument. For `HttpClient.post`, the second argument is the body, and the options should be the third argument. This prevents authentication cookies from being sent correctly.

## Infrastructure and Consistency Issues

8. **Misspelled Frontend Directory**
   - **Location:** Project root.
   - **Description:** The frontend directory is misspelled as `frondend` instead of `frontend` throughout the repository.

9. **Missing Backend Start Script**
   - **Location:** `backend/package.json`.
   - **Description:** The `package.json` file lacks a `start` script, requiring manual execution via `node index.js`.

10. **Broken Angular Unit Tests**
    - **Location:** `frondend/jwtapp/`.
    - **Description:** 12 out of 14 Angular unit tests fail with `NullInjectorError` because essential providers like `Store`, `HttpClient`, and `Router` are not correctly mocked or provided in the test configurations.
