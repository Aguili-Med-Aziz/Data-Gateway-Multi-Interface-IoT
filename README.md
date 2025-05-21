# ESP32 Multi-Interface IoT Data Gateway

A comprehensive IoT data gateway that aggregates and processes sensor data from multiple interfaces (WiFi, BLE, LoRa, and Ethernet) and provides a real-time web dashboard for monitoring and control. This gateway serves as a central hub for collecting, processing, and visualizing data from various IoT sensors and devices.

## Project Architecture

### Hardware Components
- ESP32 microcontroller
- Various sensors:
  - WiFi Humidity/Temperature Sensor
  - LoRaWAN Temperature Sensor
  - BLE Vibration Sensor
  - Ethernet CO2 Sensor

### Software Components
1. **ESP32 Firmware** (`sketch.ino`)
   - Handles multiple communication interfaces
   - Processes sensor data
   - Serves as an HTTP server for data endpoints

2. **Dashboard Server** (`dashboard-server.js`)
   - Node.js Express server
   - WebSocket server for real-time updates
   - REST API endpoints for sensor data
   - Serves the web dashboard

3. **Web Dashboard** (`public/index.html`)
   - Real-time sensor data visualization
   - Interactive charts using Chart.js
   - Responsive design using Bootstrap
   - Real-time updates using Socket.IO

## Technologies Used

### Programming Languages
- **C++** - ESP32 firmware development
- **JavaScript** - Server and web dashboard
- **HTML/CSS** - Web interface

### Frameworks & Libraries
- **Backend**
  - Node.js - Runtime environment
  - Express.js - Web server framework
  - Socket.IO - Real-time communication
  - SerialPort - Serial communication

- **Frontend**
  - Bootstrap 5.1.3 - UI framework
  - Chart.js 4.4.1 - Data visualization
  - Socket.IO Client - Real-time updates

### Development Tools
- **Arduino IDE** - ESP32 firmware development
- **Visual Studio Code** - Code editor
- **Git** - Version control
- **npm** - Package management
- **Wokwi** - IoT simulation platform

### Communication Protocols
- WiFi (IEEE 802.11)
- Bluetooth Low Energy (BLE)
- LoRaWAN
- HTTP/REST
- WebSocket

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Arduino IDE (for ESP32 firmware)
- ESP32 development board
- Required sensors and components

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Upload ESP32 firmware**
   - Open `sketch.ino` in Arduino IDE
   - Install required libraries:
     - WiFi
     - WebServer
   - Select your ESP32 board
   - Upload the sketch

## Running the Project

1. **Start the dashboard server**
   ```bash
   npm start
   ```
   The server will start on port 9080 by default.

2. **Access the dashboard**
   Open your web browser and navigate to:
   ```
   http://localhost:9080
   ```

## API Endpoints

The server provides the following REST API endpoints for sensor data:

- `POST /update_wifi` - Update WiFi sensor data
- `POST /update_lora` - Update LoRa sensor data
- `POST /update_ble` - Update BLE sensor data
- `POST /update_ethernet` - Update Ethernet sensor data

Example usage:
```bash
# Update WiFi sensor data
curl -X POST -H "Content-Type: text/plain" --data "Temperature: 25.5C, Humidity: 48%" http://localhost:9080/update_wifi

# Update LoRa sensor data
curl -X POST -H "Content-Type: text/plain" --data "Temperature: 25.5C" http://localhost:9080/update_lora

# Update BLE sensor data
curl -X POST -H "Content-Type: text/plain" --data "Vibration: 0.5g" http://localhost:9080/update_ble

# Update Ethernet sensor data
curl -X POST -H "Content-Type: text/plain" --data "CO2: 450 ppm" http://localhost:9080/update_ethernet
```

## Project Structure

```
├── sketch.ino              # ESP32 firmware
├── dashboard-server.js     # Node.js server
├── package.json           # Node.js dependencies
├── public/               # Web dashboard files
│   └── index.html       # Dashboard interface
└── README.md            # This file
```

## Features

- Real-time sensor data visualization
- Multiple communication interfaces support
- Interactive charts and graphs
- Responsive web dashboard
- REST API for data updates
- WebSocket for real-time updates

## Development

### Adding New Sensors
1. Add sensor data structure in `sensorData` object
2. Create new API endpoint in `dashboard-server.js`
3. Add sensor card in `public/index.html`
4. Update chart configuration if needed

### Customizing the Dashboard
- Modify `public/index.html` for UI changes
- Update styles in the `<style>` section
- Add new charts or components as needed

## Troubleshooting

1. **Server won't start**
   - Check if port 9080 is available
   - Verify Node.js and npm are installed
   - Check for missing dependencies

2. **No sensor data showing**
   - Verify ESP32 is connected to WiFi
   - Check API endpoint calls
   - Monitor server console for errors

3. **Dashboard not updating**
   - Check WebSocket connection
   - Verify sensor data format
   - Clear browser cache

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 