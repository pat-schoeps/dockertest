FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    password { 'password123' }
    password_confirmation { 'password123' }
    name { Faker::Name.name }
    jti { SecureRandom.uuid }

    trait :with_google_oauth do
      provider { 'google_oauth2' }
      uid { Faker::Number.unique.number(digits: 21).to_s }
      avatar_url { Faker::Avatar.image }
    end
  end
end