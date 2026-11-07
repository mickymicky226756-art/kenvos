export default function ChangepassView() {
  return (
    <section id="view-changepass" className="view-section animate-up">
      <div className="page-header">
        <button className="back-btn" onClick={(event) => { switchView('profile'); }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>Change Password</h2>
        <p>Secure your account.</p>
      </div>
      <div className="content-box">
        <div className="input-group">
          <label>Current Password</label>
          <input type="password" id="cpOldPass" placeholder="Enter your old password" />
        </div>
        <div className="input-group">
          <label>New Password</label>
          <input type="password" id="cpNewPass" placeholder="Enter new password" />
        </div>
        <button className="btn-full" onClick={(event) => { changeAccountPassword(); }}>Update Password</button>
      </div>
    </section>
  );
}
