// logger.js - Logger Class Implementation

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logFilePath = path.join(__dirname, 'server.log');
  }

  writeLog(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Append the log message to the server.log file
    fs.appendFile(this.logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
  }
}

module.exports = Logger;

// server.js - Server with Logging System

const express = require('express');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const Logger = require('./logger');

const app = express();
const logger = new Logger();

// Middleware to log requests
app.use((req, res, next) => {
  logger.writeLog(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection Setup
const uri = process.env.MONGO_URI || 'mongodb+srv://peiwast124:Heipiwi18.@cluster0.xfxhgbf.mongodb.net/';
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
});

let auctionCollection;
let liveAuctionCollection;
let loginCollection;

async function connectDB() {
  try {
    await client.connect();
    logger.writeLog('Connected to MongoDB');
    const db = client.db('signup');
    auctionCollection = db.collection('auctions');
    loginCollection = db.collection('login');
    liveAuctionCollection = db.collection('liveauctions');
  } catch (err) {
    logger.writeLog('Error connecting to MongoDB: ' + err.message);
  }
}

connectDB();

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    logger.writeLog('Authentication failed: No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      logger.writeLog('Authentication failed: Invalid token');
      return res.sendStatus(403);
    }
    req.user = user;
    logger.writeLog(`User authenticated successfully: ${user.userId}`);
    next();
  });
}

// Endpoint for creating auctions
app.post('/api/auctions', authenticateToken, async (req, res) => {
  try {
    logger.writeLog('Received auction data for new auction: ' + JSON.stringify(req.body));

    const user = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      logger.writeLog('Error: User not found.');
      return res.status(404).json({ message: 'User not found' });
    }

    const { brand, model, year, images } = req.body;
    logger.writeLog(`Received ${images.length} images for auction.`);

    const newAuction = {
      ...req.body,
      userId: new ObjectId(req.user.userId),
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`
    };

    const result = await auctionCollection.insertOne(newAuction);
    logger.writeLog(`Auction created successfully. Auction ID: ${result.insertedId}`);
    res.json(result);
  } catch (err) {
    logger.writeLog('Error during auction creation: ' + err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.writeLog(`Server started on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
});
