class Api::V1::UsersController < Api::V1::BaseController
  def me
    render json: {
      data: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
    }
  end
end