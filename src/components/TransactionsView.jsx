export default function TransactionsView() {
  return (
    <section id="view-transactions" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('profile'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Transaction Details</h2>
        <p>Track your history</p>
      </div>
      <div className="content-box">
        <div className="txn-tab-row">
          <div className="txn-tab active" id="tab-dep" data-tab="dep" onClick={(event) => { showTxnTab('dep'); }}>Deposit</div>
          <div className="txn-tab" id="tab-wit" data-tab="wit" onClick={(event) => { showTxnTab('wit'); }}>Withdraw</div>
          <div className="txn-tab" id="tab-inc" data-tab="inc" onClick={(event) => { showTxnTab('inc'); }}>Income</div>
        </div>
        <div id="txn-dep-list">Loading deposits...</div>
        <div id="txn-wit-list" style={{ display: "none" }}>Loading withdrawals...</div>
        <div id="txn-inc-list" style={{ display: "none" }}>Loading income...</div>
      </div>
    </section>
  );
}
