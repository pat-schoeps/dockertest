require 'rails_helper'

RSpec.describe 'Api::V1::Users', type: :request do
  describe 'GET /api/v1/users/me' do
    let(:user) { create(:user) }
    
    context 'when authenticated' do
      it 'returns the current user data' do
        get '/api/v1/users/me', headers: auth_headers(user), as: :json
        
        expect(response).to have_http_status(:success)
        expect(json_response['data']['id']).to eq(user.id)
        expect(json_response['data']['email']).to eq(user.email)
        expect(json_response['data']['name']).to eq(user.name)
        expect(json_response['data']['avatar_url']).to eq(user.avatar_url)
        expect(json_response['data']['provider']).to eq(user.provider)
      end

      it 'does not expose sensitive information' do
        get '/api/v1/users/me', headers: auth_headers(user), as: :json
        
        expect(json_response['data']).not_to have_key('password')
        expect(json_response['data']).not_to have_key('encrypted_password')
        expect(json_response['data']).not_to have_key('jti')
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized response' do
        get '/api/v1/users/me', as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end

    context 'with invalid token' do
      it 'returns unauthorized response' do
        get '/api/v1/users/me', 
          headers: { 'Authorization' => 'Bearer invalid_token' }, 
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end

    context 'with expired token' do
      it 'returns unauthorized response' do
        # Create an expired token
        expired_token = JWT.encode(
          {
            sub: user.id,
            exp: 1.hour.ago.to_i,
            jti: user.jti
          },
          ENV.fetch('DEVISE_JWT_SECRET_KEY', 'test_secret'),
          'HS256'
        )
        
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{expired_token}" }, 
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end

    context 'when user no longer exists' do
      it 'returns unauthorized response' do
        token = user.generate_jwt
        user.destroy
        
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{token}" }, 
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end
  end
end