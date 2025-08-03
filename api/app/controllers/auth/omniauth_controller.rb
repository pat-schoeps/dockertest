class Auth::OmniauthController < ApplicationController

  def google_oauth2
    auth = request.env['omniauth.auth']
    user = User.from_omniauth(auth)
    
    if user.persisted?
      token = user.generate_jwt
      render json: {
        status: { code: 200, message: 'Logged in successfully.' },
        data: {
          user: UserSerializer.new(user).serializable_hash[:data][:attributes],
          token: token
        }
      }
    else
      render json: {
        status: { message: "There was an error signing you in through Google." }
      }, status: :unprocessable_entity
    end
  end

  def google_oauth2_callback
    code = params[:code]
    
    if code.blank?
      return render json: { error: 'Authorization code is required' }, status: :bad_request
    end

    begin
      client = OAuth2::Client.new(
        ENV['GOOGLE_CLIENT_ID'],
        ENV['GOOGLE_CLIENT_SECRET'],
        site: 'https://oauth2.googleapis.com',
        authorize_url: '/o/oauth2/auth',
        token_url: '/token'
      )

      token = client.auth_code.get_token(
        code,
        redirect_uri: ENV.fetch('GOOGLE_REDIRECT_URI', 'http://localhost:3001/auth/google/callback')
      )

      user_info_response = token.get('https://www.googleapis.com/oauth2/v2/userinfo')
      user_info = JSON.parse(user_info_response.body)

      user = User.where(email: user_info['email']).first_or_create do |u|
        u.provider = 'google_oauth2'
        u.uid = user_info['id']
        u.name = user_info['name']
        u.avatar_url = user_info['picture']
        u.password = Devise.friendly_token[0, 20]
      end

      jwt_token = user.generate_jwt

      render json: {
        status: { code: 200, message: 'Logged in successfully.' },
        data: {
          user: UserSerializer.new(user).serializable_hash[:data][:attributes],
          token: jwt_token
        }
      }
    rescue OAuth2::Error => e
      render json: { error: e.message }, status: :unauthorized
    rescue => e
      render json: { error: 'An error occurred during authentication' }, status: :internal_server_error
    end
  end
end