export default function TasksView() {
  return (
    <section id="view-tasks" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('profile'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Daily Tasks</h2>
        <p>Complete missions and earn rewards.</p>
      </div>
      <div className="content-box">
        {/* Summary Header */}
        <div className="tasks-summary">
          <div className="tasks-summary-title">Today's Progress</div>
          <div className="tasks-summary-value" id="tasksCompletedCount">0 / 0</div>
          <div className="tasks-summary-sub" id="tasksEarnedTotal">Earned 0 ETB from tasks</div>
          <div className="tasks-streak" id="tasksStreak">
            <i className="fa-solid fa-fire"></i>
            {" "}
            <span id="tasksStreakCount">0</span>
            {" day streak "}
          </div>
          <div className="tasks-progress" style={{ marginTop: "14px" }}>
            <div className="tasks-progress-bar" id="tasksProgressBar" style={{ width: "0%" }}></div>
          </div>
        </div>
        {/* Task List */}
        <div id="tasksList">Loading tasks...</div>
      </div>
    </section>
  );
}
