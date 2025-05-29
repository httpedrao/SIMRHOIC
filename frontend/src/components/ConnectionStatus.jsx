import "./ConnectionStatus.scss"

const ConnectionStatus = ({ isConnected }) => {
    return (
      <div className={`connection-status ${isConnected ? 'connection-status--connected' : 'connection-status--disconnected'}`}>
        <div className="connection-status__indicator" />
        <span className="connection-status__text">
          {isConnected ? "Conectado ao MQTT" : "Desconectado"}
        </span>
      </div>
    )
  }
  
  export default ConnectionStatus
  