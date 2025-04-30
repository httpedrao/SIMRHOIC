// === MQTT and WiFi Setup ===
#include <WiFi.h>
#include <PubSubClient.h>

// === Pin Definitions ===
#define TRIG_PIN         5
#define ECHO_PIN         18
#define BUZZER_PIN       19
#define TDS_SENSOR_PIN   34
#define BATTERY_PIN      35

// WiFi credentials (simulated for Wokwi)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT broker
const char* mqtt_server = "broker.hivemq.com";
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// === Constants ===
const float LOW_BATTERY_THRESHOLD = 3.0;
const int TDS_ALERT_THRESHOLD = 700;
const float LOW_WATER_LEVEL_CM = 30.0;

// === Setup ===
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  analogReadResolution(10);

  connectToWiFi();
  mqttClient.setServer(mqtt_server, 1883);
}

// === Main Loop ===
void loop() {
  float batteryVoltage = readBatteryVoltage();
  int tdsValue = readTDSValue();
  float waterLevel = readWaterLevel();

  displaySensorData(batteryVoltage, tdsValue, waterLevel);
  handleAlerts(batteryVoltage, tdsValue, waterLevel);
  publishSensorDataMQTT(batteryVoltage, tdsValue, waterLevel);

  delay(2000);
}

// === WiFi + MQTT Helpers ===
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect("ESP32Client")) {
      Serial.println("connected.");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// === MQTT Publisher ===
void publishSensorDataMQTT(float battery, int tds, float level) {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  mqttClient.publish("simrhoic/water/battery", String(battery).c_str());
  mqttClient.publish("simrhoic/water/tds", String(tds).c_str());
  mqttClient.publish("simrhoic/water/level", String(level).c_str());
}

// === Sensor Reading Functions ===
float readBatteryVoltage() {
  int raw = analogRead(BATTERY_PIN);
  return raw * (3.3 / 1023.0) * 2.0; // Simulated voltage divider
}

int readTDSValue() {
  return analogRead(TDS_SENSOR_PIN); // Simulated with potentiometer
}

float readWaterLevel() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2.0; // Convert to cm
}

// === Output Functions ===
void displaySensorData(float battery, int tds, float level) {
  Serial.println("===== Sensor Readings =====");
  Serial.print("Battery Voltage: "); Serial.print(battery); Serial.println(" V");
  Serial.print("TDS Value: "); Serial.println(tds);
  Serial.print("Water Level Distance: "); Serial.print(level); Serial.println(" cm");
}

// === Alert System ===
void handleAlerts(float battery, int tds, float level) {
  if (battery < LOW_BATTERY_THRESHOLD) {
    Serial.println("⚠️ ALERT: Battery low!");
    tone(BUZZER_PIN, 1000, 100);
  }
  else if (tds > TDS_ALERT_THRESHOLD) {
    Serial.println("⚠️ ALERT: Possible water contamination!");
    tone(BUZZER_PIN, 523, 200);
  }
  else if (level > LOW_WATER_LEVEL_CM) {
    Serial.println("⚠️ ALERT: Low water level!");
    tone(BUZZER_PIN, 262, 100);
  }
  else {
    Serial.println("💧 INFO: Normal water level!");
    digitalWrite(BUZZER_PIN, LOW);
  }
}
