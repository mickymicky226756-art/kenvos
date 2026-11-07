export default function TeamView() {
  return (
    <section id="view-team" className="view-section animate-up" style={{ paddingTop: "0" }}>
      <div className="team-page">
        {/* Green Header */}
        <div className="team-header" id="teamHeaderTitle">Level 1 Team</div>
        {/* Stats Card: Team Recharge + Total Members */}
        <div className="team-stats-card">
          <div className="team-stat">
            <div className="team-stat-label">Team Recharge</div>
            <div className="team-stat-value" id="teamRechargeTotal">ETB 0.00</div>
          </div>
          <div className="team-stat">
            <div className="team-stat-label">Total Members</div>
            <div className="team-stat-value" id="teamMembersTotal">0</div>
          </div>
        </div>
        {/* Level Tabs */}
        <div className="team-tabs">
          <div className="team-tab active" data-lv="1" onClick={(event) => { switchTeamLevel(1, event.currentTarget); }}>
            <div className="team-tab-lv">LV:1</div>
            <div className="team-tab-income">Income 25%</div>
          </div>
          <div className="team-tab" data-lv="2" onClick={(event) => { switchTeamLevel(2, event.currentTarget); }}>
            <div className="team-tab-lv">LV:2</div>
            <div className="team-tab-income">Income 3%</div>
          </div>
          <div className="team-tab" data-lv="3" onClick={(event) => { switchTeamLevel(3, event.currentTarget); }}>
            <div className="team-tab-lv">LV:3</div>
            <div className="team-tab-income">Income 2%</div>
          </div>
        </div>
        {/* Members List / Empty State */}
        <div className="team-members" id="teamMembersList">
          <div className="team-empty" id="teamEmpty">
            <i className="fa-solid fa-user team-empty-icon"></i>
            <div className="team-empty-text">
              {"Level "}
              <span id="teamEmptyLevel">1</span>
              {" · No members"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
