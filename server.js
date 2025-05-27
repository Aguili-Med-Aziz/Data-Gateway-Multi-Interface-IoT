const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.txt');

// Serve static files
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('log-data', (data) => {
        const logEntry = `${new Date(data.timestamp).toISOString()} - ${data.sensor}: ${data.value}\n`;
        fs.appendFile(LOG_FILE, logEntry, (err) => {
            if (err) console.error('Error writing to log:', err);
        });
    });

    // Simulate sensor data every 10ms
    setInterval(() => {
        socket.emit('sensor-update', {
            wifi: { value: `Humidity: ${Math.random() * 100}%`, lastUpdate: Date.now() },
            lora: { value: `Temperature: ${20 + Math.random() * 15}C`, lastUpdate: Date.now() },
            ble: { value: 'N/A', lastUpdate: Date.now() },
            ethernet: { value: `CO2: ${400 + Math.random() * 200} ppm`, lastUpdate: Date.now() }
        });
    }, 10);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
