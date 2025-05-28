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

// Store original sensor data for restoration
let originalSensorData = null;

// Function to set all sensors to 0 for 2 seconds
function setSensorsToZero() {
  // Store current values
  originalSensorData = JSON.parse(JSON.stringify(sensorData));
  
  // Set all sensors to 0
  sensorData.wifi = { value: 'Temperature: 0C, Humidity: 0%', lastUpdate: new Date() };
  sensorData.lora = { value: 'Temperature: 0C', lastUpdate: new Date() };
  sensorData.ble = { value: 'Vibration: 0g', lastUpdate: new Date() };
  sensorData.ethernet = { value: 'CO2: 0 ppm', lastUpdate: new Date() };
  
  emitSensorUpdate();
  
  // Restore original values after 2 seconds
  setTimeout(() => {
    if (originalSensorData) {
      sensorData = originalSensorData;
      emitSensorUpdate();
    }
  }, 2000);
}

// Debug function to log sensor data
function logSensorData() {
  console.log('Current Sensor Data:');
  console.log(JSON.stringify(sensorData, null, 2));
}

// Function to emit sensor updates
function emitSensorUpdate() {
  console.log('Emitting sensor update...');
  io.emit('sensor-update', sensorData);
  logSensorData();
}

// Generate test data every 2 seconds
setInterval(() => {
  const now = new Date();
  
  // Update all sensors with test data
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
  
  emitSensorUpdate();
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
  console.log('Received WiFi update:', req.body);
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
  emitSensorUpdate();
  res.json({ status: 'OK' });
});

app.post('/update_lora', (req, res) => {
  console.log('Received LoRa update:', req.body);
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
  emitSensorUpdate();
  res.json({ status: 'OK' });
});

app.post('/update_ble', (req, res) => {
  console.log('Received BLE update:', req.body);
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
  emitSensorUpdate();
  res.json({ status: 'OK' });
});

app.post('/update_ethernet', (req, res) => {
  console.log('Received Ethernet update:', req.body);
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
  emitSensorUpdate();
  res.json({ status: 'OK' });
});

// Add new endpoint to set sensors to zero
app.post('/set_sensors_to_zero', (req, res) => {
  console.log('Setting all sensors to zero for 2 seconds');
  setSensorsToZero();
  res.json({ status: 'OK', message: 'Sensors set to zero for 2 seconds' });
});

// Add new endpoint to set a specific sensor to a custom value for 2 seconds
app.post('/set_sensor_temp', (req, res) => {
  const { sensor, value } = req.body;
  if (!sensorData.hasOwnProperty(sensor)) {
    return res.status(400).json({ status: 'ERROR', message: 'Invalid sensor name' });
  }
  // Store original value
  const original = { ...sensorData[sensor] };
  // Set to custom value
  sensorData[sensor] = { value, lastUpdate: new Date() };
  emitSensorUpdate();
  // Restore after 2 seconds
  setTimeout(() => {
    sensorData[sensor] = original;
    emitSensorUpdate();
  }, 2000);
  res.json({ status: 'OK', message: `Sensor ${sensor} set to custom value for 2 seconds` });
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
