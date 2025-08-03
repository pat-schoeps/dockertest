# React Client App

Modern React application built with Vite, TypeScript, Redux Toolkit, and Mantine UI.

## 🚀 Tech Stack

- **React 19** with **TypeScript**
- **Vite** for fast development and building
- **Redux Toolkit** with RTK Query for state management
- **Mantine UI** for component library and styling
- **ESLint** for code linting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── store/              # Redux store configuration
├── services/           # API services (RTK Query)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── App.tsx             # Main App component
└── main.tsx            # Application entry point
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```bash
   VITE_API_URL=http://localhost:3000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   
   The React app will run on `http://localhost:3001` (Rails API runs on port 3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run preview` - Preview production build

## 🔗 API Integration

The app is configured to work with the Rails API backend:

- **Base URL**: `http://localhost:3000` (configurable via `VITE_API_URL`)
- **Authentication**: JWT tokens stored in localStorage
- **API Client**: RTK Query with automatic token handling

### Available API Endpoints

- `POST /auth/sign_up` - User registration
- `POST /auth/sign_in` - User login
- `DELETE /auth/sign_out` - User logout
- `POST /auth/google` - Google OAuth authentication
- `GET /api/v1/users/me` - Get current user (protected)

## 🎨 UI Components

Using Mantine UI library for consistent design:

- **Theme**: Default Mantine theme
- **Components**: Button, TextInput, Container, etc.
- **Notifications**: Built-in notification system
- **Forms**: Mantine form validation

## 🔐 Authentication Flow

1. **Login/Register**: Users can sign up or sign in with email/password
2. **JWT Storage**: Tokens stored in localStorage
3. **Auto-logout**: Invalid tokens automatically redirect to login
4. **Protected Routes**: useAuth hook for authentication checks
5. **Google OAuth**: Ready for Google OAuth integration

## 📱 Features

- ✅ User authentication (email/password)
- ✅ JWT token management
- ✅ Protected routes
- ✅ Responsive design
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- 🚧 Google OAuth (placeholder ready)
- 🚧 User profile management

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Rails API base URL | `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `VITE_NODE_ENV` | Environment | `development` |

### ESLint Configuration

Comprehensive ESLint setup with:
- TypeScript support
- React hooks rules
- React refresh plugin
- Customizable rules in `.eslintrc.json`

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. The `dist` folder contains the production build

3. Deploy to your preferred hosting service (Vercel, Netlify, etc.)

## 🤝 Integration with Rails API

This client is designed to work seamlessly with the Rails API:

1. **CORS**: Rails API configured to accept requests from this frontend
2. **Authentication**: JWT tokens work with Rails Devise setup
3. **Error Handling**: API errors properly handled and displayed
4. **Type Safety**: TypeScript interfaces match Rails API responses
