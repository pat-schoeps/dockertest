module DeviseHelpers
  def auth_headers(user)
    token = user.generate_jwt
    { 'Authorization' => "Bearer #{token}" }
  end

  def json_response
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include DeviseHelpers, type: :request
end