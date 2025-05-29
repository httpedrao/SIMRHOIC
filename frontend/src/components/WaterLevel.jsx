import "./WaterLevel.scss"

const WaterLevel = ({ level, timestamp }) => {
    const getStatusClass = (level) => {
      if (level < 20) return "critical"
      if (level < 40) return "low"
      if (level < 80) return "normal"
      return "high"
    }
  
    const getStatusText = (level) => {
      if (level < 20) return "Crítico"
      if (level < 40) return "Baixo"
      if (level < 80) return "Normal"
      return "Alto"
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
  
    const statusClass = getStatusClass(level)
  
    return (
      <div className="water-level">
        <h2 className="water-level__title">Nível da Água</h2>
        <div className="water-level__display">
          <div className="water-level__container">
            <div 
              className={`water-level__fill water-level__fill--${statusClass}`} 
              style={{ height: `${Math.min(level, 100)}%` }} 
            />
            <div className="water-level__markers">
              {[100, 80, 60, 40, 20, 0].map((mark) => (
                <div key={mark} className="water-level__marker" style={{ bottom: `${mark}%` }}>
                  <span className="water-level__marker-label">
                    {mark}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="water-level__info">
            <div className="water-level__value">
              {level.toFixed(1)}%
            </div>
            <div className={`water-level__status water-level__status--${statusClass}`}>
              {getStatusText(level)}
            </div>
            <div className="water-level__timestamp">
              Última atualização: {new Date(timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  export default WaterLevel
  