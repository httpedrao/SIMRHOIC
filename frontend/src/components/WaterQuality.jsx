const WaterQuality = ({ quality, timestamp }) => {
    const getPhStatus = (ph) => {
      if (ph < 6.5 || ph > 8.5) return "critical"
      if (ph < 7.0 || ph > 8.0) return "warning"
      return "good"
    }
  
    const getTempStatus = (temp) => {
      if (temp < 0 || temp > 35) return "critical"
      if (temp < 10 || temp > 30) return "warning"
      return "good"
    }
  
    const getTurbidityStatus = (turbidity) => {
      if (turbidity > 10) return "critical"
      if (turbidity > 5) return "warning"
      return "good"
    }
  
    const getOxygenStatus = (oxygen) => {
      if (oxygen < 4) return "critical"
      if (oxygen < 6) return "warning"
      return "good"
    }
  
    const getStatusStyles = (status) => {
      const baseStyles = {
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "0.25rem 0.5rem",
        borderRadius: "4px",
      }
  
      switch (status) {
        case "good":
          return { ...baseStyles, background: "#c6f6d5", color: "#22543d" }
        case "warning":
          return { ...baseStyles, background: "#feebc8", color: "#744210" }
        case "critical":
          return { ...baseStyles, background: "#fed7d7", color: "#742a2a" }
        default:
          return baseStyles
      }
    }
  
    const cardStyles = {
      background: "white",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    }
  
    const metricsStyles = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.5rem",
      marginBottom: "1rem",
    }
  
    const metricStyles = {
      padding: "1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      background: "#f7fafc",
    }
  
    const headerStyles = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.75rem",
    }
  
    const labelStyles = {
      fontWeight: 600,
      color: "#4a5568",
      fontSize: "0.875rem",
    }
  
    const valueStyles = {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#2d3748",
      marginBottom: "0.25rem",
    }
  
    const rangeStyles = {
      fontSize: "0.75rem",
      color: "#718096",
    }
  
    return (
      <div style={cardStyles}>
        <h2 style={{ marginBottom: "1.5rem", color: "#2d3748", fontSize: "1.25rem" }}>Water Quality</h2>
        <div style={metricsStyles}>
          <div style={metricStyles}>
            <div style={headerStyles}>
              <span style={labelStyles}>pH Level</span>
              <span style={getStatusStyles(getPhStatus(quality.ph))}>{getPhStatus(quality.ph)}</span>
            </div>
            <div style={valueStyles}>{quality.ph.toFixed(2)}</div>
            <div style={rangeStyles}>Normal: 6.5 - 8.5</div>
          </div>
  
          <div style={metricStyles}>
            <div style={headerStyles}>
              <span style={labelStyles}>Temperature</span>
              <span style={getStatusStyles(getTempStatus(quality.temperature))}>
                {getTempStatus(quality.temperature)}
              </span>
            </div>
            <div style={valueStyles}>{quality.temperature.toFixed(1)}°C</div>
            <div style={rangeStyles}>Normal: 10 - 30°C</div>
          </div>
  
          <div style={metricStyles}>
            <div style={headerStyles}>
              <span style={labelStyles}>Turbidity</span>
              <span style={getStatusStyles(getTurbidityStatus(quality.turbidity))}>
                {getTurbidityStatus(quality.turbidity)}
              </span>
            </div>
            <div style={valueStyles}>{quality.turbidity.toFixed(2)} NTU</div>
            <div style={rangeStyles}>Good: {"<"} 5 NTU</div>
          </div>
  
          <div style={metricStyles}>
            <div style={headerStyles}>
              <span style={labelStyles}>Dissolved Oxygen</span>
              <span style={getStatusStyles(getOxygenStatus(quality.dissolved_oxygen))}>
                {getOxygenStatus(quality.dissolved_oxygen)}
              </span>
            </div>
            <div style={valueStyles}>{quality.dissolved_oxygen.toFixed(1)} mg/L</div>
            <div style={rangeStyles}>Good: {">"} 6 mg/L</div>
          </div>
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: "#718096",
            textAlign: "center",
            paddingTop: "1rem",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          Last updated: {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    )
  }
  
  export default WaterQuality
  