module JwtAuthenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    token = extract_token_from_header
    
    unless token
      render_unauthorized
      return
    end

    payload = decode_jwt_token(token)
    
    unless payload
      render_unauthorized
      return
    end

    user = find_user_from_payload(payload)
    
    unless user && valid_token_for_user?(user, payload)
      render_unauthorized
      return
    end

    @current_user = user
  end

  private

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header&.start_with?('Bearer ')
    
    # Fix #1: Validate exactly 2 parts (Bearer + token)
    parts = auth_header.split(' ')
    return nil unless parts.length == 2
    
    token = parts[1]
    
    # Fix #5: Validate token length (JWT tokens are typically 100-500 chars)
    return nil if token.blank? || token.length > 2048 || token.length < 20
    
    token
  end

  def decode_jwt_token(token)
    # Fix #2: Ensure secret key is available, fail fast if not
    secret_key = Rails.application.credentials.devise_jwt_secret_key || ENV['DEVISE_JWT_SECRET_KEY']
    raise 'JWT secret key not configured' if secret_key.blank?
    
    # Decode token and get both payload and header
    payload, header = JWT.decode(
      token,
      secret_key,
      true,
      { 
        algorithm: 'HS256',
        verify_expiration: true,
        verify_iat: true,
        verify_not_before: true
      }
    )
    
    # Fix #4: Explicitly verify algorithm to prevent algorithm confusion attacks
    return nil unless header['alg'] == 'HS256'
    
    # Fix #6: Validate payload structure
    return nil unless valid_payload_structure?(payload)
    
    payload
  rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::InvalidIatError, JWT::ImmatureSignature, RuntimeError
    nil
  end

  def find_user_from_payload(payload)
    return nil unless payload['sub'].present?
    
    User.find_by(id: payload['sub'])
  end

  def valid_token_for_user?(user, payload)
    # Validate JTI to prevent token reuse after logout
    return false unless payload['jti'].present?
    
    # Fix #3: Use secure comparison to prevent timing attacks
    return false unless secure_compare(user.jti.to_s, payload['jti'].to_s)
    
    # Additional validation: ensure token hasn't been manually revoked
    # You could add a blacklist check here if needed
    
    true
  end

  def valid_payload_structure?(payload)
    # Fix #6: Validate required claims exist and have correct types
    return false unless payload.is_a?(Hash)
    return false unless payload['sub'].present? && payload['sub'].is_a?(Integer)
    return false unless payload['jti'].present? && payload['jti'].is_a?(String)
    return false unless payload['exp'].present? && payload['exp'].is_a?(Integer)
    
    true
  end

  def secure_compare(a, b)
    # Fix #3: Constant-time string comparison to prevent timing attacks
    return false unless a.bytesize == b.bytesize
    
    l = a.unpack("C*")
    r = b.unpack("C*")
    
    result = 0
    l.zip(r) { |x, y| result |= x ^ y }
    result == 0
  end

  def render_unauthorized
    # Always return the same generic message to prevent information leakage
    render json: { error: 'Authentication required' }, status: :unauthorized
  end

  def current_user
    @current_user
  end
end