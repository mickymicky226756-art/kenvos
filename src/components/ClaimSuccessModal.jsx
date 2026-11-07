export default function ClaimSuccessModal() {
  return (
    <div id="claimSuccessModal" className="modal">
      <div className="modal-content animate-up">
        <i className="fa-solid fa-flask-vial" style={{ fontSize: "4rem", color: "var(--primary-color)", marginBottom: "15px" }} id="claimModalIcon"></i>
        <h2 style={{ color: "var(--text-main)", fontWeight: "800" }} id="claimModalTitle">Yield Credited!</h2>
        <p id="claimModalDesc" style={{ color: "var(--text-muted)", margin: "10px 0" }}>Your daily return is ready.</p>
        <div style={{ fontSize: "3rem", fontWeight: "800", color: "var(--primary-color)", margin: "15px 0" }}>
          {"ETB "}
          <span id="claimModalAmount">0.00</span>
        </div>
        <button className="btn-full" onClick={(event) => { closeModal('claimSuccessModal'); }} style={{ background: "var(--primary-color)" }}>Awesome!</button>
      </div>
    </div>
  );
}
