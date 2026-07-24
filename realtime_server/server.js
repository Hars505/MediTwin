const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, restrict to your frontend domain
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory store for connected users and their sockets
// In production, use Redis or a database for multi-server setups
const connectedUsers = new Map(); // userId => socketId
const userSockets = new Map(); // socketId => userId

// Simulate vitals data generation
function generateVitals() {
  return {
    heart_rate: Math.floor(Math.random() * (100 - 60 + 1)) + 60, // 60-100 bpm
    systolic_bp: Math.floor(Math.random() * (140 - 90 + 1)) + 90, // 90-140 mmHg
    diastolic_bp: Math.floor(Math.random() * (90 - 60 + 1)) + 60, // 60-90 mmHg
    spo2: Math.floor(Math.random() * (100 - 95 + 1)) + 95, // 95-100%
    blood_glucose: Math.floor(Math.random() * (140 - 70 + 1)) + 70, // 70-140 mg/dL
    temperature: (Math.random() * (37.5 - 36.5 + 1) + 36.5).toFixed(1), // 36.5-37.5°C
    respiratory_rate: Math.floor(Math.random() * (20 - 12 + 1)) + 12 // 12-20 breaths/min
  };
}

// Simple anomaly detection (threshold-based for demonstration)
function detectAnomalies(vitals) {
  const anomalies = [];
  if (vitals.heart_rate > 100 || vitals.heart_rate < 60) {
    anomalies.push('heart_rate');
  }
  if (vitals.systolic_bp > 140 || vitals.systolic_bp < 90) {
    anomalies.push('systolic_bp');
  }
  if (vitals.diastolic_bp > 90 || vitals.diastolic_bp < 60) {
    anomalies.push('diastolic_bp');
  }
  if (vitals.spo2 < 95) {
    anomalies.push('spo2');
  }
  if (vitals.blood_glucose > 140 || vitals.blood_glucose < 70) {
    anomalies.push('blood_glucose');
  }
  if (parseFloat(vitals.temperature) > 37.5 || parseFloat(vitals.temperature) < 36.5) {
    anomalies.push('temperature');
  }
  if (vitals.respiratory_rate > 20 || vitals.respiratory_rate < 12) {
    anomalies.push('respiratory_rate');
  }
  return anomalies;
}

// Generate a notification message based on anomalies
function generateNotification(vitals, anomalies) {
  if (anomalies.length === 0) return null;

  const messages = {
    heart_rate: `Heart rate is ${vitals.heart_rate} bpm (abnormal)`,
    systolic_bp: `Systolic blood pressure is ${vitals.systolic_bp} mmHg (abnormal)`,
    diastolic_bp: `Diastolic blood pressure is ${vitals.diastolic_bp} mmHg (abnormal)`,
    spo2: `Oxygen saturation is ${vitals.spo2}% (low)`,
    blood_glucose: `Blood glucose is ${vitals.blood_glucose} mg/dL (abnormal)`,
    temperature: `Temperature is ${vitals.temperature}°C (abnormal)`,
    respiratory_rate: `Respiratory rate is ${vitals.respiratory_rate} breaths/min (abnormal)`
  };

  // Return the first anomaly for simplicity, or combine multiple
  return anomalies.map(key => messages[key]).join(' ');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle authentication
  // In a real app, you would verify a JWT token sent during connection
  // For now, we'll expect the client to send an 'authenticate' event with a userId
  socket.on('authenticate', (data) => {
    const { userId, token } = data;
    // In production, verify the token here
    if (userId) {
      // Store the mapping
      connectedUsers.set(userId, socket.id);
      userSockets.set(socket.id, userId);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);

      // Join a room named after the userId for targeted broadcasts
      socket.join(`user_${userId}`);

      // Send a confirmation back to the client
      socket.emit('authenticated', { success: true, userId });

      // Start sending simulated vitals to this user every 2 seconds
      const intervalId = setInterval(() => {
        const vitals = generateVitals();
        const anomalies = detectAnomalies(vitals);
        const notification = generateNotification(vitals, anomalies);

        // Emit vitals to the user's room
        io.to(`user_${userId}`).emit('vitals:update', vitals);

        // If there are anomalies, send an alert
        if (anomalies.length > 0) {
          io.to(`user_${userId}`).emit('vitals:anomaly', {
            vitals,
            anomalies,
            message: notification
          });
        }
      }, 2000); // Every 2 seconds

      // Store the interval ID so we can clear it when the user disconnects
      socket.data.intervalId = intervalId;
    } else {
      socket.emit('auth_error', { message: 'Invalid authentication data' });
      socket.disconnect();
    }
  });

  // Handle vitals data from client (if they are sending real data from a wearable)
  socket.on('vitals:submit', (vitalsData) => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      // Process the vitals data (e.g., save to database, trigger risk calculation)
      // For now, we'll just broadcast it to the user's room
      const anomalies = detectAnomalies(vitalsData);
      const notification = generateNotification(vitalsData, anomalies);

      io.to(`user_${userId}`).emit('vitals:update', vitalsData);

      if (anomalies.length > 0) {
        io.to(`user_${userId}`).emit('vitals:anomaly', {
          vitals: vitalsData,
          anomalies,
          message: notification
        });
      }
    }
  });

  // Handle manual trigger of anomaly for demonstration/testing
  socket.on('trigger:anomaly', (data) => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      // Get current vitals (we could store latest per user, but for simplicity generate new)
      const vitals = generateVitals();
      // Force one or more anomalies based on data
      const anomaliesToForce = data.anomalies || ['heart_rate', 'sysolic_bp']; // default
      // Modify vitals to ensure anomalies
      const forcedVitals = { ...vitals };
      if (anomaliesToForce.includes('heart_rate')) forcedVitals.heart_rate = 130; // high
      if (anomaliesToForce.includes('sysolic_bp')) forcedVitals.systolic_bp = 180; // high
      if (anomaliesToForce.includes('diastolic_bp')) forcedVitals.diastolic_bp = 100; // high
      if (anomaliesToForce.includes('spo2')) forcedVitals.spo2 = 90; // low
      if (anomaliesToForce.includes('blood_glucose')) forcedVitals.blood_glucose = 200; // high
      if (anomaliesToForce.includes('temperature')) forcedVitals.temperature = 38.5; // high
      if (anomaliesToForce.includes('respiratory_rate')) forcedVitals.respiratory_rate = 30; // high

      const anomalies = detectAnomalies(forcedVitals);
      const notification = generateNotification(forcedVitals, anomalies);

      io.to(`user_${userId}`).emit('vitals:update', forcedVitals);
      if (anomalies.length > 0) {
        io.to(`user_${userId}`).emit('vitals:anomaly', {
          vitals: forcedVitals,
          anomalies,
          message: notification
        });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    const userId = userSockets.get(socket.id);
    if (userId) {
      // Clear the interval if it exists
      if (socket.data.intervalId) {
        clearInterval(socket.data.intervalId);
      }
      // Remove from maps
      connectedUsers.delete(userId);
      userSockets.delete(socket.id);
      // Leave the room
      socket.leave(`user_${userId}`);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

module.exports = { app, server, io };