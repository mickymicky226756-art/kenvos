export default function InviteView() {
  return (
    <section id="view-invite" className="view-section animate-up" style={{ paddingTop: "0", background: "var(--primary-color)" }}>
      <div className="share-page">
        <div className="share-topbar">Share</div>
        {/* QR Code Card */}
        <div className="share-card">
          <div className="share-qr-label">My QR code</div>
          <div className="share-qr-wrap">
            <img id="inviteQrImg" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.agrochem.com" alt="QR Code" />
          </div>
        </div>
        {/* Link + Code Card */}
        <div className="share-card">
          <div className="share-copy-row">
            <span className="share-text" id="inviteLinkText">https://www.agrochem.com</span>
            {" "}
            <button className="share-copy-btn" onClick={(event) => { copyRefLink(); }}>Copy</button>
          </div>
          <div className="share-copy-row code">
            <span className="share-text" id="inviteCodeText">CSK08Y</span>
            {" "}
            <button className="share-copy-btn" onClick={(event) => { copyInviteCode(); }}>Copy</button>
          </div>
        </div>
        {/* Commission Levels */}
        <div className="share-level-card">Level 1 commission = 25%</div>
        <div className="share-level-card">Level 2 commission = 3%</div>
        <div className="share-level-card">Level 3 commission = 2%</div>
        {/* Info Cards */}
        <div className="share-info-card">The first step to earning money is sharing this link with your friends. Invite more, earn more!</div>
        <div className="share-info-card">Invite more members to join and earn generous rewards.</div>
      </div>
    </section>
  );
}
