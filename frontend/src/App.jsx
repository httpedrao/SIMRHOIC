"use client"

import { useState, useEffect } from "react"
import mqtt from "mqtt"
import WaterLevel from "./components/WaterLevel"
import WaterQuality from "./components/WaterQuality"
import ConnectionStatus from "./components/ConnectionStatus"
import "./App.scss"

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sistema de Monitoramento de Água</h1>
        <ConnectionStatus isConnected={isConnected} />
      </header>

      <main className="app-main">
        <div className="monitoring-grid">
          <WaterLevel level={waterData.level} timestamp={waterData.timestamp} />
          <WaterQuality quality={waterData.quality} timestamp={waterData.timestamp} />

          {/* Sensor Data Panel */}
          <div className="sensor-panel">
            <h3 className="sensor-panel__title">
              🔋 Leituras dos Sensores
            </h3>
            <div className="sensor-panel__grid">
              <div className="sensor-item">
                <span className="sensor-item__label">Tensão da Bateria:</span>
                <span className="sensor-item__value">
                  {sensorData.battery ? `${sensorData.battery.value}V` : "Sem dados"}
                </span>
              </div>
              <div className="sensor-item">
                <span className="sensor-item__label">Nível da Água:</span>
                <span className="sensor-item__value">
                  {sensorData.level ? `${sensorData.level.value} cm` : "Sem dados"}
                </span>
              </div>
              {sensorData.lastUpdated && (
                <div className="sensor-panel__last-updated">
                  Última atualização: {new Date(sensorData.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="messages-section">
          <h2>📨 Mensagens MQTT Recentes ({messages.length}/100)</h2>
          <div className="messages-container">
            {messages.length === 0 ? (
              <p className="no-messages">Nenhuma mensagem recebida ainda...</p>
            ) : (
              <>
                <div className="message-header">
                  <span>Tópico</span>
                  <span>Valor</span>
                  <span className="message-header__size">Tamanho</span>
                  <span>Hora</span>
                </div>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`message-item ${index % 2 === 0 ? 'message-item--even' : ''}`}
                  >
                    <span className="message-item__topic">
                      {msg.topic}
                    </span>
                    <span className="message-item__content">
                      {msg.message}
                    </span>
                    <span className="message-item__size">
                      {msg.size || 0}B
                    </span>
                    <span className="message-item__time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* LocalStorage Management */}
        <section className="messages-section">
          <div className="storage-header">
            <h2>💾 Armazenamento de Dados e Mensagens</h2>
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
              className="clear-storage-btn"
            >
              Limpar Armazenamento
            </button>
          </div>
          <div className="storage-status">
            <div className="storage-status__text">
              <strong>Status do Armazenamento:</strong> {Object.keys(localStorage).filter(key => key.startsWith('mqtt_')).length} itens armazenados |
              Atualização automática a cada 5 segundos |
              Máximo de 1000 mensagens no log
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
