require 'rails_helper'

RSpec.describe 'Auth::Registrations', type: :request do
  describe 'POST /auth/sign_up' do
    let(:valid_params) do
      {
        user: {
          email: 'newuser@example.com',
          password: 'password123',
          password_confirmation: 'password123',
          name: 'New User'
        }
      }
    end

    let(:invalid_params) do
      {
        user: {
          email: 'invalid-email',
          password: 'short',
          password_confirmation: 'different',
          name: ''
        }
      }
    end

    context 'with valid parameters' do
      it 'creates a new user' do
        expect {
          post '/auth/sign_up', params: valid_params, as: :json
        }.to change(User, :count).by(1)
      end

      it 'returns a success response with user data' do
        post '/auth/sign_up', params: valid_params, as: :json
        
        expect(response).to have_http_status(:success)
        expect(json_response['status']['code']).to eq(200)
        expect(json_response['status']['message']).to eq('Signed up successfully.')
        expect(json_response['data']['email']).to eq('newuser@example.com')
        expect(json_response['data']['name']).to eq('New User')
      end

      it 'returns JWT token in Authorization header' do
        post '/auth/sign_up', params: valid_params, as: :json
        
        expect(response.headers['Authorization']).to be_present
        expect(response.headers['Authorization']).to match(/^Bearer /)
      end
    end

    context 'with invalid parameters' do
      it 'does not create a new user' do
        expect {
          post '/auth/sign_up', params: invalid_params, as: :json
        }.not_to change(User, :count)
      end

      it 'returns an unprocessable entity response with errors' do
        post '/auth/sign_up', params: invalid_params, as: :json
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['status']['message']).to include("User couldn't be created successfully")
      end
    end

    context 'when email already exists' do
      let!(:existing_user) { create(:user, email: 'existing@example.com') }
      let(:duplicate_params) do
        {
          user: {
            email: 'existing@example.com',
            password: 'password123',
            password_confirmation: 'password123',
            name: 'Duplicate User'
          }
        }
      end

      it 'does not create a new user' do
        expect {
          post '/auth/sign_up', params: duplicate_params, as: :json
        }.not_to change(User, :count)
      end

      it 'returns an unprocessable entity response' do
        post '/auth/sign_up', params: duplicate_params, as: :json
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['status']['message']).to include('Email has already been taken')
      end
    end
  end
end