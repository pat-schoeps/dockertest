# Rails API Authentication System

This Rails API uses JWT tokens with Devise and supports Google OAuth2 authentication.

## Authentication Endpoints

### Email/Password Authentication
- **POST /auth/sign_up** - Register new user
  - Params: `{ user: { email, password, password_confirmation, name } }`
  - Returns: User data + JWT token in Authorization header

- **POST /auth/sign_in** - Login with email/password
  - Params: `{ user: { email, password } }`
  - Returns: User data + JWT token in Authorization header

- **DELETE /auth/sign_out** - Logout
  - Headers: `Authorization: Bearer <token>`
  - Returns: Success message

### Google OAuth2
- **POST /auth/google** - Authenticate with Google OAuth
  - Params: `{ code: 'google_auth_code' }`
  - Returns: User data + JWT token in response body

### Protected Endpoints
- **GET /api/v1/users/me** - Get current user
  - Headers: `Authorization: Bearer <token>`
  - Returns: Current user data

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT Secret Key
DEVISE_JWT_SECRET_KEY=your_jwt_secret_key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

## Security Features

- **JWT Token Validation**: Comprehensive token verification including expiration, signature, and JTI
- **Information Security**: Generic error messages prevent system information leakage
- **Token Revocation**: JTI validation ensures tokens can't be reused after logout
- **Timing Attack Protection**: Constant-time string comparisons and consistent response times
- **Algorithm Confusion Prevention**: Explicit algorithm verification prevents "none" algorithm attacks
- **Token Structure Validation**: Validates payload structure and claim types
- **Token Length Limits**: Prevents DoS attacks with oversized tokens
- **Header Format Validation**: Strict "Bearer <token>" format enforcement
- **CORS Protection**: Configured to only allow requests from your frontend
- **Rate Limiting**: Optional rate limiting for production environments

## Security Best Practices Implemented

1. **No Information Leakage**: All authentication errors return generic "Authentication required" message
2. **Proper JWT Validation**: Validates expiration, signature, issued-at time, not-before claims, and algorithm
3. **Token Revocation Support**: Uses JTI (JWT ID) to prevent token reuse after logout
4. **Safe Database Queries**: Uses `find_by` instead of `find` to prevent exceptions
5. **Constant-Time Responses**: All failure paths have similar execution time
6. **Secure String Comparison**: JTI comparison uses constant-time algorithm to prevent timing attacks
7. **Token Format Security**: Validates exact "Bearer <token>" format, prevents multiple token injection
8. **Algorithm Enforcement**: Explicitly verifies HS256 algorithm to prevent algorithm confusion attacks
9. **Payload Structure Validation**: Validates required claims exist with correct data types
10. **DoS Protection**: Token length limits prevent oversized token attacks
11. **Secret Key Validation**: Fails fast if JWT secret key is not configured

## Testing

Run the test suite:
```bash
bundle exec rspec
```

## Frontend Integration

1. For Google OAuth:
   - Redirect users to Google OAuth consent page
   - Capture the authorization code
   - Send code to `/auth/google`
   - Store the returned JWT token

2. For authenticated requests:
   - Include the JWT token in the Authorization header
   - Format: `Authorization: Bearer <token>`

3. Token expiration:
   - Tokens expire after 24 hours
   - Handle 401 responses by redirecting to login