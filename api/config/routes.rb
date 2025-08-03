Rails.application.routes.draw do
  devise_for :users, skip: [:sessions, :registrations]
  
  namespace :auth do
    devise_scope :user do
      post 'sign_in', to: 'sessions#create'
      delete 'sign_out', to: 'sessions#destroy'
      post 'sign_up', to: 'registrations#create'
    end
    
    post 'google', to: 'omniauth#google_oauth2_callback'
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Protected routes example
  namespace :api do
    namespace :v1 do
      get 'users/me', to: 'users#me'
    end
  end
end
