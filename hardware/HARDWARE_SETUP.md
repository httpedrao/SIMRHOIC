# Hardware Setup Guide

## Overview
This project simulates a water monitoring system using an ESP32 microcontroller with potentiometers to simulate various sensors.

## Hardware Components

### Required Components
- **ESP32 Development Board** (main microcontroller)
- **4x Potentiometers** (10kΩ recommended)
- **1x Buzzer** (active or passive)
- **Breadboard and jumper wires**
- **Power supply** (USB or external)

## Pin Configuration

### ESP32 Pin Assignments
```
Pin 19  → Buzzer (positive terminal)
Pin 34  → TDS Sensor Potentiometer (center pin)
Pin 32  → pH Sensor Potentiometer (center pin)
Pin 33  → Water Level Potentiometer (center pin)
Pin 35  → Battery Voltage Potentiometer (center pin)
GND     → All potentiometer outer pins (one side) + Buzzer ground
3.3V    → All potentiometer outer pins (other side)
```

## Sensor Simulation Details

### 🔋 Battery Voltage Sensor (Pin 35)
- **Range**: 3.0V - 6.0V
- **Purpose**: Monitors system battery level
- **Alert**: Triggers when below 3.0V
- **Potentiometer Position**: 
  - Fully CCW = 3.0V (low battery)
  - Fully CW = 6.0V (full battery)

### 💧 Water Level Sensor (Pin 33)
- **Range**: 5 - 50 cm
- **Purpose**: Measures distance to water surface
- **Alert**: Triggers when above 30 cm (low water)
- **Potentiometer Position**:
  - Fully CCW = 5 cm (high water level)
  - Fully CW = 50 cm (low water level)

### 🧪 TDS Sensor (Pin 34)
- **Range**: 0 - 1000 ppm
- **Purpose**: Measures Total Dissolved Solids in water
- **Alert**: Triggers when above 700 ppm (contamination)
- **Potentiometer Position**:
  - Fully CCW = 0 ppm (pure water)
  - Fully CW = 1000 ppm (high contamination)

### ⚗️ pH Sensor (Pin 32)
- **Range**: 4.0 - 10.0 pH
- **Purpose**: Measures water acidity/alkalinity
- **Alert**: Triggers when below 6.0 or above 8.5
- **Potentiometer Position**:
  - Fully CCW = 4.0 pH (acidic)
  - Center = 7.0 pH (neutral)
  - Fully CW = 10.0 pH (alkaline)

### 🔊 Buzzer (Pin 19)
- **Purpose**: Audio alerts for various conditions
- **Alert Tones**:
  - 1000 Hz (100ms) = Low battery
  - 523 Hz (200ms) = High TDS
  - 659 Hz (150ms) = pH out of range
  - 262 Hz (100ms) = Low water level

## Wiring Diagram

```
ESP32                    Potentiometers               Buzzer
                        (All 10kΩ)
Pin 35 ←→ Battery Pot (center pin)
Pin 34 ←→ TDS Pot (center pin)
Pin 32 ←→ pH Pot (center pin)
Pin 33 ←→ Water Level Pot (center pin)
Pin 19 ←→ Buzzer (+)

3.3V ←→ All Pot outer pins (one side)
GND  ←→ All Pot outer pins (other side) + Buzzer (-)
```

## Software Configuration

### ADC Settings
- **Resolution**: 12-bit (0-4095 values)
- **Reference Voltage**: 3.3V
- **Sampling**: Every 2 seconds

### MQTT Topics Published
- `simrhoic/water/battery` - Battery voltage (V)
- `simrhoic/water/level` - Water level distance (cm)
- `simrhoic/water/tds` - TDS value (ppm)
- `simrhoic/water/ph` - pH value (4.0-10.0)

## Testing Scenarios

### Normal Operation
- Battery: 4.0-6.0V (mid to high position)
- Water Level: 5-30 cm (low to mid position)
- TDS: 0-700 ppm (low to mid position)
- pH: 6.0-8.5 (slightly left of center to slightly right)

### Alert Testing
1. **Low Battery**: Turn battery pot fully CCW
2. **High TDS**: Turn TDS pot to high position (>700)
3. **pH Alert**: Turn pH pot fully CCW or CW
4. **Low Water**: Turn water level pot to high position (>30cm)

## Troubleshooting

### No Sensor Readings
- Check potentiometer connections
- Verify 3.3V and GND connections
- Ensure center pins are connected to correct ESP32 pins

### Erratic Readings
- Check for loose connections
- Verify potentiometer quality
- Add small capacitors (0.1µF) between sensor pins and GND if needed

### No MQTT Data
- Check WiFi connection
- Verify MQTT broker credentials
- Check serial monitor for connection status

### No Buzzer Sound
- Verify buzzer polarity
- Check Pin 19 connection
- Test with a simple tone() function

## Wokwi Simulation

For online simulation, use [Wokwi](https://wokwi.com) with the following components:
- ESP32 DevKit V1
- 4x Potentiometers
- 1x Buzzer
- Connecting wires

The simulation will work identically to physical hardware, allowing you to test all sensor ranges and alert conditions. 