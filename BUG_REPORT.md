# Bug Report - JWT App

## 1. Security Vulnerabilities

### 1.1 Hardcoded JWT Secret
The JWT secret is hardcoded as `"secret"` in both `backend/routes/routes.js` and `backend/routes/adminroute.js`. This should be stored in environment variables (e.g., `process.env.JWT_SECRET`).

### 1.2 Sensitive Data Exposure
The `/api/admin/users` endpoint in `backend/routes/adminroute.js` returns all user objects directly from the database, including hashed passwords. The logic to exclude passwords is currently commented out.
```javascript
// backend/routes/adminroute.js
adminrouter.get('/users',async (req,res)=>{
    try {
        const user = await User.find({})
        // const {password, ...data} = await user.toJSON(); // THIS IS COMMENTED OUT
        console.log(user);
        res.send(user)
    } catch (error) {
        console.log(error.message);
    }
})
```

### 1.3 Missing Global Authentication Middleware
While some routes manually check for the JWT cookie, there is no centralized middleware to protect administrative or private routes, leading to potential unauthorized access if a check is missed.

## 2. Logic Errors

### 2.1 Admin Session Overwrite
In `backend/routes/adminroute.js`, the `createuser` endpoint issues a new JWT cookie for the newly created user. This overwrites the administrator's session cookie, effectively logging them out after they create a user.
```javascript
// backend/routes/adminroute.js
const token = jwt.sign({_id:_id},"secret");
res.cookie("jwt",token,{
    httpOnly:true,
    maxAge:24*60*60*1000
})
```

### 2.2 Incorrect HttpClient Options Usage
In `AdminUserlistComponent` and potentially others, `withCredentials: true` is passed as the second argument to `http.post`, which is the request body, instead of the third argument (options).
```typescript
// frondend/jwtapp/src/app/components/admin-userlist/admin-userlist.component.ts
this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`,{
  withCredentials:true // This is being sent as the body!
}).subscribe(...)
```

### 2.3 Inconsistent Schema Types
In `backend/models/user.js`, `is_admin` is defined as a `String` but has a boolean `false` as its default value.
```javascript
is_admin:{
    type:String,
    default:false
}
```

## 3. Frontend Issues

### 3.1 Non-functional Search
The `AdminUserlistComponent` template includes a search input field, but there is no corresponding logic or data binding in the TypeScript component to filter the user list.

### 3.2 Misspelled Directory
The frontend root directory is misspelled as `frondend` instead of `frontend`.

## 4. Test Failures

### 4.1 Angular Unit Test Failures
Running `ng test` reveals that 12 out of 14 tests are failing. Most failures are `NullInjectorError: No provider for HttpClient!`, indicating that `HttpClientTestingModule` or a mock provider is missing from the `TestBed` configuration in multiple `.spec.ts` files.
