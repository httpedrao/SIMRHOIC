"use client"

import { useState, useEffect } from "react"
import mqtt from "mqtt"
import WaterLevel from "./components/WaterLevel"
import WaterQuality from "./components/WaterQuality"
import ConnectionStatus from "./components/ConnectionStatus"

function App() {
  const [client, setClient] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [waterData, setWaterData] = useState({
    level: 0,
    quality: {
      ph: 7.0,
      temperature: 20,
      turbidity: 0,
      dissolved_oxygen: 8.0,
    },
    timestamp: new Date().toISOString(),
  })
  const [messages, setMessages] = useState([])
  const [sensorData, setSensorData] = useState({
    battery: null,
    level: null,
    tds: null,
    ph: null,
    lastUpdated: null
  })

  // Local Storage Helper Functions
  const saveToLocalStorage = (topic, value, timestamp) => {
    try {
      const storageKey = `mqtt_${topic.replace(/\//g, '_')}`
      const data = {
        value: value,
        timestamp: timestamp,
        topic: topic
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
      
      // Also save to a general log
      const logKey = 'mqtt_message_log'
      const existingLog = JSON.parse(localStorage.getItem(logKey) || '[]')
      existingLog.unshift(data)
      // Keep only last 1000 messages
      const trimmedLog = existingLog.slice(0, 1000)
      localStorage.setItem(logKey, JSON.stringify(trimmedLog))
      
      console.log(`💾 Saved to localStorage: ${topic} = ${value}`)
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const battery = localStorage.getItem('mqtt_simrhoic_water_battery')
      const level = localStorage.getItem('mqtt_simrhoic_water_level')
      const tds = localStorage.getItem('mqtt_simrhoic_water_tds')
      const ph = localStorage.getItem('mqtt_simrhoic_water_ph')
      
      const data = {
        battery: battery ? JSON.parse(battery) : null,
        level: level ? JSON.parse(level) : null,
        tds: tds ? JSON.parse(tds) : null,
        ph: ph ? JSON.parse(ph) : null,
        lastUpdated: new Date().toISOString()
      }
      
      setSensorData(data)
      
      // Update waterData for UI components
      if (data.level) {
        setWaterData(prev => ({
          ...prev,
          level: parseFloat(data.level.value),
          timestamp: data.level.timestamp
        }))
      }
      
      console.log('📂 Loaded data from localStorage:', data)
      return data
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error)
      return null
    }
  }

  // MQTT connection configuration
  const mqttConfig = {
    host: "1fdc695c8afb4de39adb9ca0d6d09980.s1.eu.hivemq.cloud:8884/mqtt",
    port: 8884, // WebSocket Secure port for HiveMQ Cloud
    protocol: "wss", // Secure WebSocket for HiveMQ Cloud
    clientId: `water_monitor_${Math.random().toString(16).substr(2, 8)}`,
    username: "simrhoic",
    password: "ADSMack5",
  }

  // Load data from localStorage on component mount
  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  // Periodic refresh from localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Refreshing data from localStorage...")
      loadFromLocalStorage()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Connect to MQTT broker
    const mqttClient = mqtt.connect(`${mqttConfig.protocol}://${mqttConfig.host}`, {
      clientId: mqttConfig.clientId,
      username: mqttConfig.username,
      password: mqttConfig.password,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    })

    mqttClient.on("connect", () => {
      console.log("✅ Connected to HiveMQ Cloud MQTT broker")
      console.log("🔗 Broker:", mqttConfig.host)
      console.log("👤 Client ID:", mqttConfig.clientId)
      setIsConnected(true)

      // Subscribe to simrhoic water monitoring topics
      mqttClient.subscribe("simrhoic/water/#", (err) => {
        if (err) {
          console.error("❌ Failed to subscribe to simrhoic/water/#:", err)
        } else {
          console.log("📡 Subscribed to simrhoic/water/#")
        }
      })

      // Subscribe to all topics for debugging (optional)
      mqttClient.subscribe("#", (err) => {
        if (err) {
          console.error("❌ Failed to subscribe to all topics:", err)
        } else {
          console.log("🔍 Subscribed to all topics (#) for debugging")
        }
      })
    })

    mqttClient.on("message", (topic, message) => {
      const messageStr = message.toString()
      const timestamp = new Date().toISOString()
      const messageSize = message.length

      // Enhanced logging with emojis and formatting
      console.log(`📨 [${new Date().toLocaleTimeString()}] Topic: ${topic}`)
      console.log(`📄 Message: ${messageStr}`)
      console.log(`📏 Size: ${messageSize} bytes`)
      console.log("─".repeat(50))

      // Add to messages log with enhanced information
      setMessages((prev) => [
        { 
          topic, 
          message: messageStr, 
          timestamp,
          size: messageSize,
          id: Math.random().toString(36).substr(2, 9)
        },
        ...prev.slice(0, 99), // Keep last 100 messages
      ])

      // Save all messages to localStorage
      saveToLocalStorage(topic, messageStr, timestamp)

      // Handle simrhoic/water/* topics specifically
      if (topic.startsWith("simrhoic/water/")) {
        const sensorType = topic.split("/")[2] // battery, level, or tds
        const numValue = parseFloat(messageStr)
        
        if (!isNaN(numValue)) {
          console.log(`🔢 Parsed ${sensorType}: ${numValue}`)
          
          // Update sensor data state
          setSensorData(prev => ({
            ...prev,
            [sensorType]: {
              value: numValue,
              timestamp: timestamp,
              topic: topic
            },
            lastUpdated: timestamp
          }))
          
          // Update waterData for UI components based on sensor type
          if (sensorType === "level") {
            setWaterData((prev) => ({
              ...prev,
              level: numValue,
              timestamp,
            }))
          } else if (sensorType === "tds") {
            // Map TDS to water quality (you can adjust this mapping)
            setWaterData((prev) => ({
              ...prev,
              quality: {
                ...prev.quality,
                turbidity: numValue, // TDS can be related to turbidity
              },
              timestamp,
            }))
          } else if (sensorType === "ph") {
            // Map pH to water quality
            setWaterData((prev) => ({
              ...prev,
              quality: {
                ...prev.quality,
                ph: numValue,
              },
              timestamp,
            }))
          } else if (sensorType === "battery") {
            // You might want to display battery info somewhere in the UI
            console.log(`🔋 Battery voltage: ${numValue}V`)
          }
        }
      } else {
        // Handle other topic formats (legacy support)
        try {
          const data = JSON.parse(messageStr)
          console.log("✅ Parsed JSON data:", data)

          if (topic === "water/level") {
            setWaterData((prev) => ({
              ...prev,
              level: data.level || data,
              timestamp,
            }))
          } else if (topic.startsWith("water/quality/")) {
            const qualityType = topic.split("/")[2]
            setWaterData((prev) => ({
              ...prev,
              quality: {
                ...prev.quality,
                [qualityType]: data.value || data,
              },
              timestamp,
            }))
          }
        } catch (error) {
          // If not JSON, treat as plain text/number
          console.log("📝 Plain text/number data:", messageStr)
          
          const numValue = parseFloat(messageStr)
          if (!isNaN(numValue)) {
            console.log("🔢 Parsed as number:", numValue)
            
            if (topic === "water/level") {
              setWaterData((prev) => ({
                ...prev,
                level: numValue,
                timestamp,
              }))
            } else if (topic.startsWith("water/quality/")) {
              const qualityType = topic.split("/")[2]
              setWaterData((prev) => ({
                ...prev,
                quality: {
                  ...prev.quality,
                  [qualityType]: numValue,
                },
                timestamp,
              }))
            }
          }
        }
      }
    })

    mqttClient.on("error", (error) => {
      console.error("❌ MQTT connection error:", error)
      console.error("🔧 Check your network connection and broker credentials")
      setIsConnected(false)
    })

    mqttClient.on("close", () => {
      console.log("🔌 MQTT connection closed")
      setIsConnected(false)
    })

    mqttClient.on("reconnect", () => {
      console.log("🔄 Attempting to reconnect to MQTT broker...")
    })

    mqttClient.on("offline", () => {
      console.log("📴 MQTT client is offline")
      setIsConnected(false)
    })

    setClient(mqttClient)

    return () => {
      if (mqttClient) {
        mqttClient.end()
      }
    }
  }, [])

  const appStyles = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    backgroundColor: "#f5f7fa",
    color: "#333",
    margin: 0,
    padding: 0,
  }

  const headerStyles = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "1.5rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  }

  const mainStyles = {
    flex: 1,
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  }

  const gridStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "2rem",
    marginBottom: "2rem",
  }

  const messagesSectionStyles = {
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  }

  const messagesContainerStyles = {
    maxHeight: "300px",
    overflowY: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.5rem",
  }

  const messageItemStyles = {
    display: "grid",
    gridTemplateColumns: "150px 1fr 80px auto",
    gap: "1rem",
    padding: "0.75rem",
    borderBottom: "1px solid #f7fafc",
    fontSize: "0.875rem",
  }

  const noMessagesStyles = {
    textAlign: "center",
    color: "#718096",
    padding: "2rem",
    fontStyle: "italic",
  }

  return (
    <div style={appStyles}>
      <header style={headerStyles}>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0 }}>Water Monitoring System</h1>
        <ConnectionStatus isConnected={isConnected} />
      </header>

      <main style={mainStyles}>
        <div style={gridStyles}>
          <WaterLevel level={waterData.level} timestamp={waterData.timestamp} />
          <WaterQuality quality={waterData.quality} timestamp={waterData.timestamp} />
          
          {/* Sensor Data Panel */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          }}>
            <h3 style={{ marginBottom: "1rem", color: "#2d3748", fontSize: "1.25rem" }}>
              🔋 Sensor Readings
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "#f7fafc", borderRadius: "8px" }}>
                <span style={{ fontWeight: 600, color: "#4a5568" }}>Battery Voltage:</span>
                <span style={{ color: "#2d3748", fontFamily: "Courier New, monospace" }}>
                  {sensorData.battery ? `${sensorData.battery.value}V` : "No data"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "#f7fafc", borderRadius: "8px" }}>
                <span style={{ fontWeight: 600, color: "#4a5568" }}>Water Level:</span>
                <span style={{ color: "#2d3748", fontFamily: "Courier New, monospace" }}>
                  {sensorData.level ? `${sensorData.level.value} cm` : "No data"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "#f7fafc", borderRadius: "8px" }}>
                <span style={{ fontWeight: 600, color: "#4a5568" }}>TDS Value:</span>
                <span style={{ color: "#2d3748", fontFamily: "Courier New, monospace" }}>
                  {sensorData.tds ? `${sensorData.tds.value} ppm` : "No data"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "#f7fafc", borderRadius: "8px" }}>
                <span style={{ fontWeight: 600, color: "#4a5568" }}>pH Value:</span>
                <span style={{ color: "#2d3748", fontFamily: "Courier New, monospace" }}>
                  {sensorData.ph ? `${parseFloat(sensorData.ph.value).toFixed(2)}` : "No data"}
                </span>
              </div>
              {sensorData.lastUpdated && (
                <div style={{ textAlign: "center", fontSize: "0.875rem", color: "#718096", marginTop: "0.5rem" }}>
                  Last updated: {new Date(sensorData.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LocalStorage Management */}
        <section style={messagesSectionStyles}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "#2d3748", fontSize: "1.25rem", margin: 0 }}>
              💾 Data Storage & Messages
            </h2>
            <button
              onClick={() => {
                localStorage.clear()
                setSensorData({
                  battery: null,
                  level: null,
                  tds: null,
                  ph: null,
                  lastUpdated: null
                })
                setMessages([])
                console.log("🗑️ Cleared all localStorage data")
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#e53e3e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Clear Storage
            </button>
          </div>
          <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f7fafc", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.875rem", color: "#4a5568" }}>
              <strong>Storage Status:</strong> {Object.keys(localStorage).filter(key => key.startsWith('mqtt_')).length} stored items | 
              Auto-refresh every 5 seconds | 
              Max 1000 messages in log
            </div>
          </div>
        </section>

        <section style={messagesSectionStyles}>
          <h2 style={{ marginBottom: "1rem", color: "#2d3748", fontSize: "1.25rem" }}>
            📨 Recent MQTT Messages ({messages.length}/100)
          </h2>
          <div style={messagesContainerStyles}>
            {messages.length === 0 ? (
              <p style={noMessagesStyles}>No messages received yet...</p>
            ) : (
              <>
                <div style={{
                  ...messageItemStyles,
                  backgroundColor: "#e2e8f0",
                  fontWeight: "bold",
                  borderBottom: "2px solid #cbd5e0",
                  position: "sticky",
                  top: 0,
                  zIndex: 1
                }}>
                  <span>Topic</span>
                  <span>Message</span>
                  <span style={{ textAlign: "center" }}>Size</span>
                  <span>Time</span>
                </div>
                {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  style={{
                    ...messageItemStyles,
                    borderBottom: index === messages.length - 1 ? "none" : "1px solid #f7fafc",
                    backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#4a5568", fontFamily: "Courier New, monospace" }}>
                    {msg.topic}
                  </span>
                  <span style={{ color: "#2d3748", wordBreak: "break-word", fontFamily: "Courier New, monospace" }}>
                    {msg.message}
                  </span>
                  <span style={{ color: "#718096", fontSize: "0.75rem", textAlign: "center" }}>
                    {msg.size || 0}B
                  </span>
                  <span style={{ color: "#718096", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
