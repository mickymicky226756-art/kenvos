export default function BottomNav() {
  return (
    <div className="bottom-nav" id="bottomNav">
      <div className="nav-item active" onClick={(event) => { switchView('home'); }} id="nav-home">
        <i className="fa-solid fa-house"></i>
        <span data-lang="navHome">Home</span>
      </div>
      <div className="nav-item" onClick={(event) => { switchView('invite'); }} id="nav-invite">
        <i className="fa-solid fa-share-nodes"></i>
        <span data-lang="navInvite">Invite</span>
      </div>
      <div className="nav-item" onClick={(event) => { switchView('team'); }} id="nav-team">
        <i className="fa-solid fa-users"></i>
        <span data-lang="navTeam">Team</span>
      </div>
      <div className="nav-item" onClick={(event) => { switchView('profile'); }} id="nav-profile">
        <i className="fa-solid fa-circle-user"></i>
        <span data-lang="navProfile">Me</span>
      </div>
    </div>
  );
}
