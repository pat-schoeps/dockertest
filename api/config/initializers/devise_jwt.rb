Devise.setup do |config|
  config.jwt do |jwt|
    jwt.secret = ENV.fetch('DEVISE_JWT_SECRET_KEY') { Rails.application.credentials.devise_jwt_secret_key || 'test_secret_key_for_jwt_testing' }
    jwt.dispatch_requests = [
      ['POST', %r{^/auth/sign_in$}]
    ]
    jwt.revocation_requests = [
      ['DELETE', %r{^/auth/sign_out$}]
    ]
    jwt.expiration_time = 24.hours.to_i
  end

  config.navigational_formats = []
end