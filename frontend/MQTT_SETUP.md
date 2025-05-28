# MQTT Client Setup

## Overview
The frontend now includes an MQTT client that connects to HiveMQ Cloud to receive real-time data from your IoT devices.

## Configuration
The MQTT client is configured to connect to:
- **Broker**: `1fdc695c8afb4de39adb9ca0d6d09980.s1.eu.hivemq.cloud`
- **Port**: `8884` (WebSocket Secure)
- **Protocol**: `wss` (WebSocket Secure)
- **Username**: `simrhoic`
- **Password**: `ADSMack5`

## Features

### 🔗 Connection Management
- Automatic connection to HiveMQ Cloud on app startup
- Connection status indicator in the header
- Automatic reconnection on connection loss
- Enhanced error handling and logging

### 📡 Topic Subscription
The client subscribes to:
- `simrhoic/water/#` - all water monitoring data from your Arduino device
- `#` (all topics) - for debugging purposes to capture any other data

### 🏷️ Supported Topics
Based on your Arduino sketch, the following topics are monitored:
- `simrhoic/water/battery` - Battery voltage readings (V)
- `simrhoic/water/level` - Water level distance measurements (cm)
- `simrhoic/water/tds` - Total Dissolved Solids readings (ppm)
- `simrhoic/water/ph` - pH level readings (4.0-10.0 range)

### 📊 Data Processing
- Automatic parsing of numeric sensor values
- Real-time updates to the dashboard components
- **Local Storage**: All received data is automatically saved to browser localStorage
- **Persistent Data**: Data persists between browser sessions
- **Auto-refresh**: UI refreshes from localStorage every 5 seconds
- Message logging with timestamps and sizes

### 🖥️ User Interface
- **Connection Status**: Visual indicator showing MQTT connection state
- **Sensor Readings Panel**: Real-time display of battery, water level, and TDS values
- **Message Log**: Real-time display of all received MQTT messages
- **Data Visualization**: Automatic updates to water level and quality displays
- **Storage Management**: Clear localStorage button and storage status
- **Enhanced Logging**: Console logs with emojis and detailed information

## Message Format Support

The client is optimized for your Arduino's data format:

### Arduino Data Format
Your ESP32 publishes simple numeric values:
```
Topic: simrhoic/water/battery
Message: 5.29

Topic: simrhoic/water/level  
Message: 16.00

Topic: simrhoic/water/tds
Message: 307

Topic: simrhoic/water/ph
Message: 7.45
```

### Data Mapping
- **Battery**: Voltage readings from potentiometer (3.0-6.0V range)
- **Level**: Water level distance from potentiometer (5-50 cm range)
- **TDS**: Total Dissolved Solids from potentiometer (0-1000 ppm range)
- **pH**: pH level from potentiometer (4.0-10.0 pH range)

### Local Storage Structure
Each message is stored as:
```json
{
  "value": "5.29",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "topic": "simrhoic/water/battery"
}
```

## Console Logging

The application provides detailed console logging:
- 📨 Message reception with timestamps
- 📄 Message content and size
- ✅ Successful JSON parsing
- 🔢 Numeric value parsing
- ❌ Error messages with troubleshooting hints
- 🔄 Connection status changes

## Development

To run the frontend with MQTT client:

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173` and will automatically connect to the MQTT broker.

## Troubleshooting

### Connection Issues
1. Check your internet connection
2. Verify the broker credentials are correct
3. Ensure the broker allows WebSocket connections
4. Check browser console for detailed error messages

### No Messages Received
1. Verify your IoT device is publishing to the correct topics
2. Check that the device is connected to the same MQTT broker
3. Use the browser console to see connection and subscription status

### Data Not Updating
1. Check the message format matches expected JSON or numeric format
2. Verify topic names match the subscription patterns
3. Look for parsing errors in the browser console 