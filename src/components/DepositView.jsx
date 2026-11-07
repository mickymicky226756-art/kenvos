export default function DepositView() {
  return (
    <section id="view-deposit" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('home'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Recharge</h2>
        <p>Add funds to start investing.</p>
      </div>
      <div className="content-box">
        {/* Step 1: Amount only */}
        <div id="depositStepAmount">
          <h4 style={{ marginBottom: "6px", color: "var(--text-main)", fontSize: "1rem" }}>
            {"Recharge amount "}
            <span id="depMinLabel" style={{ color: "var(--text-muted)", fontWeight: "500", fontSize: "0.85rem" }}>(Minimum 650 ETB)</span>
          </h4>
          <div className="quick-amounts" id="depQuickAmounts" style={{ marginTop: "15px", marginBottom: "20px" }}>
            {/* Quick-amount buttons are populated by updateDynamicConfigUI() based on the admin's minDeposit */}
          </div>
          <div className="input-group">
            <input type="number" id="depAmountPage" placeholder="Please enter the recharge amount" />
          </div>
          <button className="btn-full" style={{ marginTop: "25px", background: "#1e3a8a" }} onClick={(event) => { handleRechargeNow(); }}>Recharge now</button>
        </div>
        {/* Step 2: PayNow Bank Selection */}
        <div id="depositStepBank" style={{ display: "none" }}>
          <div className="paynow-header">
            <div className="paynow-logo">P</div>
            <span>Pay with PayNow®</span>
            {" "}
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto", border: "1px solid #e4e4e7", padding: "3px 8px", borderRadius: "0" }}>
              <i className="fa-solid fa-globe"></i>
              {" EN"}
            </span>
          </div>
          <div className="paynow-amount-card">
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>Amount</div>
            <div className="paynow-amount" id="paynowAmount">
              {"Br600.00 "}
              <i className="fa-regular fa-eye" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}></i>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
              {"OrderSn: "}
              <span id="paynowOrderSn" style={{ fontFamily: "monospace" }}>PN000000000000</span>
            </div>
          </div>
          <h4 style={{ margin: "20px 0 12px", color: "var(--text-main)", fontSize: "0.95rem" }}>Choose your Payment Bank</h4>
          <div id="paynowBankList">Loading banks...</div>
          <button className="btn-full" id="paynowPayBtn" style={{ marginTop: "25px", background: "#3b82f6", opacity: "0.5" }} disabled onClick={(event) => { handlePaynowPay(); }}>
            {"PAY "}
            <span id="paynowPayLabel">Br 0.00</span>
          </button>
        </div>
        {/* Step 3: Payment Details (copy account / amount / order code) */}
        <div id="depositStepDetails" style={{ display: "none" }}>
          <h3 style={{ textAlign: "center", margin: "0 0 14px", color: "var(--text-main)", fontSize: "1.15rem", fontWeight: "700" }}>PayNow® Cashier</h3>
          <div className="paynow-step-row">
            <div className="paynow-step done">
              <span className="paynow-step-num">1.</span>
              {"Submit "}
              <i className="fa-solid fa-check"></i>
            </div>
            <div className="paynow-step active">
              <span className="paynow-step-num">2.</span>
              {"Payment "}
              <i className="fa-solid fa-circle-dot"></i>
            </div>
            <div className="paynow-step">
              <span className="paynow-step-num">3.</span>
              Completed
            </div>
          </div>
          <div className="paynow-details-card">
            <div className="paynow-details-header">
              <div className="paynow-logo-sm">P</div>
              <span>Pay with PayNow®</span>
              {" "}
              <span className="paynow-lang-pill">
                <i className="fa-solid fa-globe"></i>
                {" EN"}
              </span>
            </div>
            <div className="paynow-amount-big" id="paynowDetailsAmount">Br 600.00</div>
            <div className="paynow-meta">{" Use this account for this transaction only "}</div>
            <div className="paynow-details-row">
              <span className="paynow-details-label">Name:</span>
              {" "}
              <span className="paynow-details-val" id="paynowDetailsName">—</span>
            </div>
            <div className="paynow-details-row">
              <span className="paynow-details-label">Bank:</span>
              {" "}
              <span className="paynow-details-val" id="paynowDetailsBank">—</span>
            </div>
            <div className="paynow-details-row">
              <span className="paynow-details-label">Account:</span>
              {" "}
              <span className="paynow-details-val mono">
                {" "}
                <span id="paynowDetailsAccount">—</span>
                {" "}
                <button type="button" className="paynow-copy-btn" onClick={(event) => { copyPaynowField('paynowDetailsAccount', 'Account number'); }} title="Copy">
                  <i className="fa-regular fa-copy"></i>
                </button>
                {" "}
              </span>
            </div>
            <div className="paynow-details-row">
              <span className="paynow-details-label">Amount:</span>
              {" "}
              <span className="paynow-details-val mono">
                {" "}
                <span id="paynowDetailsAmountInline">—</span>
                {" "}
                <button type="button" className="paynow-copy-btn" onClick={(event) => { copyPaynowField('paynowDetailsAmountInline', 'Amount'); }} title="Copy">
                  <i className="fa-regular fa-copy"></i>
                </button>
                {" "}
              </span>
            </div>
            <div className="paynow-details-row">
              <span className="paynow-details-label">Order Code:</span>
              {" "}
              <span className="paynow-details-val mono strong">
                {" "}
                <span id="paynowDetailsOrderCode">—</span>
                {" "}
                <button type="button" className="paynow-copy-btn" onClick={(event) => { copyPaynowField('paynowDetailsOrderCode', 'Order code'); }} title="Copy">
                  <i className="fa-regular fa-copy"></i>
                </button>
                {" "}
              </span>
            </div>
            <div className="paynow-info-box">
              <i className="fa-solid fa-circle-info"></i>
              {" "}
              <span>Fill in the Order Code in reason / remarks / details / description when transfer</span>
            </div>
          </div>
          {/* Inline transaction confirmation (no popup).
                         User scrolls down, fills in the two fields, and clicks
                         Submit to send the deposit request to the admin. */}
          <div id="depositConfirmSection" className="paynow-confirm-section">
            <h4 style={{ margin: "20px 0 6px", color: "var(--text-main)", fontSize: "1rem", fontWeight: "700" }}>
              <i className="fa-solid fa-circle-check" style={{ color: "var(--primary-color)" }}></i>
              {" Confirm Your Transfer "}
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "14px" }}>{" After making the bank transfer, scroll down and enter your Transaction ID and the Sender's Name to submit your deposit request. "}</p>
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <label style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "0.85rem" }}>Transaction ID</label>
              {" "}
              <input type="text" id="depTxIdInline" placeholder="12 chars, starts with FT, e.g. FT26180F0KJJ" style={{ background: "#f8fafc" }} />
            </div>
            <div className="input-group" style={{ marginBottom: "6px" }}>
              <label style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "0.85rem" }}>Sender's Name (as on bank account)</label>
              {" "}
              <input type="text" id="depSenderNameInline" placeholder="Enter the name as shown on your bank account" style={{ background: "#f8fafc" }} />
            </div>
            <button className="btn-full" id="txSubmitBtnInline" style={{ marginTop: "18px", background: "#3b82f6" }} onClick={(event) => { submitTxConfirmation(); }}>
              <i className="fa-solid fa-paper-plane"></i>
              {" Submit Deposit Request "}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
