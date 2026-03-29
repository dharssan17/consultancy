# Weaving Mill Management System

A full-stack web application for managing a weaving mill operation.

## Tech Stack

- **Frontend**: React.js with Bootstrap
- **Backend**: Node.js with Express.js
- **Database**: MongoDB (Mongoose)

## Project Structure

```
.
├── backend/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Route controllers (MVC)
│   ├── middleware/       # Custom middleware (auth, etc.)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable React components
│       ├── pages/       # Page components
│       ├── services/    # API services
│       ├── App.js       # Main App component
│       └── index.js     # React entry point
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/weaving_mill_db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory (optional):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The app will run on `http://localhost:3000`

## Features

### Authentication

- User registration and login
- JWT-based authentication
- Role-based access control (admin, data_entry)
- Protected routes

### Architecture

- MVC architecture on the backend
- RESTful API design
- Component-based React frontend
- Responsive Bootstrap UI

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Health Check

- `GET /api/health` - Server health check

## User Roles

- **admin**: Full system access
- **data_entry**: Data entry access

## Development

The project follows MVC architecture:

- **Models**: Database schemas (Mongoose)
- **Controllers**: Request handlers
- **Routes**: API endpoint definitions
- **Middleware**: Authentication and authorization
- **Services**: Business logic layer

## Next Steps

Business modules can be added following the existing structure:
- Create models in `backend/models/`
- Create controllers in `backend/controllers/`
- Create routes in `backend/routes/`
- Create services in `backend/services/` (if needed)
- Create React components in `frontend/src/components/`
- Create pages in `frontend/src/pages/`

## License

ISC

