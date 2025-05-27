# ESP32 Multi-Interface IoT Data Gateway - Test Cases

## Overview
This document contains manual functional test cases for the ESP32 Multi-Interface IoT Data Gateway project. The test cases verify the core functionality of the system, including sensor data collection, real-time updates, and sensor discovery.

## Test Environment Requirements
- Windows 10 operating system
- Node.js installed
- PowerShell access
- Web browser (Chrome/Firefox/Edge)
- Internet connection

## Test Case 1: Basic Sensor Data Collection and Display
**Objective**: Verify that the system can collect and display data from all supported interfaces.

### Prerequisites
1. Ensure the dashboard server is running:
   ```powershell
   npm start
   ```
2. Open `http://localhost:9080` in your web browser

### Test Steps
1. Send test data to WiFi sensor:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:9080/update_wifi" -Method POST -ContentType "text/plain" -Body "Temperature: 25.5C, Humidity: 48%"
   ```
2. Send test data to LoRa sensor:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:9080/update_lora" -Method POST -ContentType "text/plain" -Body "Temperature: 26.2C"
   ```
3. Send test data to BLE sensor:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:9080/update_ble" -Method POST -ContentType "text/plain" -Body "Vibration: 0.5g"
   ```
4. Send test data to Ethernet sensor:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:9080/update_ethernet" -Method POST -ContentType "text/plain" -Body "CO2: 450 ppm"
   ```

### Expected Results
- All four sensor cards should display the sent values
- Each sensor's chart should show a new data point
- Timestamps should update to show the current time
- No error messages should appear in the browser console

## Test Case 2: Real-time Data Updates and Chart Behavior
**Objective**: Verify that the system properly handles real-time data updates and maintains chart history.

### Prerequisites
1. Dashboard server running
2. Dashboard open in browser at `http://localhost:9080`

### Test Steps
1. Run the following PowerShell script to send multiple data points:
   ```powershell
   $sensors = @(
       @{url="update_wifi"; data="Temperature: {0}C, Humidity: {1}%"},
       @{url="update_lora"; data="Temperature: {0}C"},
       @{url="update_ble"; data="Vibration: 0.{0}g"},
       @{url="update_ethernet"; data="CO2: {0} ppm"}
   )

   for ($i = 1; $i -le 5; $i++) {
       foreach ($sensor in $sensors) {
           $data = $sensor.data -f $i
           Invoke-WebRequest -Uri "http://localhost:9080/$($sensor.url)" -Method POST -ContentType "text/plain" -Body $data
       }
       Start-Sleep -Seconds 1
   }
   ```

### Expected Results
- Charts should update smoothly with each new data point
- Each sensor's value should update in real-time
- Chart lines should show a clear progression of values
- Maximum of 20 data points should be maintained in each chart
- No data loss or display glitches should occur

## Test Case 3: Sensor Discovery and Connection
**Objective**: Verify the sensor scanning and connection functionality.

### Prerequisites
1. Dashboard server running
2. Dashboard open in browser at `http://localhost:9080`

### Test Steps
1. Locate the "Scan & Connect to Sensors" section
2. Click the "Scan" button
3. Wait for the scan to complete (approximately 2 seconds)
4. Verify the scan results show:
   - BLE sensor (ID: BLE-1234)
   - WiFi sensor (ID: WiFi-5678)
   - LoRa sensor (ID: LoRa-9012)
5. For each sensor in the list:
   - Click the "Connect" button
   - Wait for the connection status message
   - Verify the sensor card starts receiving data

### Expected Results
- Scan status should change from "Idle" to "Scanning..." to "Found 3 sensors"
- Each sensor should be listed with:
  - Correct sensor type
  - Unique ID
  - RSSI value
  - "Connect" button
- Connection status should update for each sensor:
  - "Connecting to [sensor-id]..."
  - "Connected to [sensor-id]!"
- After connection, corresponding sensor card should:
  - Show "Connected" status
  - Begin displaying real-time data
  - Update its chart with new data points

## Pass/Fail Criteria
- Test Case 1: Pass if all four sensors display the correct values and update their timestamps
- Test Case 2: Pass if charts show smooth updates and maintain correct history
- Test Case 3: Pass if all three sensors are discovered and can be connected successfully

## Notes
- All test cases should be executed in sequence
- Each test case should be completed before moving to the next
- Document any deviations from expected results
- Take screenshots of any issues encountered 