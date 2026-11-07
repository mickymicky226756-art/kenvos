export default function HomeView() {
  return (
    <section id="view-home" className="view-section active-view animate-up" style={{ paddingTop: "0" }}>
      <div style={{ display: "none" }}>
        <span id="displayBalance">0.00</span>
        {" "}
        <span id="displayIncome">0.00</span>
      </div>
      <div className="home-wrap">
        {/* Hero Banner with picture */}
        <div className="hero-banner">
          <div className="hero-banner-bg"></div>
          <img id="heroImage" className="hero-banner-video" src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1080&q=80" alt="Kenvos" />
          <div className="hero-banner-overlay"></div>
          <div className="hero-content">
            <div className="hero-title">Kenvos</div>
            <div className="hero-sub">
              Innovating Agriculture
              <br />
              Kenvos Solutions
            </div>
          </div>
        </div>
        {/* Quick Action Row (4 items) */}
        <div className="quick-row">
          <div className="action-item" onClick={(event) => { switchView('deposit'); }}>
            <div className="icon-circle">
              <i className="fa-solid fa-circle-plus"></i>
            </div>
            <span>Recharge</span>
          </div>
          <div className="action-item" onClick={(event) => { switchView('withdraw'); }}>
            <div className="icon-circle">
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
            <span>Withdraw</span>
          </div>
          <div className="action-item" onClick={(event) => { openTg('channel'); }}>
            <div className="icon-circle">
              <i className="fa-solid fa-paper-plane"></i>
            </div>
            <span>Channel</span>
          </div>
          <div className="action-item" onClick={(event) => { openTg('service'); }}>
            <div className="icon-circle">
              <i className="fa-solid fa-headset"></i>
            </div>
            <span>Service</span>
          </div>
        </div>
        {/* Tab Switcher */}
        <div className="tab-row">
          <div className="tab-pill active" onClick={(event) => { switchTab('natural', event.currentTarget); }}>Standard</div>
          <div className="tab-pill" onClick={(event) => { switchTab('vip', event.currentTarget); }}>VIP</div>
        </div>
        {/* Product Grid (rendered from DB) */}
        <div className="product-grid" id="homePlanList">
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)" }}>Loading plans...</p>
        </div>
      </div>
    </section>
  );
}
