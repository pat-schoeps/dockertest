require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_presence_of(:password) }
    it { should validate_length_of(:password).is_at_least(6) }
  end

  describe 'associations' do
    # Add associations here as your app grows
  end

  describe 'devise modules' do
    it { should have_db_column(:email) }
    it { should have_db_column(:encrypted_password) }
    it { should have_db_column(:reset_password_token) }
    it { should have_db_column(:reset_password_sent_at) }
    it { should have_db_column(:remember_created_at) }
  end

  describe 'JWT fields' do
    it { should have_db_column(:jti) }
    it { should have_db_index(:jti).unique }
  end

  describe 'OAuth fields' do
    it { should have_db_column(:provider) }
    it { should have_db_column(:uid) }
    it { should have_db_column(:name) }
    it { should have_db_column(:avatar_url) }
    it { should have_db_index([:provider, :uid]).unique }
  end

  describe '.from_omniauth' do
    let(:auth) do
      double('auth',
        provider: 'google_oauth2',
        uid: '123456',
        info: double('info',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg'
        )
      )
    end

    context 'when user does not exist' do
      it 'creates a new user' do
        expect {
          User.from_omniauth(auth)
        }.to change(User, :count).by(1)
      end

      it 'sets user attributes correctly' do
        user = User.from_omniauth(auth)
        
        expect(user.provider).to eq('google_oauth2')
        expect(user.uid).to eq('123456')
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('Test User')
        expect(user.avatar_url).to eq('https://example.com/avatar.jpg')
      end
    end

    context 'when user already exists' do
      let!(:existing_user) do
        create(:user, :with_google_oauth,
          provider: 'google_oauth2',
          uid: '123456',
          email: 'test@example.com'
        )
      end

      it 'does not create a new user' do
        expect {
          User.from_omniauth(auth)
        }.not_to change(User, :count)
      end

      it 'returns the existing user' do
        user = User.from_omniauth(auth)
        expect(user.id).to eq(existing_user.id)
      end
    end
  end

  describe '#generate_jwt' do
    let(:user) { create(:user) }

    it 'generates a valid JWT token' do
      token = user.generate_jwt
      
      expect(token).to be_present
      expect(token).to be_a(String)
    end

    it 'includes the user id in the token' do
      token = user.generate_jwt
      decoded = JWT.decode(
        token,
        ENV.fetch('DEVISE_JWT_SECRET_KEY', 'test_secret'),
        true,
        algorithm: 'HS256'
      )
      
      expect(decoded.first['sub']).to eq(user.id)
    end
  end

  describe '#jwt_payload' do
    let(:user) { create(:user, email: 'test@example.com', name: 'Test User') }

    it 'includes email and name in the payload' do
      payload = user.jwt_payload
      
      expect(payload['email']).to eq('test@example.com')
      expect(payload['name']).to eq('Test User')
    end
  end
end