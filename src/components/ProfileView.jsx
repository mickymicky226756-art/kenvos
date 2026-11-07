export default function ProfileView() {
  return (
    <section id="view-profile" className="view-section animate-up" style={{ paddingTop: "0" }}>
      <div className="profile-page">
        {/* Hero Header: brand, phone + VIP level */}
        <div className="profile-hero">
          <div className="profile-brand">
            <i className="fa-solid fa-leaf profile-brand-leaf"></i>
            <span className="profile-brand-name">KENVOS</span>
            <span className="profile-brand-sub">INVESTMENT</span>
          </div>
          <div className="profile-id">
            <div className="profile-avatar">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="profile-id-text">
              <div className="profile-phone" id="profilePhone">9898989898</div>
              <div className="profile-vip-badge">VIP 0</div>
            </div>
          </div>
        </div>
        {/* Stats Card: total on top, income + recharge below */}
        <div className="profile-stats">
          <div className="profile-stat-cell profile-stat-main">
            <div className="stat-lbl">Total</div>
            <div className="stat-val" id="profTotalText">0.00 ETB</div>
          </div>
          <div className="profile-stat-cell">
            <div className="stat-lbl">Income</div>
            <div className="stat-val" id="profIncomeText">0.00 ETB</div>
          </div>
          <div className="profile-stat-cell">
            <div className="stat-lbl">Recharge</div>
            <div className="stat-val" id="profRechargeText">0.00 ETB</div>
          </div>
        </div>
        {/* Menu List */}
        <div className="profile-menu">
          <div className="profile-menu-item" onClick={(event) => { downloadApp(); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Download App</div>
              <div className="menu-sub">Get the mobile app</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('transactions'); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-list-ul"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Finance Records</div>
              <div className="menu-sub">View all transactions</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('orders'); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-cube"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">My Plans</div>
              <div className="menu-sub">{"Active & completed investments"}</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('bankcard'); }}>
            <div className="profile-menu-icon">
              <i className="fa-regular fa-credit-card"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Bank Information</div>
              <div className="menu-sub">Manage bank details</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('info'); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-building"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Company Info</div>
              <div className="menu-sub">{"Notices & announcements"}</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('tasks'); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Tasks</div>
              <div className="menu-sub">Complete missions for rewards</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('team-salary'); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-sack-dollar"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Daily Team Salary</div>
              <div className="menu-sub">Earn from your invited investors</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
          <div className="profile-menu-item" onClick={(event) => { switchView('changepass'); }}>
            <div className="profile-menu-icon">
              <i className="fa-solid fa-gear"></i>
            </div>
            <div className="profile-menu-text">
              <div className="menu-title">Settings</div>
              <div className="menu-sub">{"Security & passwords"}</div>
            </div>
            <i className="fa-solid fa-chevron-right profile-menu-chevron"></i>
          </div>
        </div>
        {/* Logout Button */}
        <button className="profile-logout" onClick={(event) => { window.location.reload(); }}>Logout</button>
      </div>
    </section>
  );
}
