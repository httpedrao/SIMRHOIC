# 🌱 Intelligent Monitoring System for Water Reservoirs

![{C9753D52-59B6-41E0-8394-ACBF474CB4D8}](https://github.com/user-attachments/assets/7f169872-ac31-4ca3-85df-dab82b38cd3b)

## 📄 Abstract

This project proposes the development of an Intelligent Monitoring System for Water Reservoirs to promote sustainable water management in rural communities. Using IoT technologies, the system monitors in real-time the water levels, quality, and potential leaks in reservoirs, sending data to an accessible platform via an app or web dashboard. Automatic alerts will be generated in critical situations such as water scarcity or contamination. The system will be powered by solar energy, ensuring autonomous operation. The goal is to optimize water usage, reduce waste, and ensure water security, promoting sustainable practices in rural areas.

---

## 🔧 Hardware Used

- 🧠 **ESP32** (Wi-Fi microcontroller)
- 📏 **HC-SR04** Ultrasonic Sensor (for water level)
- ⚡ **Potentiometers** (simulate TDS/pH and battery level)
- 🔔 **Piezo Buzzer** (audible alerts)
- ☀️ (Simulated) Solar panel and battery system

---

## 🧰 Software Stack

- **Wokwi online simulator**
- **Microcontroller code**: C++ / Arduino
- **MQTT Protocol**: HiveMQ broker (via Wi-Fi)
- **Visualization**: MQTT Dashboard

---

## 🚀 Features

- Real-time water level monitoring via ultrasonic sensor
- Simulated TDS (water quality) and battery voltage readings
- Alerts for low battery, water contamination, or low water level
- MQTT data publishing for remote dashboards or logging (try on https://www.hivemq.com/demos/websocket-client/)



