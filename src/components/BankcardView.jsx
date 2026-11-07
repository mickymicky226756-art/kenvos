export default function BankcardView() {
  return (
    <section id="view-bankcard" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('profile'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Bank Details</h2>
        <p>Secure your withdrawal method.</p>
      </div>
      <div className="content-box">
        <div id="bankBoundNotice" style={{ display: "none", background: "#dbeafe", color: "#1e3a8a", padding: "14px", border: "1px solid #93c5fd", marginBottom: "18px", fontWeight: "600", fontSize: "0.9rem" }}>
          <i className="fa-solid fa-circle-check"></i>
          {" Your bank account is bound. Details cannot be edited. "}
        </div>
        <div className="input-group">
          <label>Bank Name</label>
          {" "}
          <input type="text" id="bindBankName" defaultValue="CBE" readOnly style={{ background: "#f1f5f9", color: "#475569", cursor: "not-allowed" }} />
        </div>
        <div className="input-group">
          <label>Account Holder Name</label>
          <input type="text" id="bindAccName" placeholder="Full Name" />
        </div>
        <div className="input-group">
          <label>Account Number</label>
          <input type="number" id="bindAccNum" placeholder="Account Number" />
        </div>
        <div className="input-group" style={{ marginTop: "25px" }}>
          <label style={{ color: "var(--primary-color)" }}>Set Withdrawal Password</label>
          <input type="password" id="bindWithPass" placeholder="Create a secure code" />
        </div>
        <button className="btn-full" id="bindBankSaveBtn" onClick={(event) => { saveBankInfo(); }}>Save Bank Details</button>
        <div className="auth-footnote" style={{ marginTop: "14px" }}>
          <i className="fa-solid fa-circle-info"></i>
          {" "}
          <span>Only Commercial Bank of Ethiopia (CBE) is supported for withdrawals. Once bound, your bank details cannot be changed.</span>
        </div>
      </div>
    </section>
  );
}
