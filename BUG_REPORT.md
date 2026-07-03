# Bug Report

This document outlines the security vulnerabilities, logic errors, and frontend defects identified in the project.

## 1. Security Vulnerabilities

| Bug Description | Location | Severity |
| :--- | :--- | :--- |
| **Hardcoded JWT Secret:** The application uses a hardcoded string `"secret"` for signing and verifying JWT tokens. | `backend/routes/adminroute.js`, `backend/routes/routes.js` | High |
| **Missing Auth Middleware:** Admin routes lack a centralized middleware for authentication and authorization, leading to inconsistent security checks. | `backend/routes/adminroute.js` | High |
| **Sensitive Data Exposure:** The `/api/admin/users` endpoint returns full user objects, including hashed passwords, to the client. | `backend/routes/adminroute.js` | High |
| **Hardcoded Database Credentials:** The MongoDB connection string is hardcoded in the main entry point. | `backend/index.js` | Medium |

## 2. Backend Logic Errors

| Bug Description | Location | Severity |
| :--- | :--- | :--- |
| **Type Inconsistency in User Model:** The `is_admin` field is defined as a `String` but is initialized with a boolean default (`false`). | `backend/models/user.js` | Medium |
| **Admin Session Hijacking/Overwrite:** The `/createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the administrator's session cookie. | `backend/routes/adminroute.js` | High |
| **Unsafe File Upload:** The profile upload route attempts to access `req.file.filename` without verifying that a file was actually uploaded. | `backend/routes/routes.js` | Medium |
| **Suppressed Exceptions:** Multiple `catch` blocks are empty or only log to the console without sending an error response to the client. | `backend/routes/adminroute.js`, `backend/routes/routes.js` | Medium |

## 3. Frontend Defects

| Bug Description | Location | Severity |
| :--- | :--- | :--- |
| **Misspelled Directory:** The frontend root directory is misspelled as `frondend`. | Root Directory | Low |
| **Incorrect HttpClient Usage:** `http.post` calls pass the options object (containing `withCredentials`) as the second argument (payload) instead of the third. | `AdminUserlistComponent`, `AdminUsereditComponent` | High |
| **Non-functional Search Input:** The search bar in the user list is a static HTML element with no implemented logic in the component or NgRx state. | `admin-userlist.component.html` | Low |
| **Broken Unit Tests:** Most Angular unit tests fail due to missing dependencies (`HttpClient`, `Router`, `MockStore`) in the test setup. | `frondend/jwtapp/src/app/**/*.spec.ts` | Medium |
