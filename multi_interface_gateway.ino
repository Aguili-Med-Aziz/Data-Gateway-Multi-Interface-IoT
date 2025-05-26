// Include necessary libraries for time handling and sensors
#include <TimeLib.h>

// Define sensor update intervals (in milliseconds)
const unsigned long WIFI_INTERVAL = 10000;    // 10 seconds for humidity
const unsigned long LORA_INTERVAL = 3000;     // 3 seconds for temperature
const unsigned long BLE_INTERVAL = 2000;      // 2 seconds for BLE
const unsigned long ETHERNET_INTERVAL = 4000;  // 4 seconds for CO2
const unsigned long MOTION_INTERVAL = 1000;   // 1 second for motion

// Variables to store last update time for each sensor
unsigned long lastWifiUpdate = 0;
unsigned long lastLoraUpdate = 0;
unsigned long lastBleUpdate = 0;
unsigned long lastEthernetUpdate = 0;
unsigned long lastMotionUpdate = 0;

void setup() {
  Serial.begin(9600);
  // Set initial time (for demo purposes using a fixed date)
  setTime(20, 40, 0, 21, 5, 2025);
}

void loop() {
  unsigned long currentMillis = millis();

  // Check for WiFi update
  if (currentMillis - lastWifiUpdate >= WIFI_INTERVAL) {
    float humidity = random(0, 10000) / 100.0; // Generate random humidity 0-100%
    printTimestamp();
    Serial.print(" - wifi: Humidity: ");
    Serial.print(humidity);
    Serial.println("%");
    lastWifiUpdate = currentMillis;
  }

  // Check for LoRa update
  if (currentMillis - lastLoraUpdate >= LORA_INTERVAL) {
    float temperature = random(2000, 3500) / 100.0; // Generate random temperature 20-35°C
    printTimestamp();
    Serial.print(" - lora: Temperature: ");
    Serial.print(temperature);
    Serial.println("C");
    lastLoraUpdate = currentMillis;
  }

  // Check for BLE update
  if (currentMillis - lastBleUpdate >= BLE_INTERVAL) {
    printTimestamp();
    Serial.println(" - ble: N/A");
    lastBleUpdate = currentMillis;
  }

  // Check for Ethernet update
  if (currentMillis - lastEthernetUpdate >= ETHERNET_INTERVAL) {
    float co2 = random(40000, 60000) / 100.0; // Generate random CO2 400-600 ppm
    printTimestamp();
    Serial.print(" - ethernet: CO2: ");
    Serial.print(co2);
    Serial.println(" ppm");
    lastEthernetUpdate = currentMillis;
  }

  // Check for Motion update
  if (currentMillis - lastMotionUpdate >= MOTION_INTERVAL) {
    bool motion = random(0, 2) > 0; // Random motion detection
    printTimestamp();
    Serial.print(" - motion: ");
    Serial.println(motion ? "Movement Detected" : "No Movement");
    lastMotionUpdate = currentMillis;
  }
}

void printTimestamp() {
  char timestamp[30];
  sprintf(timestamp, "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ",
          year(), month(), day(),
          hour(), minute(), second(),
          (int)(millis() % 1000));
  Serial.print(timestamp);
}
