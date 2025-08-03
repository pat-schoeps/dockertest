module RateLimitable
  extend ActiveSupport::Concern

  included do
    before_action :check_rate_limit
  end

  private

  def check_rate_limit
    return unless Rails.env.production? # Only enable in production
    
    key = "rate_limit:auth:#{request.remote_ip}"
    current_requests = Rails.cache.read(key) || 0
    
    if current_requests >= rate_limit_max_requests
      render json: { 
        error: 'Too many requests. Please try again later.' 
      }, status: :too_many_requests
      return
    end
    
    Rails.cache.write(key, current_requests + 1, expires_in: rate_limit_window)
  end

  def rate_limit_max_requests
    # Allow 60 authentication attempts per hour per IP
    60
  end

  def rate_limit_window
    1.hour
  end
end