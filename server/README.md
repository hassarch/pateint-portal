# MongoDB API Server

Express.js backend server for MongoDB Atlas operations.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   Create or edit the project root `.env` file and set your values:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>
   PORT=3002
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST `/api/mongodb`
Main MongoDB operation endpoint.

**Request Body:**
```json
{
  "action": "find|findOne|insertOne|insertMany|updateOne|updateMany|deleteOne|deleteMany|count",
  "collection": "collection_name",
  "filter": {}, // optional, for find/findOne/update/delete operations
  "data": {}, // for insert operations
  "update": {} // for update operations
}
```

**Response:**
```json
{
  "success": true,
  "data": {} // operation result
}
```

### GET `/health`
Health check endpoint.

## MongoDB Collections

The application uses these collections:
- `users` - User accounts
- `profiles` - User profiles
- `doctors` - Doctor information
- `appointments` - Appointments
- `user_roles` - User roles

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- Keep your MongoDB connection string secure
- In production, use environment variables
- Consider adding authentication/authorization middleware

## Deployment

For production deployment:
1. Set environment variables on your hosting platform
2. Update `VITE_MONGODB_API_URL` in frontend `.env` to point to your deployed API
3. Ensure MongoDB Atlas network access allows your server IP



