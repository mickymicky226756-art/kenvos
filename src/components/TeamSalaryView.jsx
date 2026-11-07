export default function TeamSalaryView() {
  return (
    <section id="view-team-salary" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('profile'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Daily Team Salary</h2>
        <p>Earn daily from your active investor team.</p>
      </div>
      <div className="content-box">
        {/* Summary Header */}
        <div className="tasks-summary">
          <div className="tasks-summary-title">Active Investors</div>
          <div className="tasks-summary-value" id="teamSalaryActive">0</div>
          <div className="tasks-summary-sub" id="teamSalaryTierLabel">No tier reached yet</div>
          <div className="tasks-streak" id="teamSalaryRate">
            <i className="fa-solid fa-coins"></i>
            {" Today's Salary: "}
            <span id="teamSalaryToday">0.00</span>
            {" ETB "}
          </div>
        </div>
        {/* Claim button */}
        <button className="btn-full" id="teamSalaryClaimBtn" style={{ marginBottom: "18px" }} onClick={(event) => { claimTeamSalary(); }}>
          <i className="fa-solid fa-hand-holding-dollar"></i>
          {" Claim Today's Salary "}
        </button>
        <div style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-main)", margin: "6px 4px 10px" }}>{" Salary Tiers "}</div>
        {/* Tier 1 */}
        <div className="task-card" id="teamSalaryTier1" style={{ marginBottom: "12px" }}>
          <div className="task-icon">
            <i className="fa-solid fa-medal"></i>
          </div>
          <div className="task-info">
            <div className="task-title">Level 1 · 5 active investors</div>
            <div className="task-desc" id="teamSalaryTier1Desc">Need 5 more active investors</div>
            <span className="task-reward">
              <i className="fa-solid fa-coins"></i>
              {" 30 ETB / day"}
            </span>
          </div>
        </div>
        {/* Tier 2 */}
        <div className="task-card" id="teamSalaryTier2" style={{ marginBottom: "12px" }}>
          <div className="task-icon">
            <i className="fa-solid fa-medal"></i>
          </div>
          <div className="task-info">
            <div className="task-title">Level 2 · 12 active investors</div>
            <div className="task-desc" id="teamSalaryTier2Desc">Need 12 more active investors</div>
            <span className="task-reward">
              <i className="fa-solid fa-coins"></i>
              {" 70 ETB / day"}
            </span>
          </div>
        </div>
        {/* Tier 3 */}
        <div className="task-card" id="teamSalaryTier3" style={{ marginBottom: "12px" }}>
          <div className="task-icon">
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div className="task-info">
            <div className="task-title">Level 3 · 20 active investors</div>
            <div className="task-desc" id="teamSalaryTier3Desc">Need 20 more active investors</div>
            <span className="task-reward">
              <i className="fa-solid fa-coins"></i>
              {" 150 ETB / day"}
            </span>
          </div>
        </div>
        {/* Tier 4 */}
        <div className="task-card" id="teamSalaryTier4" style={{ marginBottom: "12px" }}>
          <div className="task-icon">
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div className="task-info">
            <div className="task-title">Level 4 · 40 active investors</div>
            <div className="task-desc" id="teamSalaryTier4Desc">Need 40 more active investors</div>
            <span className="task-reward">
              <i className="fa-solid fa-coins"></i>
              {" 500 ETB / day"}
            </span>
          </div>
        </div>
        {/* Tier 5 */}
        <div className="task-card" id="teamSalaryTier5" style={{ marginBottom: "12px" }}>
          <div className="task-icon">
            <i className="fa-solid fa-crown"></i>
          </div>
          <div className="task-info">
            <div className="task-title">Level 5 · 60 active investors</div>
            <div className="task-desc" id="teamSalaryTier5Desc">Need 60 more active investors</div>
            <span className="task-reward">
              <i className="fa-solid fa-coins"></i>
              {" 1000 ETB / day"}
            </span>
          </div>
        </div>
        <div className="auth-footnote" style={{ marginTop: "6px" }}>
          <i className="fa-solid fa-circle-info"></i>
          {" "}
          <span>Active investors are team members who have bought at least one plan. Higher tiers replace lower ones — you earn the salary of the highest tier you reach.</span>
        </div>
      </div>
    </section>
  );
}
