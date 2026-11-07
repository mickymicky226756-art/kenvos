export default function ShopView() {
  return (
    <section id="view-shop" className="view-section animate-up">
      <div className="page-header">
        <div style={{ position: "absolute", right: "20px", top: "25px", width: "40px", height: "40px", borderRadius: "0", background: "white", boxShadow: "var(--shadow-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-color)", cursor: "pointer" }} onClick={(event) => { loadShopPlans(); }} title="Refresh">
          <i className="fa-solid fa-rotate-right"></i>
        </div>
        <h2>Investment Plans</h2>
        <p>Choose an agrochemical fund and earn daily returns.</p>
      </div>
      <div className="content-box" style={{ background: "transparent", boxShadow: "none", paddingTop: "0" }}>
        <div className="farm-grid" id="shopPlanList">
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading plans...</p>
        </div>
      </div>
    </section>
  );
}
