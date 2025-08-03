class Api::V1::BaseController < ApplicationController
  include JwtAuthenticable
end