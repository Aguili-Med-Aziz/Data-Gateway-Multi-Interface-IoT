const express = require('express');
const { SerialPort } = require('serialport');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Store sensor data
let sensorData = {
  wifi: { value: 'N/A', lastUpdate: null },
  lora: { value: 'N/A', lastUpdate: null },
  ble: { value: 'N/A', lastUpdate: null },
  ethernet: { value: 'N/A', lastUpdate: null }
};

// Generate test data every 2 seconds
setInterval(() => {
  const now = new Date();
  sensorData.wifi = {
    value: `Temperature: ${(20 + Math.random() * 10).toFixed(1)}C, Humidity: ${(40 + Math.random() * 20).toFixed(1)}%`,
    lastUpdate: now
  };
  sensorData.lora = {
    value: `Temperature: ${(20 + Math.random() * 10).toFixed(1)}C`,
    lastUpdate: now
  };
  sensorData.ble = {
    value: `Vibration: ${(0.1 + Math.random() * 2).toFixed(2)}g`,
    lastUpdate: now
  };
  sensorData.ethernet = {
    value: `CO2: ${(400 + Math.random() * 1600).toFixed(0)} ppm`,
    lastUpdate: now
  };
  io.emit('sensor-update', sensorData);
}, 2000);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current sensor data to new client
  socket.emit('sensor-update', sensorData);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API endpoints for sensor data
app.post('/update_wifi', (req, res) => {
  let data;
  if (typeof req.body === 'string') {
    data = { value: req.body };
  } else {
    data = req.body;
  }
  sensorData.wifi = {
    value: data.value,
    lastUpdate: new Date()
  };
  io.emit('sensor-update', sensorData);
  res.json({ status: 'OK' });
});

app.post('/update_lora', (req, res) => {
  let data;
  if (typeof req.body === 'string') {
    data = { value: req.body };
  } else {
    data = req.body;
  }
  sensorData.lora = {
    value: data.value,
    lastUpdate: new Date()
  };
  io.emit('sensor-update', sensorData);
  res.json({ status: 'OK' });
});

app.post('/update_ble', (req, res) => {
  let data;
  if (typeof req.body === 'string') {
    data = { value: req.body };
  } else {
    data = req.body;
  }
  sensorData.ble = {
    value: data.value,
    lastUpdate: new Date()
  };
  io.emit('sensor-update', sensorData);
  res.json({ status: 'OK' });
});

app.post('/update_ethernet', (req, res) => {
  let data;
  if (typeof req.body === 'string') {
    data = { value: req.body };
  } else {
    data = req.body;
  }
  sensorData.ethernet = {
    value: data.value,
    lastUpdate: new Date()
  };
  io.emit('sensor-update', sensorData);
  res.json({ status: 'OK' });
});

// Create public directory for static files
const fs = require('fs');
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Start server
const PORT = process.env.PORT || 9080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
});
