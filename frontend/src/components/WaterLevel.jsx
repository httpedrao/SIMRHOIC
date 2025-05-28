const WaterLevel = ({ level, timestamp }) => {
    const getStatusClass = (level) => {
      if (level < 20) return "critical"
      if (level < 40) return "low"
      if (level < 80) return "normal"
      return "high"
    }
  
    const getStatusText = (level) => {
      if (level < 20) return "Critical"
      if (level < 40) return "Low"
      if (level < 80) return "Normal"
      return "High"
    }
  
    const getStatusColor = (level) => {
      if (level < 20) return "#e53e3e"
      if (level < 40) return "#dd6b20"
      if (level < 80) return "#38a169"
      return "#3182ce"
    }
  
    const getFillGradient = (level) => {
      if (level < 20) return "linear-gradient(to top, #e53e3e, #fc8181)"
      if (level < 40) return "linear-gradient(to top, #dd6b20, #f6ad55)"
      if (level < 80) return "linear-gradient(to top, #38a169, #68d391)"
      return "linear-gradient(to top, #3182ce, #63b3ed)"
    }
  
    const cardStyles = {
      background: "white",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    }
  
    const displayStyles = {
      display: "flex",
      gap: "2rem",
      alignItems: "center",
    }
  
    const containerStyles = {
      position: "relative",
      width: "80px",
      height: "200px",
      background: "#f7fafc",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      overflow: "hidden",
    }
  
    const fillStyles = {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: `${Math.min(level, 100)}%`,
      background: getFillGradient(level),
      transition: "height 0.5s ease",
      borderRadius: "0 0 6px 6px",
    }
  
    const markersStyles = {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
    }
  
    const markerStyles = {
      position: "absolute",
      left: 0,
      right: 0,
      height: "1px",
      background: "#cbd5e0",
    }
  
    const infoStyles = {
      flex: 1,
    }
  
    return (
      <div style={cardStyles}>
        <h2 style={{ marginBottom: "1.5rem", color: "#2d3748", fontSize: "1.25rem" }}>Water Level</h2>
        <div style={displayStyles}>
          <div style={containerStyles}>
            <div style={fillStyles} />
            <div style={markersStyles}>
              {[100, 80, 60, 40, 20, 0].map((mark) => (
                <div key={mark} style={{ ...markerStyles, bottom: `${mark}%` }}>
                  <span
                    style={{
                      position: "absolute",
                      right: "-35px",
                      top: "-8px",
                      fontSize: "0.75rem",
                      color: "#718096",
                      background: "white",
                      padding: "0 4px",
                    }}
                  >
                    {mark}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={infoStyles}>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#2d3748", marginBottom: "0.5rem" }}>
              {level.toFixed(1)}%
            </div>
            <div
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: getStatusColor(level),
              }}
            >
              {getStatusText(level)}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#718096" }}>
              Last updated: {new Date(timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  export default WaterLevel
  