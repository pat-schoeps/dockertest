class Auth::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  
  before_action :configure_sign_up_params, only: [:create]

  private
  
  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
  end

  def respond_with(resource, _opts = {})
    if resource.persisted?
      token = resource.generate_jwt
      response.headers['Authorization'] = "Bearer #{token}"
      
      render json: {
        status: { code: 200, message: 'Signed up successfully.' },
        data: UserSerializer.new(resource).serializable_hash[:data][:attributes]
      }, status: :ok
    else
      render json: {
        status: { message: "User couldn't be created successfully. #{resource.errors.full_messages.to_sentence}" }
      }, status: :unprocessable_entity
    end
  end
end