export default function Header({ activeLabel, currentTime, onNewReservation }) {
  return <header className="workspace-header">
    <div className="header-breadcrumbs"><span>PORTAL</span><i>/</i><strong>{activeLabel.toUpperCase()}</strong></div>
    <div className="header-status-group"><span className="system-pill"><i />SYSTEM ONLINE</span><time className="time-pill">{currentTime}</time><button className="quick-action-btn" type="button" onClick={onNewReservation}>+ New Reservation</button></div>
  </header>;
}
