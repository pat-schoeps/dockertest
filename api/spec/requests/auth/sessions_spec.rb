require 'rails_helper'

RSpec.describe 'Auth::Sessions', type: :request do
  let(:user) { create(:user) }
  let(:valid_credentials) { { user: { email: user.email, password: user.password } } }
  let(:invalid_credentials) { { user: { email: user.email, password: 'wrong_password' } } }

  describe 'POST /auth/sign_in' do
    context 'with valid credentials' do
      it 'returns a success response with user data' do
        post '/auth/sign_in', params: valid_credentials, as: :json
        
        expect(response).to have_http_status(:success)
        expect(json_response['status']['code']).to eq(200)
        expect(json_response['status']['message']).to eq('Logged in successfully.')
        expect(json_response['data']['email']).to eq(user.email)
        expect(json_response['data']['name']).to eq(user.name)
      end

      it 'returns JWT token in Authorization header' do
        post '/auth/sign_in', params: valid_credentials, as: :json
        
        expect(response.headers['Authorization']).to be_present
        expect(response.headers['Authorization']).to match(/^Bearer /)
      end
    end

    context 'with invalid credentials' do
      it 'returns an unauthorized response' do
        post '/auth/sign_in', params: invalid_credentials, as: :json
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /auth/sign_out' do
    context 'when user is signed in' do
      it 'returns a success response' do
        # First sign in to get token
        post '/auth/sign_in', params: valid_credentials, as: :json
        token = response.headers['Authorization']
        
        # Then sign out
        delete '/auth/sign_out', headers: { 'Authorization' => token }, as: :json
        
        expect(response).to have_http_status(:ok)
        expect(json_response['status']).to eq(200)
        expect(json_response['message']).to eq('Logged out successfully.')
      end
    end

    context 'when user is not signed in' do
      it 'returns an unauthorized response' do
        delete '/auth/sign_out', as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['status']).to eq(401)
        expect(json_response['message']).to eq("Couldn't find an active session.")
      end
    end
  end
end