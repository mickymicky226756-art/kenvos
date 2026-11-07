export default function OrdersView() {
  return (
    <section id="view-orders" className="view-section animate-up">
      <div className="page-header">
        <h2>My Active Plans</h2>
        <p>{"Live daily income & next 24h countdown."}</p>
      </div>
      <div className="content-box">
        <div className="plan-page-banner">
          <i className="fa-solid fa-bolt"></i>
          {" "}
          <span>
            {"Daily income is credited automatically every "}
            <b>24 hours</b>
            . Watch the live countdown below.
          </span>
        </div>
        <div className="plan-summary-bar">
          <div className="plan-summary-tile">
            <div className="psum-val" id="planSumActive">0</div>
            <div className="psum-lbl">Active</div>
          </div>
          <div className="plan-summary-tile">
            <div className="psum-val" id="planSumDaily">0.00</div>
            <div className="psum-lbl">Daily Total</div>
          </div>
          <div className="plan-summary-tile">
            <div className="psum-val" id="planSumEarned">0.00</div>
            <div className="psum-lbl">Total Earned</div>
          </div>
        </div>
        <div id="myOrdersList">
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading active investments...</p>
        </div>
      </div>
    </section>
  );
}
