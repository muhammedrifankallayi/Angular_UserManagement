# Bug Report: JWT Application

## 1. Security Leaks
- **Password Leak in Admin API**: The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user objects directly from the database without excluding the `password` field. The exclusion logic is currently commented out.
- **Unprotected Administrative Routes**: Administrative endpoints in `backend/routes/adminroute.js` (e.g., `/users`, `/deleteUser/:id`, `/editUser`, `/createuser`) do not have any middleware to verify if the requester is an authenticated administrator.
- **Hardcoded JWT Secrets**: Both `backend/routes/adminroute.js` and `backend/routes/routes.js` use the hardcoded string `"secret"` for signing and verifying JWT tokens. Although there is a `.env` file with `jwtsecret="secret"`, it is not consistently used, and the secret itself is insecure.
- **Missing CSRF Protection**: The application lacks Cross-Site Request Forgery (CSRF) protection, and the backend CORS configuration allows credentials for `http://localhost:4200`.
- **Session Overwrite**: In `backend/routes/adminroute.js`, the `createuser` endpoint issues a new JWT cookie for the newly created user, which overwrites the administrator's own session cookie.

## 2. Logic Errors
- **Broken Search Functionality**: The `AdminUserlistComponent` template (`frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.html`) contains a search input that is not bound to any component logic, making the filter non-functional.
- **Incorrect HttpClient Usage**: In `AdminUserlistComponent` and `AdminUsereditComponent`, `HttpClient.post` calls pass the `withCredentials` option as the second argument (which is the request body) instead of the third argument (options). This prevents authentication cookies from being sent.
- **Type Inconsistency**: In `backend/models/user.js`, the `is_admin` field is defined as a `String` but has a `Boolean` default (`false`), which can lead to unexpected behavior during queries.

## 3. Environment and Infrastructure Issues
- **Misspelled Directory**: The frontend directory is misspelled as `frondend` instead of `frontend` throughout the repository.
- **Missing Backend Start Script**: The `backend/package.json` does not include a `start` script, requiring users to run `node index.js` manually.
- **Dependency Issues**: The frontend requires `--legacy-peer-deps` during installation to resolve dependency conflicts.

## 4. Test Failures
- **Angular Unit Tests**: 12 out of 14 Angular unit tests are failing with `NullInjectorError: No provider for HttpClient!`. This is because the test suites do not include `HttpClientTestingModule`. Other missing providers like `provideMockStore`, `FormsModule`, and `RouterTestingModule` are also likely required for a full fix.
