# End-to-End Testing with Playwright

This directory contains Playwright E2E tests for the React client application.

## Test Structure

- `auth.spec.ts` - Tests for authentication flow and login page
- `home.spec.ts` - Tests for authenticated home page
- `oauth-callback.spec.ts` - Tests for Google OAuth callback handling
- `global-setup.ts` - Global setup configuration

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (visual test runner)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# Install browsers (run this first)
npm run playwright:install
```

## Test Features

### Authentication Tests
- Login page rendering and responsiveness
- Google OAuth button functionality
- Error handling for missing configuration
- Redirect behavior for unauthenticated users

### Home Page Tests
- Authenticated user welcome message
- Sign out functionality
- API error handling
- Token management

### OAuth Callback Tests
- Successful authentication flow
- Error handling for OAuth failures
- Missing authorization code scenarios
- API error responses

## Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL**: http://localhost:3001
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Auto-start**: Automatically starts dev server before tests
- **Screenshots**: Captured on failures
- **Traces**: Collected on retry

## Mocking

Tests use Playwright's route mocking to:
- Mock API responses for authentication
- Simulate OAuth success/failure scenarios
- Test error conditions without external dependencies
- Mock user profile data

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: External APIs are mocked to avoid dependencies
3. **Responsive**: Tests verify mobile and desktop layouts
4. **Error Handling**: Both success and error scenarios are tested
5. **User Journey**: Tests follow realistic user workflows