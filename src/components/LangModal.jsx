export default function LangModal() {
  return (
    <div id="langModal" className="modal">
      <div className="modal-content">
        <span className="close" onClick={(event) => { closeModal('langModal'); }}>×</span>
        <h3 style={{ marginBottom: "20px", color: "var(--text-main)" }}>Select Language</h3>
        <div style={{ background: "#f4f4f5", padding: "15px", borderRadius: "0", marginBottom: "10px", cursor: "pointer", fontWeight: "bold" }} onClick={(event) => { changeLanguage('en'); }}>🇺🇸 English</div>
        <div style={{ background: "#f4f4f5", padding: "15px", borderRadius: "0", cursor: "pointer", fontWeight: "bold" }} onClick={(event) => { changeLanguage('am'); }}>🇪🇹 አማርኛ</div>
      </div>
    </div>
  );
}
