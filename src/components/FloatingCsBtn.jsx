export default function FloatingCsBtn() {
  return (
    <div className="floating-cs-btn" id="floatingCsBtn" style={{ display: "none" }} onClick={(event) => { openTg('service'); }}>
      <i className="fa-solid fa-headset"></i>
    </div>
  );
}
