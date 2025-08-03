require 'rails_helper'
require 'webmock/rspec'

RSpec.describe 'Auth::Omniauth', type: :request do
  describe 'POST /auth/google' do
    let(:google_auth_code) { 'valid_google_auth_code' }
    let(:google_access_token) { 'valid_access_token' }
    
    let(:google_user_info) do
      {
        id: '123456789',
        email: 'googleuser@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg'
      }
    end

    before do
      # Mock Google OAuth token exchange
      stub_request(:post, "https://oauth2.googleapis.com/token")
        .to_return(
          status: 200,
          body: {
            access_token: google_access_token,
            token_type: 'Bearer',
            expires_in: 3600
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )

      # Mock Google user info request
      stub_request(:get, "https://www.googleapis.com/oauth2/v2/userinfo")
        .with(headers: { 'Authorization' => "Bearer #{google_access_token}" })
        .to_return(
          status: 200,
          body: google_user_info.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )
    end

    context 'with valid authorization code' do
      context 'for a new user' do
        it 'creates a new user' do
          expect {
            post '/auth/google', params: { code: google_auth_code }, as: :json
          }.to change(User, :count).by(1)
        end

        it 'returns success response with user data and token' do
          post '/auth/google', params: { code: google_auth_code }, as: :json
          
          expect(response).to have_http_status(:success)
          expect(json_response['status']['code']).to eq(200)
          expect(json_response['status']['message']).to eq('Logged in successfully.')
          expect(json_response['data']['user']['email']).to eq('googleuser@example.com')
          expect(json_response['data']['user']['name']).to eq('Google User')
          expect(json_response['data']['user']['provider']).to eq('google_oauth2')
          expect(json_response['data']['token']).to be_present
        end
      end

      context 'for an existing user' do
        let!(:existing_user) do
          create(:user, :with_google_oauth,
            email: 'googleuser@example.com',
            uid: '123456789'
          )
        end

        it 'does not create a new user' do
          expect {
            post '/auth/google', params: { code: google_auth_code }, as: :json
          }.not_to change(User, :count)
        end

        it 'returns success response with existing user data' do
          post '/auth/google', params: { code: google_auth_code }, as: :json
          
          expect(response).to have_http_status(:success)
          expect(json_response['data']['user']['id']).to eq(existing_user.id)
        end
      end
    end

    context 'with invalid authorization code' do
      before do
        stub_request(:post, "https://oauth2.googleapis.com/token")
          .to_return(status: 401, body: { error: 'invalid_grant' }.to_json)
      end

      it 'returns unauthorized response' do
        post '/auth/google', params: { code: 'invalid_code' }, as: :json
        
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to be_present
      end
    end

    context 'without authorization code' do
      it 'returns bad request response' do
        post '/auth/google', params: {}, as: :json
        
        expect(response).to have_http_status(:bad_request)
        expect(json_response['error']).to eq('Authorization code is required')
      end
    end

    context 'when Google API is down' do
      before do
        stub_request(:post, "https://oauth2.googleapis.com/token")
          .to_raise(StandardError.new('Connection failed'))
      end

      it 'returns internal server error' do
        post '/auth/google', params: { code: google_auth_code }, as: :json
        
        expect(response).to have_http_status(:internal_server_error)
        expect(json_response['error']).to eq('An error occurred during authentication')
      end
    end
  end
end