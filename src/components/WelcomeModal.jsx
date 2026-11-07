export default function WelcomeModal() {
  return (
    <div id="welcomeModal" className="modal" style={{ display: "none", zIndex: "9999" }} role="dialog" aria-modal="true" aria-labelledby="welcomeTitle">
      <div className="modal-content">
        <div className="welcome-topbar">
          <span className="welcome-brand">KENVOS INVESTMENT</span>
          <button type="button" className="welcome-close-x" onClick={(event) => { closeWelcomeModal(); }} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="welcome-hero">
          <span className="welcome-badge">Welcome aboard</span>
          <div className="welcome-title">
            {"Hello, "}
            <span className="welcome-name" id="welcomeName">Investor</span>
            {"!"}
          </div>
          <div className="welcome-sub">
            Glad to have you on Kenvos Invest.
            <br />
            Here's your product plan table — review and choose the right plan for you.
          </div>
        </div>
        <div className="welcome-img-wrap">
          <div className="welcome-img-caption">Product Plan Table</div>
          <div className="welcome-img-frame">
            <img id="welcomePlanImg" src="1234.png" alt="Investment Plan Table" onError={(event) => { tryPlanTableFallback(event.currentTarget); }} />
          </div>
        </div>
        <div className="welcome-body">
          <div className="welcome-perks">
            <span>Daily ROI</span>
            <span>Secure</span>
            <span>Auto Credit</span>
          </div>
        </div>
        <div className="welcome-actions">
          <a id="welcomeJoinBtn" className="welcome-join-btn" href="https://t.me/AgroChemGroup" target="_blank" rel="noopener" onClick={(event) => { closeWelcomeModal(); }}>
            {" "}
            <i className="fa-brands fa-telegram"></i>
            {" Join the Group "}
          </a>
          {" "}
          <button type="button" className="welcome-continue-btn" onClick={(event) => { closeWelcomeModal(); }}>
            {" Continue to Home "}
            <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.85rem" }}></i>
          </button>
        </div>
      </div>
    </div>
  );
}
