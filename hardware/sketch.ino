// === MQTT and WiFi Setup ===
#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

// === Pin Definitions ===
#define BUZZER_PIN       19
#define TDS_SENSOR_PIN   34  // Potentiometer for TDS simulation
#define PH_SENSOR_PIN    32  // Potentiometer for pH simulation
#define WATER_LEVEL_TRIG_PIN  25  // Ultrasonic sensor trigger pin
#define WATER_LEVEL_ECHO_PIN  26  // Ultrasonic sensor echo pin
#define BATTERY_PIN      35  // Potentiometer for battery voltage simulation

// WiFi credentials (simulated for Wokwi)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT broker
const char* mqtt_server = "1fdc695c8afb4de39adb9ca0d6d09980.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "simrhoic";
const char* mqtt_pass = "ADSMack5";

// Use WiFiClientSecure for SSL/TLS connection
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// === Constants ===
const float LOW_BATTERY_THRESHOLD = 3.0;
const int TDS_ALERT_THRESHOLD = 700;
const float TANK_HEIGHT_CM = 100.0;  // Total height of water tank in cm
const float LOW_WATER_LEVEL_THRESHOLD = 20.0;  // Alert when water level below 20cm
const float PH_LOW_THRESHOLD = 6.0;
const float PH_HIGH_THRESHOLD = 8.5;

// === Setup ===
void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(WATER_LEVEL_TRIG_PIN, OUTPUT);
  pinMode(WATER_LEVEL_ECHO_PIN, INPUT);
  
  // Set analog read resolution to 12-bit for better precision
  analogReadResolution(12);

  connectToWiFi();
  
  // Configure SSL/TLS - skip certificate verification for simplicity
  espClient.setInsecure();
  
  mqttClient.setServer(mqtt_server, mqtt_port);
  
  // Initial MQTT connection
  reconnectMQTT();
  
  Serial.println("Setup complete!");
}

// === Main Loop ===
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting to reconnect...");
    connectToWiFi();
  }
  
  float batteryVoltage = readBatteryVoltage();
  int tdsValue = readTDSValue();
  float phValue = readPHValue();
  float waterLevel = readWaterLevel();

  displaySensorData(batteryVoltage, tdsValue, phValue, waterLevel);
  handleAlerts(batteryVoltage, tdsValue, phValue, waterLevel);
  publishSensorDataMQTT(batteryVoltage, tdsValue, phValue, waterLevel);

  delay(2000);
}

// === WiFi + MQTT Helpers ===
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

void reconnectMQTT() {
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Connecting to MQTT broker...");
    Serial.print(" (attempt ");
    Serial.print(attempts + 1);
    Serial.println("/5)");
    
    // Generate unique client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("✅ MQTT connected successfully!");
      Serial.print("Client ID: ");
      Serial.println(clientId);
    } else {
      Serial.print("❌ MQTT connection failed, rc=");
      Serial.print(mqttClient.state());
      Serial.print(" (");
      
      // Decode error codes
      switch(mqttClient.state()) {
        case -4: Serial.print("Connection timeout"); break;
        case -3: Serial.print("Connection lost"); break;
        case -2: Serial.print("Connect failed"); break;
        case -1: Serial.print("Disconnected"); break;
        case 1: Serial.print("Bad protocol version"); break;
        case 2: Serial.print("Bad client ID"); break;
        case 3: Serial.print("Unavailable"); break;
        case 4: Serial.print("Bad credentials"); break;
        case 5: Serial.print("Unauthorized"); break;
        default: Serial.print("Unknown error"); break;
      }
      Serial.println(")");
      
      attempts++;
      if (attempts < 5) {
        Serial.println("Retrying in 3 seconds...");
        delay(3000);
      }
    }
  }
  
  if (!mqttClient.connected()) {
    Serial.println("⚠️ Failed to connect to MQTT after 5 attempts. Continuing without MQTT...");
  }
}

// === MQTT Publisher ===
void publishSensorDataMQTT(float battery, int tds, float ph, float level) {
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnected, attempting to reconnect...");
    reconnectMQTT();
  }
  
  if (mqttClient.connected()) {
    mqttClient.loop();

    // Publish with QoS 0 and retain flag
    bool success = true;
    success &= mqttClient.publish("simrhoic/water/battery", String(battery, 2).c_str(), true);
    success &= mqttClient.publish("simrhoic/water/tds", String(tds).c_str(), true);
    success &= mqttClient.publish("simrhoic/water/ph", String(ph, 2).c_str(), true);
    success &= mqttClient.publish("simrhoic/water/level", String(level, 2).c_str(), true);
    
    if (success) {
      Serial.println("📡 Data published to MQTT successfully");
    } else {
      Serial.println("❌ Failed to publish some data to MQTT");
    }
  } else {
    Serial.println("⚠️ MQTT not connected, skipping data publish");
  }
}

// === Sensor Reading Functions ===
float readBatteryVoltage() {
  int raw = analogRead(BATTERY_PIN);
  // Convert 12-bit ADC reading to voltage (0-3.3V) then scale for battery voltage (3.0-6.0V range)
  float voltage = (raw / 4095.0) * 3.3; // Convert to 0-3.3V
  return 3.0 + (voltage * 3.0 / 3.3); // Scale to 3.0-6.0V battery range
}

int readTDSValue() {
  int raw = analogRead(TDS_SENSOR_PIN);
  // Convert 12-bit ADC reading to TDS value (0-1000 ppm range)
  return map(raw, 0, 4095, 0, 1000);
}

float readPHValue() {
  int raw = analogRead(PH_SENSOR_PIN);
  // Convert 12-bit ADC reading to pH value (4.0-10.0 pH range)
  return 4.0 + ((raw / 4095.0) * 6.0); // Scale to 4.0-10.0 pH range
}

float readWaterLevel() {
  // Send a 10μs pulse to trigger pin
  digitalWrite(WATER_LEVEL_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(WATER_LEVEL_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(WATER_LEVEL_TRIG_PIN, LOW);
  
  // Read the echo pin and calculate distance
  long duration = pulseIn(WATER_LEVEL_ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    // Timeout occurred, return a safe default value
    Serial.println("⚠️ Warning: Ultrasonic sensor timeout");
    return 0.0; // Assume no water on timeout
  }
  
  // Calculate distance to water surface in cm (speed of sound = 343 m/s = 0.0343 cm/μs)
  // Distance = (duration * speed of sound) / 2 (divide by 2 for round trip)
  float distanceToWater = (duration * 0.0343) / 2;
  
  // Constrain distance to reasonable range (2-400 cm for HC-SR04)
  distanceToWater = constrain(distanceToWater, 2.0, 400.0);
  
  // Convert distance to actual water level
  // Water level = Tank height - Distance to water surface
  float waterLevel = TANK_HEIGHT_CM - distanceToWater;
  
  // Ensure water level is not negative (sensor might be reading beyond tank height)
  waterLevel = max(waterLevel, 0.0f);
  
  // Ensure water level doesn't exceed tank height
  waterLevel = min(waterLevel, TANK_HEIGHT_CM);
  
  return waterLevel;
}

// === Output Functions ===
void displaySensorData(float battery, int tds, float ph, float level) {
  Serial.println("===== Sensor Readings =====");
  Serial.print("Battery Voltage: "); Serial.print(battery, 2); Serial.println(" V");
  Serial.print("TDS Value: "); Serial.print(tds); Serial.println(" ppm");
  Serial.print("pH Value: "); Serial.print(ph, 2); Serial.println("");
  Serial.print("Water Level: "); Serial.print(level, 2); Serial.print(" cm ("); 
  Serial.print((level/TANK_HEIGHT_CM)*100, 1); Serial.println("% full)");
}

// === Alert System ===
void handleAlerts(float battery, int tds, float ph, float level) {
  bool alertTriggered = false;
  
  if (battery < LOW_BATTERY_THRESHOLD) {
    Serial.println("⚠️ ALERT: Battery low!");
    tone(BUZZER_PIN, 1000, 100);
    alertTriggered = true;
  }
  else if (tds > TDS_ALERT_THRESHOLD) {
    Serial.println("⚠️ ALERT: High TDS - Possible water contamination!");
    tone(BUZZER_PIN, 523, 200);
    alertTriggered = true;
  }
  else if (ph < PH_LOW_THRESHOLD || ph > PH_HIGH_THRESHOLD) {
    Serial.print("⚠️ ALERT: pH out of range (");
    Serial.print(ph, 2);
    Serial.println(")!");
    tone(BUZZER_PIN, 659, 150);
    alertTriggered = true;
  }
  else if (level < LOW_WATER_LEVEL_THRESHOLD) {
    Serial.print("⚠️ ALERT: Low water level (");
    Serial.print(level, 1);
    Serial.println(" cm)!");
    tone(BUZZER_PIN, 262, 100);
    alertTriggered = true;
  }
  
  if (!alertTriggered) {
    Serial.println("💧 INFO: All sensors within normal range!");
    digitalWrite(BUZZER_PIN, LOW);
  }
}
