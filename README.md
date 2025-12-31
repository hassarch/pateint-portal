# MediCare Patient Portal

A modern healthcare patient portal built with React, TypeScript, and MongoDB Atlas.

## Technologies

This project is built with:

- **Frontend:** Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** MongoDB Atlas

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- MongoDB Atlas account and cluster

### Installation

```sh
# Step 1: Navigate to the project directory
cd health-connect-portal

# Step 2: Install frontend dependencies
npm i

# Step 3: Install backend dependencies
cd server
npm i
cd ..

# Step 4: Configure environment variables
# The server/.env file is already configured with your MongoDB connection string
# For frontend, update .env if needed (defaults to localhost:3001)

# Step 5: Start the backend server (in one terminal)
cd server
npm start

# Step 6: Start the frontend dev server (in another terminal)
npm run dev
```

### MongoDB Setup

Your MongoDB connection string is already configured:
```
mongodb+srv://<username>:<password>@cluster0.lrjasue.mongodb.net/healthcare
```

**MongoDB Atlas Configuration:**
1. **Network Access:** Add `0.0.0.0/0` to allow connections (or specific IPs)
2. **Database Access:** Ensure user has read/write permissions
3. The application will automatically create collections when needed:
   - `users` - User accounts and authentication
   - `profiles` - User profiles (patients)
   - `doctors` - Doctor information
   - `appointments` - Appointment records
   - `user_roles` - User role assignments

**Important:** Never commit your MongoDB connection string to version control. Always use environment variables.

## Development

1. **Start the backend server:**
   ```sh
   cd server
   npm start
   ```
   Server runs on `http://localhost:3001`

2. **Start the frontend dev server:**
   ```sh
   npm run dev
   ```
   Frontend runs on `http://localhost:8080` with hot-reloading enabled.

## Building for Production

```sh
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `pages/` - Page components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions
  - `integrations/` - Third-party integrations (MongoDB)
