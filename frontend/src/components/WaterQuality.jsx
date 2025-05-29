import "./WaterQuality.scss"

const WaterQuality = ({ quality, timestamp }) => {
    const getPhStatus = (ph) => {
      if (ph < 6.5 || ph > 8.5) return "critical"
      if (ph < 7.0 || ph > 8.0) return "warning"
      return "good"
    }
  
    const getPhStatusText = (ph) => {
      if (ph < 6.5 || ph > 8.5) return "crítico"
      if (ph < 7.0 || ph > 8.0) return "atenção"
      return "bom"
    }

    const getTurbidityStatus = (turbidity) => {
      if (turbidity > 10) return "critical"
      if (turbidity > 5) return "warning"
      return "good"
    }
  
    const getTurbidityStatusText = (turbidity) => {
      if (turbidity > 10) return "crítico"
      if (turbidity > 5) return "atenção"
      return "bom"
    }
  
    return (
      <div className="water-quality">
        <h2 className="water-quality__title">Qualidade da Água</h2>
        <div className="water-quality__metrics">
          <div className="water-quality__metric">
            <div className="water-quality__metric-header">
              <span className="water-quality__metric-label">Nível de pH</span>
              <span className={`water-quality__status water-quality__status--${getPhStatus(quality.ph)}`}>
                {getPhStatusText(quality.ph)}
              </span>
            </div>
            <div className="water-quality__metric-value">{quality.ph.toFixed(2)}</div>
            <div className="water-quality__metric-range">Normal: 6,5 - 8,5</div>
          </div>
  
          <div className="water-quality__metric">
            <div className="water-quality__metric-header">
              <span className="water-quality__metric-label">Turbidez</span>
              <span className={`water-quality__status water-quality__status--${getTurbidityStatus(quality.turbidity)}`}>
                {getTurbidityStatusText(quality.turbidity)}
              </span>
            </div>
            <div className="water-quality__metric-value">{quality.turbidity.toFixed(2)} NTU</div>
            <div className="water-quality__metric-range">Bom: {"<"} 5 NTU</div>
          </div>
  
        </div>
        <div className="water-quality__timestamp">
          Última atualização: {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    )
  }
  
  export default WaterQuality
  