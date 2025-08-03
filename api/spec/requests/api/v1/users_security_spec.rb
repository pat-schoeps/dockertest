require 'rails_helper'

RSpec.describe 'Api::V1::Users Security', type: :request do
  let(:user) { create(:user) }
  
  describe 'JWT Security Features' do
    context 'token extraction vulnerabilities' do
      it 'rejects multiple tokens in Authorization header' do
        get '/api/v1/users/me', 
          headers: { 'Authorization' => 'Bearer token1 token2 token3' },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end

      it 'rejects tokens that are too short' do
        get '/api/v1/users/me', 
          headers: { 'Authorization' => 'Bearer short' },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end

      it 'rejects tokens that are too long' do
        long_token = 'x' * 3000
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{long_token}" },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end

    context 'algorithm confusion attacks' do
      it 'rejects tokens with "none" algorithm' do
        # Create a token with "none" algorithm (no signature)
        payload = { sub: user.id, jti: user.jti, exp: 1.hour.from_now.to_i }
        unsigned_token = JWT.encode(payload, nil, 'none')
        
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{unsigned_token}" },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end

    context 'payload structure validation' do
      it 'rejects tokens with missing sub claim' do
        payload = { jti: user.jti, exp: 1.hour.from_now.to_i } # Missing sub
        token = JWT.encode(payload, ENV['DEVISE_JWT_SECRET_KEY'], 'HS256')
        
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{token}" },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end

      it 'rejects tokens with wrong sub type' do
        payload = { sub: 'string_instead_of_int', jti: user.jti, exp: 1.hour.from_now.to_i }
        token = JWT.encode(payload, ENV['DEVISE_JWT_SECRET_KEY'], 'HS256')
        
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{token}" },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end

    context 'JTI validation' do
      it 'rejects tokens with mismatched JTI' do
        payload = { 
          sub: user.id, 
          jti: 'wrong_jti', 
          exp: 1.hour.from_now.to_i 
        }
        token = JWT.encode(payload, ENV['DEVISE_JWT_SECRET_KEY'], 'HS256')
        
        get '/api/v1/users/me', 
          headers: { 'Authorization' => "Bearer #{token}" },
          as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Authentication required')
      end
    end
  end
end