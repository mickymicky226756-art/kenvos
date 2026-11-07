export default function InfoView() {
  return (
    <section id="view-info" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('home'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>About Kenvos</h2>
        <p>Smart agricultural investment platform.</p>
      </div>
      <div className="content-box">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <i className="fa-solid fa-flask" style={{ fontSize: "4rem", color: "var(--primary-color)", marginBottom: "15px" }}></i>
          <h3 style={{ color: "var(--primary-dark)", fontWeight: "800", marginBottom: "10px" }}>Kenvos Invest</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>Your gateway to the booming agrochemical industry. Invest in fertilizer production, bio-pesticides, seed technology, and soil health programs. Earn daily returns backed by real agricultural output.</p>
        </div>
        <div style={{ background: "white", borderRadius: "0", padding: "25px", boxShadow: "var(--shadow-soft)", marginBottom: "20px" }}>
          <h4 style={{ color: "var(--primary-dark)", marginBottom: "15px", fontSize: "1.1rem" }}>
            <i className="fa-solid fa-leaf" style={{ color: "var(--primary-color)" }}></i>
            {" Why Kenvos? "}
          </h4>
          <div style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.8" }}>
            <p style={{ marginBottom: "12px" }}>
              <i className="fa-solid fa-check" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              {" "}
              <b>Industry-Backed Returns:</b>
              {" Yields are tied to the production output of agrochemical plants and agricultural input distribution."}
            </p>
            <p style={{ marginBottom: "12px" }}>
              <i className="fa-solid fa-check" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              {" "}
              <b>Daily Settlement:</b>
              {" Your returns are calculated and credited to your account every 24 hours, automatically."}
            </p>
            <p style={{ marginBottom: "12px" }}>
              <i className="fa-solid fa-check" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              {" "}
              <b>Flexible Plans:</b>
              {" From starter portfolios to VIP agricultural funds — choose a plan that matches your investment horizon."}
            </p>
            <p style={{ marginBottom: "12px" }}>
              <i className="fa-solid fa-check" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              {" "}
              <b>Secure Withdrawals:</b>
              {" Cash out your returns directly to your bank account or mobile money, with industry-standard processing times."}
            </p>
            <p style={{ marginBottom: "12px" }}>
              <i className="fa-solid fa-check" style={{ color: "var(--primary-color)", marginRight: "8px" }}></i>
              {" "}
              <b>Partner Rewards:</b>
              {" Invite fellow investors and earn multi-level commission when they join our agrochemical portfolio."}
            </p>
          </div>
          <div style={{ background: "var(--primary-light)", padding: "15px", borderRadius: "0", textAlign: "center", marginTop: "20px" }}>
            <p style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--primary-dark)", margin: "0" }}>Start investing in the agricultural revolution today — your portfolio grows as global food demand grows.</p>
          </div>
        </div>
        {/* Plan Table Image */}
        <div style={{ background: "white", borderRadius: "0", padding: "20px", boxShadow: "var(--shadow-soft)", marginBottom: "20px" }}>
          <h4 style={{ color: "var(--primary-dark)", marginBottom: "12px", fontSize: "1.1rem" }}>
            <i className="fa-solid fa-table-list" style={{ color: "var(--primary-color)" }}></i>
            {" Plan Table "}
          </h4>
          <img id="planTableImg" src="1234.png" alt="Investment Plan Table" style={{ width: "100%", height: "auto", display: "block", border: "1px solid #e2e8f0" }} onError={(event) => { tryPlanTableFallback(event.currentTarget); }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "10px", textAlign: "center" }}>
            <i className="fa-solid fa-image"></i>
            {" Plan table image "}
          </p>
        </div>
      </div>
    </section>
  );
}
