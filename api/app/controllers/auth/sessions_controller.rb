class Auth::SessionsController < Devise::SessionsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    token = resource.generate_jwt
    response.headers['Authorization'] = "Bearer #{token}"
    
    render json: {
      status: { code: 200, message: 'Logged in successfully.' },
      data: UserSerializer.new(resource).serializable_hash[:data][:attributes]
    }, status: :ok
  end

  def respond_to_on_destroy
    if request.headers['Authorization'].present?
      jwt_payload = JWT.decode(request.headers['Authorization'].split(' ').last, 
                              Rails.application.credentials.devise_jwt_secret_key || ENV['DEVISE_JWT_SECRET_KEY'], 
                              true).first
      current_user = User.find(jwt_payload['sub'])
      
      render json: {
        status: 200,
        message: "Logged out successfully."
      }, status: :ok
    else
      render json: {
        status: 401,
        message: "Couldn't find an active session."
      }, status: :unauthorized
    end
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    render json: {
      status: 401,
      message: "Couldn't find an active session."
    }, status: :unauthorized
  end
end