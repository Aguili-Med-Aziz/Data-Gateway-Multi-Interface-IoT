/* ESP32 Multi-Interface IoT Data Hub (BLE, WiFi, Ethernet-Simulated) for Wokwi.com

  Receives data via:
  1. BLE: ESP32 acts as a BLE server, sensors write to a characteristic.
  2. WiFi: Sensors on the same WiFi network POST data to an HTTP endpoint.
  3. Ethernet (Simulated): Similar to WiFi, sensors POST data to a different
     HTTP endpoint on the ESP32's WiFi IP. This simulates data arriving as if
     from an Ethernet-connected sensor or system.

  Displays aggregated data on a localhost web dashboard.

  To test:
  1. Start Wokwi IoT Gateway (requires Wokwi Club).
  2. Start this simulation with this .ino file and the corresponding diagram.json.
  3. Open http://localhost:9080 in your browser for the dashboard.

  To send data:
  - WiFi Sensor:
    curl -X POST -H "Content-Type: text/plain" --data "Temperature: 25.5C, Humidity: 48%" http://localhost:9080/update_wifi
  - Ethernet Sensor (Simulated):
    curl -X POST -H "Content-Type: text/plain" --data "FlowRate: 10.2L/min, Pressure: 2.1bar" http://localhost:9080/update_ethernet
  - BLE Sensor:
    Use a BLE scanner app (e.g., nRF Connect on mobile) connected through Wokwi Gateway:
    - Connect to "ESP32 Sensor Hub".
    - Find Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
    - Find Characteristic UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8
    - Write a string value (e.g., "SoilMoisture: 65%") to the characteristic.
*/

#include <WiFi.h>
#include <WebServer.h>
// #include <HTTPClient.h>

// WiFi credentials
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Pin definitions
#define STATUS_LED1 26
#define STATUS_LED2 27

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Global objects
WebServer server(80);
bool deviceConnected = false;

// Sensor data structure
struct SensorData {
  float humidity = 0;
  float temperature = 0;
  float ds18b20_temp = 0;
  float vibration = 0;
  float co2 = 0;
  float gas = 0;
  bool motion = false;
  String timestamp = "";
} sensorData;

// Random value generation helpers
void simulateSensorData() {
  // Simulate DHT22 (humidity: 30-70%, temperature: 15-35°C)
  sensorData.humidity = 50.0;
  sensorData.temperature = 25.0;

  // Simulate DS18B20 (temperature: 15-35°C)
  sensorData.ds18b20_temp = 25.0;

  // Simulate MPU6050 (vibration: 0.1-2.0g)
  sensorData.vibration = 1.0;

  // Simulate CO2 sensor (400-2000 ppm)
  sensorData.co2 = 800.0;

  // Simulate gas sensor (0-3.3V)
  sensorData.gas = 1.65;

  // Simulate PIR (random motion detection)
  sensorData.motion = false;

  // Update timestamp
  sensorData.timestamp = "2025-05-16 12:00:00";
}

void sendDataToDashboard() {
  // Simulate sending data to dashboard endpoints using Serial output (for Wokwi, since HTTPClient is not supported)
  Serial.println("[DASHBOARD] WiFi: Temperature: " + String(sensorData.temperature, 1) + "C, Humidity: " + String(sensorData.humidity, 1) + "%");
  Serial.println("[DASHBOARD] LoRa: Temperature: " + String(sensorData.ds18b20_temp, 1) + "C");
  Serial.println("[DASHBOARD] BLE: Vibration: " + String(sensorData.vibration, 2) + "g");
  Serial.println("[DASHBOARD] Ethernet: CO2: " + String(sensorData.co2, 0) + " ppm");
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Setup web server routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/update_wifi", HTTP_POST, handleWiFiUpdate);
  server.on("/update_lora", HTTP_POST, handleLoRaUpdate);
  server.on("/update_ble", HTTP_POST, handleBLEUpdate);
  server.on("/update_ethernet", HTTP_POST, handleEthernetUpdate);
  server.on("/data", HTTP_GET, handleData); // New endpoint for JSON data
  server.begin();
}

void loop() {
  server.handleClient();
  
  // Simulate sensor data
  simulateSensorData();

  sendDataToDashboard();

  delay(1000); // Update every second
}

void handleRoot() {
  String html = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>ESP32 Sensor Hub</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .sensor-data { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .sensor-value { font-weight: bold; color: #2196F3; }
        .timestamp { color: #666; font-size: 0.9em; }
        .motion-detected { color: #f44336; }
        .motion-not-detected { color: #4CAF50; }
      </style>
      <script>
        function updateData() {
          fetch('/data')
            .then(response => response.json())
            .then(data => {
              document.getElementById('timestamp').textContent = data.timestamp;
              document.getElementById('humidity').textContent = data.humidity.toFixed(1) + '%';
              document.getElementById('temperature').textContent = data.temperature.toFixed(1) + '°C';
              document.getElementById('ds18b20-temp').textContent = data.ds18b20_temp.toFixed(1) + '°C';
              document.getElementById('vibration').textContent = data.vibration.toFixed(2) + 'g';
              document.getElementById('co2').textContent = data.co2.toFixed(0) + ' ppm';
              document.getElementById('gas').textContent = data.gas.toFixed(2) + 'V';
              document.getElementById('motion').textContent = data.motion ? 'Detected' : 'No Motion';
              document.getElementById('motion').className = data.motion ? 'motion-detected' : 'motion-not-detected';
            });
        }
        setInterval(updateData, 1000);
      </script>
    </head>
    <body>
      <h1>ESP32 Sensor Hub</h1>
      <div class="sensor-data">
        <p>Timestamp: <span id="timestamp" class="sensor-value"></span></p>
        <p>DHT22 - Humidity: <span id="humidity" class="sensor-value"></span></p>
        <p>DHT22 - Temperature: <span id="temperature" class="sensor-value"></span></p>
        <p>DS18B20 - Temperature: <span id="ds18b20-temp" class="sensor-value"></span></p>
        <p>MPU6050 - Vibration: <span id="vibration" class="sensor-value"></span></p>
        <p>CO2 Sensor: <span id="co2" class="sensor-value"></span></p>
        <p>Gas Sensor: <span id="gas" class="sensor-value"></span></p>
        <p>PIR Motion: <span id="motion" class="sensor-value"></span></p>
      </div>
    </body>
    </html>
  )";
  server.send(200, "text/html", html);
}

void handleData() {
  String json = "{";
  json += "\"timestamp\":\"" + sensorData.timestamp + "\",";
  json += "\"humidity\":" + String(sensorData.humidity) + ",";
  json += "\"temperature\":" + String(sensorData.temperature) + ",";
  json += "\"ds18b20_temp\":" + String(sensorData.ds18b20_temp) + ",";
  json += "\"vibration\":" + String(sensorData.vibration) + ",";
  json += "\"co2\":" + String(sensorData.co2) + ",";
  json += "\"gas\":" + String(sensorData.gas) + ",";
  json += "\"motion\":" + String(sensorData.motion ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handleWiFiUpdate() {
  if (server.hasArg("plain")) {
    String data = server.arg("plain");
    Serial.println("WiFi data received: " + data);
    server.send(200, "text/plain", "OK");
  }
}

void handleLoRaUpdate() {
  if (server.hasArg("plain")) {
    String data = server.arg("plain");
    Serial.println("LoRa data received: " + data);
    server.send(200, "text/plain", "OK");
  }
}

void handleBLEUpdate() {
  if (server.hasArg("plain")) {
    String data = server.arg("plain");
    Serial.println("BLE data received: " + data);
    server.send(200, "text/plain", "OK");
  }
}

void handleEthernetUpdate() {
  if (server.hasArg("plain")) {
    String data = server.arg("plain");
    Serial.println("Ethernet data received: " + data);
    server.send(200, "text/plain", "OK");
  }
}