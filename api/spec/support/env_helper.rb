# Set test environment variables
ENV['DEVISE_JWT_SECRET_KEY'] ||= 'test_secret_key_for_jwt_testing'
ENV['GOOGLE_CLIENT_ID'] ||= 'test_google_client_id'
ENV['GOOGLE_CLIENT_SECRET'] ||= 'test_google_client_secret'
ENV['GOOGLE_REDIRECT_URI'] ||= 'http://localhost:3000/auth/google/callback'
ENV['FRONTEND_URL'] ||= 'http://localhost:3000'