const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const path = require('path');

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store active sensors and their data
const activeSensors = new Map();
const sensorIntervals = new Map();
const sensorPlayStates = new Map();

// Debug logging
console.log('Server starting...');

// Generate realistic sensor data
function generateSensorData(sensorId) {
  const sensor = activeSensors.get(sensorId);
  if (!sensor) {
    console.error('Sensor not found:', sensorId);
    return null;
  }

  let value;
  switch (sensorId.split('-')[0]) {
    case 'wifi':
      // Humidity between 30% and 70%
      value = (30 + Math.random() * 40).toFixed(1);
      break;
    case 'lora':
      // Temperature between 15°C and 35°C
      value = (15 + Math.random() * 20).toFixed(1);
      break;
    case 'ble':
      // Vibration between 0.1g and 2.0g
      value = (0.1 + Math.random() * 1.9).toFixed(2);
      break;
    case 'ethernet':
      // CO2 between 400ppm and 2000ppm
      value = (400 + Math.random() * 1600).toFixed(0);
      break;
    default:
      value = '0';
  }

  return {
    value: `${value} ${sensor.unit}`,
    lastUpdate: new Date().toISOString()
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial connection success
  socket.emit('connection-status', { status: 'connected' });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clear intervals for this client
    sensorIntervals.forEach((interval, sensorId) => {
      clearInterval(interval);
    });
    sensorIntervals.clear();
    sensorPlayStates.clear();
  });

  // Handle scan requests
  socket.on('scan-sensors', (data) => {
    console.log('Scanning for', data.type, 'sensors...');
    
    // Clear previous sensors of this type
    for (const [sensorId, sensor] of activeSensors.entries()) {
      if (sensorId.startsWith(data.type)) {
        activeSensors.delete(sensorId);
        if (sensorIntervals.has(sensorId)) {
          clearInterval(sensorIntervals.get(sensorId));
          sensorIntervals.delete(sensorId);
        }
        sensorPlayStates.delete(sensorId);
      }
    }
    
    const sensors = generateMockSensors(data.type);
    console.log('Found', sensors.length, data.type, 'sensors:', sensors);
    socket.emit('scan-results', sensors);
  });

  // Handle get available sensors
  socket.on('get-available-sensors', (type) => {
    console.log('Getting available sensors for type:', type);
    const sensors = Array.from(activeSensors.values())
      .filter(sensor => sensor.id.startsWith(type));
    console.log('Found', sensors.length, 'available sensors:', sensors);
    socket.emit('available-sensors', sensors);
  });

  // Handle play/pause state
  socket.on('sensor-play-pause', (data) => {
    const { sensorId, isPlaying } = data;
    console.log(`Sensor ${sensorId} play state:`, isPlaying);
    
    if (isPlaying) {
      // Start sending data if not already sending
      if (!sensorIntervals.has(sensorId)) {
        // Generate initial data
        const initialData = generateSensorData(sensorId);
        if (initialData) {
          socket.emit('sensor-update', { [sensorId]: initialData });
          
          // Set up interval for continuous updates
          const interval = setInterval(() => {
            const newData = generateSensorData(sensorId);
            if (newData) {
              socket.emit('sensor-update', { [sensorId]: newData });
            }
          }, 1000); // Send updates every second
          
          sensorIntervals.set(sensorId, interval);
          console.log(`Started sending data for sensor: ${sensorId}`);
        }
      }
    } else {
      // Stop sending data
      if (sensorIntervals.has(sensorId)) {
        clearInterval(sensorIntervals.get(sensorId));
        sensorIntervals.delete(sensorId);
        console.log(`Stopped sending data for sensor: ${sensorId}`);
      }
    }
    
    sensorPlayStates.set(sensorId, isPlaying);
  });

  // Handle sensor subscription
  socket.on('subscribe-sensor', (sensorId) => {
    console.log('Subscribing to sensor:', sensorId);
    // Don't start sending data immediately, wait for play button
    sensorPlayStates.set(sensorId, false);
  });

  // Handle sensor unsubscription
  socket.on('unsubscribe-sensor', (sensorId) => {
    console.log('Unsubscribing from sensor:', sensorId);
    if (sensorIntervals.has(sensorId)) {
      clearInterval(sensorIntervals.get(sensorId));
      sensorIntervals.delete(sensorId);
    }
    sensorPlayStates.delete(sensorId);
  });

  // Handle get sensor data request
  socket.on('get-sensor-data', (sensorId) => {
    console.log('Getting data for sensor:', sensorId);
    const data = generateSensorData(sensorId);
    if (data) {
      socket.emit('sensor-update', { [sensorId]: data });
    }
  });
});

// Generate mock sensors based on type
function generateMockSensors(type) {
  const sensors = [];
  // Always generate exactly one sensor for each type
  const sensorId = `${type}-1`;
  let sensor = {
    id: sensorId,
    name: '',
    unit: '',
    description: ''
  };

  switch (type) {
    case 'wifi':
      sensor.name = 'WiFi Humidity Sensor';
      sensor.unit = '%';
      sensor.description = 'Measures relative humidity in the environment';
      break;
    case 'lora':
      sensor.name = 'LoRaWAN Temperature Sensor';
      sensor.unit = '°C';
      sensor.description = 'Measures ambient temperature using LoRaWAN protocol';
      break;
    case 'ble':
      sensor.name = 'BLE Vibration Sensor';
      sensor.unit = 'g';
      sensor.description = 'Measures vibration in g-force units';
      break;
    case 'ethernet':
      sensor.name = 'Ethernet CO2 Sensor';
      sensor.unit = 'ppm';
      sensor.description = 'Measures CO2 levels in parts per million';
      break;
  }

  sensors.push(sensor);
  activeSensors.set(sensorId, sensor);
  return sensors;
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
