export default function AuthModal() {
  return (
    <div id="authModal" style={{ display: "flex" }}>
      <div className="auth-bg"></div>
      <div className="auth-stack">
        {/* Brand block: white circle with leaf, name, tagline */}
        <div className="auth-brand-block">
          <div className="auth-logo-circle">
            <i className="fa-solid fa-leaf auth-leaf"></i>
            <div className="auth-logo-name">KENVOS</div>
            <div className="auth-logo-divider">INVESTMENT</div>
          </div>
          <p className="auth-tagline">Investing in Sustainable Growth</p>
        </div>
        {/* Form block: pill inputs + Continue + Sign up */}
        <div className="auth-form-block">
          <div id="authTitle" style={{ display: "none" }}>Welcome Back</div>
          <div id="authSubtitle" style={{ display: "none" }}>Log in to manage your investments.</div>
          <form id="loginForm" className="auth-form" onSubmit={(event) => { event.preventDefault(); login(); }}>
            <div id="loginAlert" className="auth-alert" role="alert" aria-live="assertive">
              <div className="aa-icon">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
              <div className="aa-body">
                <div className="aa-title" id="loginAlertTitle">Login failed</div>
                <div className="aa-msg" id="loginAlertMsg">Please check your credentials and try again.</div>
              </div>
              <button type="button" className="aa-close" onClick={(event) => { hideAuthAlert('login'); }} aria-label="Dismiss">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="auth-field">
              <div className="auth-pill" id="loginPhonePill">
                <span className="auth-prefix">+251</span>
                {" "}
                <input type="tel" id="loginPhone" placeholder="9x xxx xxxx" maxLength="9" autoComplete="tel-national" inputMode="numeric" onInput={(event) => { clearAuthFieldError('loginPhonePill','loginPhoneErr'); }} />
              </div>
              <div className="auth-field-err" id="loginPhoneErr">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span></span>
              </div>
            </div>
            <div className="auth-field">
              <div className="auth-pill" id="loginPassPill">
                <input type="password" id="loginPass" placeholder="Password" autoComplete="current-password" onInput={(event) => { clearAuthFieldError('loginPassPill','loginPassErr'); }} />
              </div>
              <div className="auth-field-err" id="loginPassErr">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span></span>
              </div>
            </div>
            <label className="auth-remember" htmlFor="rememberMe">
              {" "}
              <input type="checkbox" id="rememberMe" />
              {" "}
              <span>Remember my password</span>
              {" "}
            </label>
            {" "}
            <button type="submit" className="auth-continue" id="loginBtn">Continue</button>
            {" "}
            <button type="button" className="auth-signup" onClick={(event) => { toggleAuth('signup'); }}>
              {" Don't have an account? "}
              <strong>Sign up</strong>
            </button>
          </form>
          <form id="signupForm" className="auth-form" style={{ display: "none" }} onSubmit={(event) => { event.preventDefault(); signup(); }}>
            <div id="signupAlert" className="auth-alert" role="alert" aria-live="assertive">
              <div className="aa-icon">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
              <div className="aa-body">
                <div className="aa-title" id="signupAlertTitle">Sign up failed</div>
                <div className="aa-msg" id="signupAlertMsg">Please review the form and try again.</div>
              </div>
              <button type="button" className="aa-close" onClick={(event) => { hideAuthAlert('signup'); }} aria-label="Dismiss">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="auth-field">
              <div className="auth-pill" id="regPhonePill">
                <span className="auth-prefix">+251</span>
                {" "}
                <input type="tel" id="regPhone" placeholder="Phone number" maxLength="9" inputMode="numeric" onInput={(event) => { clearAuthFieldError('regPhonePill','regPhoneErr'); }} />
              </div>
              <div className="auth-field-err" id="regPhoneErr">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span></span>
              </div>
            </div>
            <div className="auth-field">
              <div className="auth-pill" id="regPassPill">
                <input type="password" id="regPass" placeholder="Create password" autoComplete="new-password" onInput={(event) => { clearAuthFieldError('regPassPill','regPassErr'); }} />
              </div>
              <div className="auth-field-err" id="regPassErr">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span></span>
              </div>
            </div>
            <div className="auth-field">
              <div className="auth-pill" id="regPassConfirmPill">
                <input type="password" id="regPassConfirm" placeholder="Confirm password" autoComplete="new-password" onInput={(event) => { clearAuthFieldError('regPassConfirmPill','regPassConfirmErr'); }} />
              </div>
              <div className="auth-field-err" id="regPassConfirmErr">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span></span>
              </div>
            </div>
            <div className="auth-field">
              <div className="auth-pill" id="regRefPill">
                <input type="text" id="regRef" placeholder="Invite code (optional)" />
              </div>
            </div>
            <button type="submit" className="auth-continue" id="signupBtn">Create Account</button>
            {" "}
            <button type="button" className="auth-signup" onClick={(event) => { toggleAuth('login'); }}>
              {" Already have an account? "}
              <strong>Sign in</strong>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
