// Import dependencies
const fs = require('fs');
const path = require('path');

// Define the log file path
const logFilePath = path.join(__dirname, 'server.log');

// Function to write logs to the log file
const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Append the log message to the server.log file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
};

// Example usage in your server code
const express = require('express');
const app = express();

// Middleware to log requests
app.use((req, res, next) => {
  writeLog(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Endpoint for creating auctions
app.post('/api/auctions', async (req, res) => {
  try {
    writeLog('Received auction data: ' + JSON.stringify(req.body));
    // Your existing logic for handling auction creation
    // ...
    res.status(201).json({ message: 'Auction created successfully' });
  } catch (error) {
    writeLog('Error handling auction creation: ' + error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  writeLog(`Server started on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
});

module.exports = writeLog;
