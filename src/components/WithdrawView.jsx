export default function WithdrawView() {
  return (
    <section id="view-withdraw" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('home'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Withdraw</h2>
        <p>Cash out your investment returns.</p>
      </div>
      <div className="content-box">
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "600" }}>Available Balance</p>
          <h2 style={{ fontSize: "2.5rem", color: "var(--primary-dark)", fontWeight: "800" }}>
            {"ETB "}
            <span id="withDisplayBal">0.00</span>
          </h2>
        </div>
        <div id="withdrawInputs">
          <div className="input-group">
            <label>Withdrawal Amount</label>
            {" "}
            <input type="number" id="withAmount" placeholder="Enter amount" />
          </div>
          <div className="input-group">
            <label>Security Password</label>
            {" "}
            <input type="password" id="withAuthPass" placeholder="Enter withdrawal password" />
          </div>
          <button className="btn-full" onClick={(event) => { submitWithdraw(); }}>Submit Request</button>
        </div>
        <div id="withdrawMsg" style={{ display: "none", textAlign: "center" }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "3rem", color: "#ef4444", marginBottom: "15px" }}></i>
          <p style={{ color: "var(--text-main)", fontWeight: "600" }}>Please bind your bank account first!</p>
          <button className="btn-full" style={{ marginTop: "15px" }} onClick={(event) => { switchView('bankcard'); }}>Setup Bank Info</button>
        </div>
        <div id="withdrawNoInvestMsg" style={{ display: "none", textAlign: "center" }}>
          <i className="fa-solid fa-flask" style={{ fontSize: "3rem", color: "var(--primary-color)", marginBottom: "15px" }}></i>
          <p style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "1.05rem" }}>No active investment found!</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "10px 0 20px" }}>To withdraw funds, you must first subscribe to at least one investment plan.</p>
          <button className="btn-full" onClick={(event) => { switchView('shop'); }}>
            <i className="fa-solid fa-flask-vial"></i>
            {" Browse Investment Plans"}
          </button>
        </div>
        <div id="withFeeInfo" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#0f172a", padding: "14px 16px", borderRadius: "0", fontSize: "0.88rem", fontWeight: "500", marginTop: "25px", lineHeight: "1.7" }}>
          <div style={{ fontWeight: "700", marginBottom: "6px", color: "#0f172a" }}>
            <i className="fa-solid fa-circle-info"></i>
            {" Withdrawal Rules "}
          </div>
          <div>
            {"• Fee: "}
            <span id="withFeePct">18</span>
            {"%  |  Minimum Withdraw: "}
            <span id="withMinAmt">250</span>
            {" ETB"}
          </div>
          <div>• Withdrawal window: 10:00 AM – 4:00 PM</div>
          <div>• Maximum 2 withdrawals per day</div>
        </div>
      </div>
    </section>
  );
}
