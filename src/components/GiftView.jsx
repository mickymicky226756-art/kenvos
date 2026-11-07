export default function GiftView() {
  return (
    <section id="view-gift" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('profile'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Gift Code</h2>
        <p>Redeem your special gift code here.</p>
      </div>
      <div className="content-box">
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <i className="fa-solid fa-gift" style={{ fontSize: "4rem", color: "#ec4899", marginBottom: "15px" }}></i>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Enter your promotional code below to claim free rewards or balance.</p>
        </div>
        <div className="input-group">
          <label>Gift Code</label>
          {" "}
          <input type="text" id="giftCodeInput" placeholder="Enter code (e.g. WELCOME50)" style={{ textTransform: "uppercase" }} />
        </div>
        <button className="btn-full" style={{ background: "#ec4899", boxShadow: "0 8px 20px rgba(236, 72, 153, 0.3)" }} onClick={(event) => { redeemGiftCode(); }}>Claim Reward</button>
      </div>
    </section>
  );
}
