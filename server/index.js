const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'healthcare';

if (!MONGODB_URI) {
  console.error('Missing required environment variable: MONGODB_URI');
  console.error('Please set MONGODB_URI in server/.env (see server/.env.example)');
  process.exit(1);
}

let client;
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// MongoDB API endpoint
app.post('/api/mongodb', async (req, res) => {
  try {
    const { action, collection, filter, data, update } = req.body;

    if (!action || !collection) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: action and collection',
      });
    }

    const coll = db.collection(collection);
    let result;

    switch (action) {
      case 'find':
        result = await coll.find(filter || {}).toArray();
        // Convert _id to string for JSON serialization
        result = result.map(doc => ({
          ...doc,
          _id: doc._id.toString(),
        }));
        break;

      case 'findOne':
        // Convert string _id to ObjectId if present
        if (filter && filter._id && typeof filter._id === 'string') {
          filter._id = new ObjectId(filter._id);
        }
        result = await coll.findOne(filter || {});
        if (result) {
          result._id = result._id.toString();
        }
        break;

      case 'insertOne':
        const insertData = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const insertResult = await coll.insertOne(insertData);
        result = {
          _id: insertResult.insertedId.toString(),
          ...insertData,
        };
        break;

      case 'insertMany':
        const docsWithTimestamps = data.map((doc) => ({
          ...doc,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        const insertManyResult = await coll.insertMany(docsWithTimestamps);
        result = Object.values(insertManyResult.insertedIds).map((id, index) => ({
          _id: id.toString(),
          ...docsWithTimestamps[index],
        }));
        break;

      case 'updateOne':
        // Convert string _id to ObjectId if present
        if (filter && filter._id && typeof filter._id === 'string') {
          filter._id = new ObjectId(filter._id);
        }
        const updateData = {
          $set: { ...update, updatedAt: new Date() },
        };
        await coll.updateOne(filter, updateData);
        result = { modifiedCount: 1 };
        break;

      case 'updateMany':
        const updateManyData = {
          $set: { ...update, updatedAt: new Date() },
        };
        const updateResult = await coll.updateMany(filter, updateManyData);
        result = { modifiedCount: updateResult.modifiedCount };
        break;

      case 'deleteOne':
        // Convert string _id to ObjectId if present
        if (filter && filter._id && typeof filter._id === 'string') {
          filter._id = new ObjectId(filter._id);
        }
        await coll.deleteOne(filter);
        result = { deletedCount: 1 };
        break;

      case 'deleteMany':
        await coll.deleteMany(filter);
        result = { deletedCount: 1 };
        break;

      case 'count':
        result = await coll.countDocuments(filter || {});
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
        });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('MongoDB API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MongoDB API server is running' });
});

// Start server
async function startServer() {
  await connectToMongoDB();
  app.listen(PORT, () => {
    console.log(`🚀 MongoDB API server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/mongodb`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});



