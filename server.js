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
const sensorBandwidths = new Map();
const sensorHistory = new Map(); // Store historical data for each sensor
const MAX_HISTORY_POINTS = 1000; // Maximum number of historical data points to store

// Debug logging
console.log('Server starting...');

// Enhanced bandwidth calculation with more realistic parameters
function calculateBandwidth(distance, sensorType, signalStrength = 100) {
    // Base parameters
    const maxBandwidth = 100; // Maximum bandwidth in Mbps
    const minBandwidth = 5;   // Minimum bandwidth in Mbps
    const referenceDistance = 100; // Reference distance in meters
    
    // Sensor type characteristics
    const typeConfig = {
        wifi: {
            multiplier: 1.0,
            noiseLevel: 2.5,
            packetLossFactor: 0.1,
            signalAttenuation: 2.0
        },
        lora: {
            multiplier: 0.3,
            noiseLevel: 1.5,
            packetLossFactor: 0.15,
            signalAttenuation: 2.5
        },
        ble: {
            multiplier: 0.5,
            noiseLevel: 2.0,
            packetLossFactor: 0.12,
            signalAttenuation: 2.2
        },
        ethernet: {
            multiplier: 1.2,
            noiseLevel: 1.0,
            packetLossFactor: 0.05,
            signalAttenuation: 1.5
        }
    };

    const config = typeConfig[sensorType] || typeConfig.wifi;
    
    // Calculate signal attenuation based on distance
    const attenuation = Math.pow(distance / referenceDistance, config.signalAttenuation);
    
    // Calculate base bandwidth with signal strength consideration
    let bandwidth = maxBandwidth * (1 - attenuation) * (signalStrength / 100);
    
    // Apply sensor type multiplier
    bandwidth *= config.multiplier;
    
    // Add random noise based on sensor type
    const noise = (Math.random() - 0.5) * config.noiseLevel;
    bandwidth += noise;
    
    // Calculate packet loss based on distance and sensor type
    const packetLoss = (distance / referenceDistance) * config.packetLossFactor;
    bandwidth *= (1 - packetLoss);
    
    // Add environmental factors (simulated)
    const environmentalFactor = 0.95 + (Math.random() * 0.1); // 95-105% variation
    bandwidth *= environmentalFactor;
    
    // Ensure bandwidth stays within realistic bounds
    return Math.max(minBandwidth, Math.min(maxBandwidth, bandwidth));
}

// Generate realistic sensor data with enhanced parameters
function generateSensorData(sensorId) {
    const sensor = activeSensors.get(sensorId);
    if (!sensor) {
        console.error('Sensor not found:', sensorId, 'Available sensors:', Array.from(activeSensors.keys()));
        return null;
    }

    const sensorType = sensorId.split('-')[0];
    let value, unit, min, max, precision;
    
    switch (sensorType) {
            case 'wifi':
            min = 30;
            max = 70;
            unit = '%';
            precision = 1;
                break;
            case 'lora':
            min = 15;
            max = 35;
            unit = '°C';
            precision = 1;
                break;
            case 'ble':
            min = 0.1;
            max = 2.0;
            unit = 'g';
            precision = 2;
                break;
            case 'ethernet':
            min = 400;
            max = 2000;
            unit = 'ppm';
            precision = 0;
                break;
        default:
            console.error('Unknown sensor type:', sensorType);
            return null;
    }

    // Generate value with realistic variations
    const baseValue = min + (Math.random() * (max - min));
    const variation = (Math.random() - 0.5) * ((max - min) * 0.1); // 10% variation
    value = (baseValue + variation).toFixed(precision);

    const data = {
        value: `${value} ${unit}`,
        lastUpdate: new Date().toISOString(),
        signalStrength: Math.floor(70 + (Math.random() * 30)), // 70-100% signal strength
        batteryLevel: Math.floor(20 + (Math.random() * 80)), // 20-100% battery
        status: 'active'
    };

    // Store in history
    if (!sensorHistory.has(sensorId)) {
        sensorHistory.set(sensorId, []);
    }
    const history = sensorHistory.get(sensorId);
    history.push(data);
    if (history.length > MAX_HISTORY_POINTS) {
        history.shift();
    }

    return data;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial connection success
    socket.emit('connection-status', { status: 'connected' });

    // Handle distance changes with enhanced bandwidth calculation
    socket.on('distanceChange', (data) => {
        console.log('Distance changed:', data.distance);
        
        // Update bandwidth for all active sensors
        activeSensors.forEach((sensor, sensorId) => {
            const sensorType = sensorId.split('-')[0];
            const sensorData = sensorHistory.get(sensorId);
            const signalStrength = sensorData ? sensorData[sensorData.length - 1].signalStrength : 100;
            
            const bandwidth = calculateBandwidth(data.distance, sensorType, signalStrength);
            sensorBandwidths.set(sensorId, bandwidth);
            
            // Emit bandwidth update for this specific sensor
            io.emit('sensorBandwidthUpdate', {
                sensorId: sensorId,
                bandwidth: bandwidth,
                signalStrength: signalStrength,
                batteryLevel: sensorData ? sensorData[sensorData.length - 1].batteryLevel : 100,
                timestamp: new Date().toISOString(),
                sensorType: sensorType,
                distance: data.distance
            });
        });
        
        // Broadcast distance update
        io.emit('distanceUpdate', data);
    });

    // Handle sensor subscription
    socket.on('subscribe-sensor', (sensorId) => {
        console.log('Subscribing to sensor:', sensorId);
        const sensorType = sensorId.split('-')[0];
        
        // Get current distance from the client
        const currentDistance = 50; // Default distance
        const initialBandwidth = calculateBandwidth(currentDistance, sensorType);
        sensorBandwidths.set(sensorId, initialBandwidth);
        
        // Generate initial data
        const initialData = generateSensorData(sensorId);
        if (initialData) {
            socket.emit('sensor-update', { [sensorId]: initialData });
        }
        
        // Emit initial bandwidth for this sensor with all necessary data
        socket.emit('sensorBandwidthUpdate', {
            sensorId: sensorId,
            bandwidth: initialBandwidth,
            signalStrength: initialData?.signalStrength || 100,
            batteryLevel: initialData?.batteryLevel || 100,
            timestamp: new Date().toISOString(),
            sensorType: sensorType,
            distance: currentDistance
        });
        
        // Set play state to true but don't start interval automatically
        sensorPlayStates.set(sensorId, true);
    });

    // Handle get available sensors
    socket.on('get-available-sensors', (type) => {
        console.log('Getting available sensors for type:', type);
        const sensors = Array.from(activeSensors.values())
            .filter(sensor => sensor.id.startsWith(type));
        console.log('Found', sensors.length, 'available sensors:', sensors);
        socket.emit('available-sensors', sensors);
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

    // Handle sensor data requests
    socket.on('get-sensor-data', (sensorId) => {
        const data = generateSensorData(sensorId);
        if (data) {
            socket.emit('sensor-update', { [sensorId]: data });
        }
    });

    // Handle sensor history requests
    socket.on('get-sensor-history', (sensorId) => {
        const history = sensorHistory.get(sensorId) || [];
        socket.emit('sensor-history', {
            sensorId: sensorId,
            history: history
        });
    });

    // Handle sensor unsubscription
    socket.on('unsubscribe-sensor', (sensorId) => {
        console.log('Unsubscribing from sensor:', sensorId);
        if (sensorIntervals.has(sensorId)) {
            clearInterval(sensorIntervals.get(sensorId));
            sensorIntervals.delete(sensorId);
        }
        sensorPlayStates.delete(sensorId);
        sensorBandwidths.delete(sensorId);
    });

    // Handle play/pause state
    socket.on('sensor-play-pause', (data) => {
        const { sensorId, isPlaying } = data;
        console.log(`Play/Pause: Sensor ${sensorId}, isPlaying: ${isPlaying}`);
        
        if (isPlaying) {
            // Always clear existing interval first
            if (sensorIntervals.has(sensorId)) {
                clearInterval(sensorIntervals.get(sensorId));
                sensorIntervals.delete(sensorId);
            }
            
            // Create new interval
            const initialData = generateSensorData(sensorId);
            if (initialData) {
                console.log(`Sending initial data for ${sensorId}: ${initialData.value}`);
                socket.emit('sensor-update', { [sensorId]: initialData });
                
                const interval = setInterval(() => {
                    const newData = generateSensorData(sensorId);
                    if (newData) {
                        socket.emit('sensor-update', { [sensorId]: newData });
                    }
                }, 1000);
                
                sensorIntervals.set(sensorId, interval);
                console.log(`Interval created for ${sensorId}`);
            } else {
                console.log(`Failed to generate data for ${sensorId}`);
            }
        } else {
            // Stop interval
            if (sensorIntervals.has(sensorId)) {
                clearInterval(sensorIntervals.get(sensorId));
                sensorIntervals.delete(sensorId);
                console.log(`Interval stopped for ${sensorId}`);
            }
        }
        
        sensorPlayStates.set(sensorId, isPlaying);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        sensorIntervals.forEach((interval, sensorId) => {
            clearInterval(interval);
        });
        sensorIntervals.clear();
        sensorPlayStates.clear();
    });
});

// Generate mock sensors with enhanced data
function generateMockSensors(type) {
    const sensors = [];
    const sensorId = `${type}-1`;
    
    const sensorConfig = {
        wifi: {
            name: 'WiFi Humidity Sensor',
            unit: '%',
            description: 'Measures relative humidity in the environment',
            minValue: 30,
            maxValue: 70
        },
        lora: {
            name: 'LoRaWAN Temperature Sensor',
            unit: '°C',
            description: 'Measures ambient temperature using LoRaWAN protocol',
            minValue: 15,
            maxValue: 35
        },
        ble: {
            name: 'BLE Vibration Sensor',
            unit: 'g',
            description: 'Measures vibration in g-force units',
            minValue: 0.1,
            maxValue: 2.0
        },
        ethernet: {
            name: 'Ethernet CO2 Sensor',
            unit: 'ppm',
            description: 'Measures CO2 levels in parts per million',
            minValue: 400,
            maxValue: 2000
        }
    };

    const config = sensorConfig[type];
    if (config) {
        const sensor = {
            id: sensorId,
            name: config.name,
            unit: config.unit,
            description: config.description,
            minValue: config.minValue,
            maxValue: config.maxValue,
            status: 'active',
            lastUpdate: new Date().toISOString()
        };
        
        sensors.push(sensor);
        activeSensors.set(sensorId, sensor);
    }
    
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
