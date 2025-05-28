const ConnectionStatus = ({ isConnected }) => {
    const statusStyles = {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.875rem",
      fontWeight: 500,
      background: isConnected ? "rgba(72, 187, 120, 0.2)" : "rgba(229, 62, 62, 0.2)",
      color: isConnected ? "#22543d" : "#742a2a",
    }
  
    const indicatorStyles = {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: isConnected ? "#48bb78" : "#e53e3e",
      animation: "pulse 2s infinite",
    }
  
    return (
      <div style={statusStyles}>
        <div style={indicatorStyles} />
        <span>{isConnected ? "Connected to MQTT" : "Disconnected"}</span>
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }
  
  export default ConnectionStatus
  