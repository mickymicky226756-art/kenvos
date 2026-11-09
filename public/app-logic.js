        // --- GLOBAL DEFAULTS (declared FIRST so they're always available,
        //     even if Firebase init fails further down) ---
        var DEFAULT_TG_LINKS = {
            channel: 'https://t.me/Kenvos45',
            group:   'https://t.me/Kenvos3',
            service: 'https://t.me/Kenvos4'
        };
        var tgLinks = Object.assign({}, DEFAULT_TG_LINKS);
        var _tgLinksLoaded = false;
        var _tgLinkWaiters = [];

        // Plan table image uploaded by the admin (settings/planTable). Used by the
        // welcome popup and the About page. null = nothing uploaded, use the default 1234.* file.
        var _planTablePromise = null;
        var _planTableIsCustom = false;

        // Default app config (admin can override via Settings panel).
        // Declared with `var` and placed BEFORE Firebase init so any function
        // called early (e.g. error handlers, the auth flow) can read it.
        var appConfig = {
            minDeposit: 600,
            minWithdraw: 150,
            registrationBonus: 150,
            withdrawalFee: 18
        };

        // --- FIREBASE CONFIG (loaded from firebase-config.js) ---
        firebase.initializeApp(window.firebaseConfig);
        const db = firebase.database();

        let currentUser = null;
        let userData = {};
        let currentCaptcha = "";

        // Server-time offset (ms) — used so the withdrawal flow can't be spoofed
        // by the user changing their device clock or timezone. The Firebase
        // Realtime Database exposes the offset between the client and the
        // server via .info/serverTimeOffset; we add it to Date.now() to get a
        // server-anchored "now" for hour/date checks, and use
        // ServerValue.TIMESTAMP for the actual stored timestamp.
        let serverTimeOffset = 0;
        db.ref('.info/serverTimeOffset').on('value', (snap) => {
            const v = snap.val();
            if (typeof v === 'number') serverTimeOffset = v;
        });
        function serverNow() {
            return Date.now() + (serverTimeOffset || 0);
        }
        function serverDateString() {
            return new Date(serverNow()).toDateString();
        }

        // (appConfig is declared at the very top of this script with `var`
        //  so it is always available even before Firebase finishes loading.)

        db.ref('settings/config').on('value', (snap) => {
            if (snap.exists()) {
                appConfig = Object.assign(appConfig, snap.val());
            }
            updateDynamicConfigUI();
        });

        // ============================================ //
        // --- TELEGRAM LINKS (admin-managed, live) --- //
        // ============================================ //
        // (var declarations for DEFAULT_TG_LINKS, tgLinks, _tgLinksLoaded,
        //  _tgLinkWaiters live at the very top of this script so they're
        //  always defined even if Firebase init fails.)
        function onTgLinksReady(cb) {
            if (_tgLinksLoaded) { try { cb(tgLinks); } catch (e) {} return; }
            _tgLinkWaiters.push(cb);
        }
        function loadTelegramLinks() {
            try {
                if (typeof db === 'undefined' || !db || !db.ref) {
                    // Firebase not initialized yet (e.g. page still loading) —
                    // keep defaults, mark loaded so waiters don't block forever.
                    _tgLinksLoaded = true;
                    applyTgLinksToUI();
                    while (_tgLinkWaiters.length) {
                        const cb = _tgLinkWaiters.shift();
                        try { cb(tgLinks); } catch (e) { /* ignore */ }
                    }
                    return;
                }
                db.ref('settings/telegram').once('value', (snap) => {
                    const v = snap.val();
                    if (v) {
                        tgLinks = Object.assign({}, DEFAULT_TG_LINKS, {
                            channel: v.channel || DEFAULT_TG_LINKS.channel,
                            group:   v.group   || DEFAULT_TG_LINKS.group,
                            service: v.service || DEFAULT_TG_LINKS.service
                        });
                    }
                    _tgLinksLoaded = true;
                    applyTgLinksToUI();
                    while (_tgLinkWaiters.length) {
                        const cb = _tgLinkWaiters.shift();
                        try { cb(tgLinks); } catch (e) { /* ignore */ }
                    }
                }, (err) => {
                    // Permission denied / read failure — keep defaults, mark loaded
                    _tgLinksLoaded = true;
                    applyTgLinksToUI();
                });
            } catch (e) {
                // Anything else — keep defaults
                _tgLinksLoaded = true;
                try { applyTgLinksToUI(); } catch (e2) { /* ignore */ }
            }
        }
        function applyTgLinksToUI() {
            // Welcome popup "Join the Group" button
            const joinBtn = document.getElementById('welcomeJoinBtn');
            if (joinBtn) joinBtn.setAttribute('href', tgLinks.group);
            // Support page buttons: now use openTg('channel' | 'group' | 'service')
            // so the latest tgLinks value is always used at click time, not a
            // stale onclick string.
        }

        // Open a Telegram link by key. Falls back to the hard-coded default if
        // the live value hasn't loaded yet (e.g. offline / read error).
        function openTg(key) {
            try {
                const url = (typeof tgLinks !== 'undefined' && tgLinks && tgLinks[key]) || DEFAULT_TG_LINKS[key] || 'https://t.me/';
                window.open(url, '_blank');
            } catch (e) {
                window.open((DEFAULT_TG_LINKS && DEFAULT_TG_LINKS[key]) || 'https://t.me/', '_blank');
            }
        }

        function updateDynamicConfigUI() {
            const depLabel = document.getElementById('depMinLabel');
            if (depLabel) {
                depLabel.innerText = `(Minimum ${appConfig.minDeposit} ETB)`;
            }
            // Quick-amount buttons: fixed preset list of 6 amounts.
            // (Hard-coded so the user always sees a familiar set; admin's
            //  minDeposit still controls what the input field will accept.)
            const depQuick = document.getElementById('depQuickAmounts');
            if (depQuick) {
                const amounts = [600, 2000, 6000, 14000, 32000, 75000, 120000];
                depQuick.innerHTML = amounts.map(amt =>
                    '<button class="amt-btn" onclick="setDepositAmount(' + amt + ')">' + amt + '</button>'
                ).join('');
            }
            const withFeePct = document.getElementById('withFeePct');
            const withMinAmt = document.getElementById('withMinAmt');
            if (withFeePct) withFeePct.innerText = appConfig.withdrawalFee;
            if (withMinAmt) withMinAmt.innerText = appConfig.minWithdraw;
            
            const cfgMinDeposit = document.getElementById('cfgMinDeposit');
            const cfgMinWithdraw = document.getElementById('cfgMinWithdraw');
            const cfgRegBonus = document.getElementById('cfgRegBonus');
            const cfgWithFee = document.getElementById('cfgWithFee');
            if (cfgMinDeposit && document.activeElement !== cfgMinDeposit) cfgMinDeposit.value = appConfig.minDeposit;
            if (cfgMinWithdraw && document.activeElement !== cfgMinWithdraw) cfgMinWithdraw.value = appConfig.minWithdraw;
            if (cfgRegBonus && document.activeElement !== cfgRegBonus) cfgRegBonus.value = appConfig.registrationBonus;
            if (cfgWithFee && document.activeElement !== cfgWithFee) cfgWithFee.value = appConfig.withdrawalFee;
        }

        const translations = {
            en: {
                balance: "Total Funds", income: "Investment Returns",
                deposit: "Deposit", withdraw: "Withdraw", service: "Support", invite: "Invite", gift: "Gift", shop: "Portfolio", orders: "My Returns", profile: "Profile",
                navHome: "Home", navShop: "Plans", navTask: "Returns", navProfile: "Profile"
            },
            am: {
                balance: "ጠቅላላ ቀሪ ሂሳብ", income: "የኢንቨስትመንት ገቢ",
                deposit: "ገንዘብ አስገባ", withdraw: "ገንዘብ አውጣ", service: "እርዳታ", invite: "ጋብዝ", gift: "ስጦታ", shop: "ፕላኖች", orders: "ተመላሽ ገቢዎች", profile: "ፕሮፋይል",
                navHome: "ዋና ገጽ", navShop: "ፕላኖች", navTask: "ተመላሽ", navProfile: "ፕሮፋይል"
            }
        };

        let currentLang = localStorage.getItem('appLang') || 'en';

        function changeLanguage(lang) {
            currentLang = lang;
            localStorage.setItem('appLang', lang);
            applyLanguage();
            closeModal('langModal');
            loadShopPlans();
        }

        function applyLanguage() {
            const t = translations[currentLang];
            document.querySelectorAll('[data-lang]').forEach(el => {
                const key = el.getAttribute('data-lang');
                if (t[key]) el.innerText = t[key];
            });
        }

        function generateCaptcha() {
            const canvas = document.getElementById('captchaCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
            currentCaptcha = "";
            for(let i=0; i<4; i++) {
                currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            for(let i=0; i<25; i++) {
                ctx.fillStyle = `rgba(0,0,0,0.1)`;
                ctx.beginPath();
                ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*2+1, 0, 2*Math.PI);
                ctx.fill();
            }
            
            for(let i=0; i<4; i++) {
                ctx.strokeStyle = `rgba(0,0,0,0.2)`;
                ctx.beginPath();
                ctx.moveTo(Math.random()*canvas.width, Math.random()*canvas.height);
                ctx.lineTo(Math.random()*canvas.width, Math.random()*canvas.height);
                ctx.stroke();
            }
            
            ctx.font = "bold 26px Poppins";
            ctx.fillStyle = "var(--primary-dark)";
            ctx.textBaseline = "middle";
            
            for(let i=0; i<4; i++) {
                const x = 20 + (i * 25);
                const y = canvas.height / 2;
                const angle = (Math.random() - 0.5) * 0.6; 
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.fillText(currentCaptcha[i], 0, 0);
                ctx.restore();
            }
        }

        function toggleAuth(mode) {
            // Always clear any error state when switching between login/signup
            hideAuthAlert('login');
            hideAuthAlert('signup');
            ['loginPhoneErr', 'loginPassErr', 'regPhoneErr', 'regPassErr', 'regPassConfirmErr'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('show');
            });
            ['loginPhonePill', 'loginPassPill', 'regPhonePill', 'regPassPill', 'regPassConfirmPill'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('has-error');
            });
            setAuthLoading('login', false);
            setAuthLoading('signup', false);

            if(mode === 'signup') {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('signupForm').style.display = 'block';
                document.getElementById('authTitle').innerText = "Create Account";
                const sub = document.getElementById('authSubtitle');
                if (sub) sub.innerText = "Start investing in minutes.";
                if (typeof generateCaptcha === 'function') generateCaptcha();
            } else {
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('signupForm').style.display = 'none';
                document.getElementById('authTitle').innerText = "Welcome Back";
                const sub = document.getElementById('authSubtitle');
                if (sub) sub.innerText = "Log in to manage your investments.";
            }
        }

        // Plan table image fallback — try common extensions in order
        const PLAN_TABLE_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
        function tryPlanTableFallback(img) {
            if (!img || !img.dataset) return;
            const tried = (img.dataset.tried || '').split(',').filter(Boolean);
            const next = PLAN_TABLE_FORMATS.find(f => !tried.includes(f) && !img.src.endsWith('.' + f));
            if (!next) return;
            img.dataset.tried = (tried.concat([img.src.split('.').pop()])).join(',');
            img.src = '1234.' + next;
        }

        // Show the same plan table image in the welcome popup and on the About page.
        function applyPlanTableImage(src) {
            ['welcomePlanImg', 'planTableImg'].forEach(id => {
                const img = document.getElementById(id);
                if (!img) return;
                img.dataset.tried = '';
                img.src = src;
            });
        }

        // Reads the admin-uploaded image once per login. Never rejects: on any problem
        // the default image (1234.*) simply stays in place.
        function loadPlanTableImage() {
            _planTablePromise = new Promise(resolve => {
                try {
                    db.ref('settings/planTable').once('value', (snap) => {
                        const v = snap.val();
                        if (v && typeof v.image === 'string' && v.image.indexOf('data:image/') === 0) {
                            _planTableIsCustom = true;
                            applyPlanTableImage(v.image);
                        } else if (_planTableIsCustom) {
                            // Admin removed the custom image since the last login: go back to the default
                            _planTableIsCustom = false;
                            applyPlanTableImage('1234.png');
                        }
                        resolve();
                    }, () => resolve());
                } catch (e) { resolve(); }
            });
            return _planTablePromise;
        }

        // Resolves when the image is loaded, or after `ms` at the latest (slow network).
        function waitForPlanTableImage(ms) {
            return Promise.race([
                _planTablePromise || Promise.resolve(),
                new Promise(resolve => setTimeout(resolve, ms))
            ]);
        }

        function togglePass(inputId, iconEl) {
            const input = document.getElementById(inputId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                iconEl.classList.remove('fa-eye');
                iconEl.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                iconEl.classList.remove('fa-eye-slash');
                iconEl.classList.add('fa-eye');
            }
        }

        // Hero video: ensure autoplay on first paint and on view re-entry
        function ensureHeroVideoPlays() {
            const v = document.getElementById('heroVideo');
            if (!v) return;
            v.muted = true; // autoplay requires muted on most mobile browsers
            const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
            if (v.readyState >= 2) { tryPlay(); } else { v.addEventListener('canplay', tryPlay, { once: true }); }
        }
        function toggleHeroSound() {
            const v = document.getElementById('heroVideo');
            const btn = document.getElementById('heroSoundToggle');
            if (!v || !btn) return;
            const icon = btn.querySelector('i');
            if (v.muted) {
                v.muted = false;
                v.volume = 1.0;
                const p = v.play(); if (p && p.catch) p.catch(() => {});
                if (icon) { icon.classList.remove('fa-volume-xmark'); icon.classList.add('fa-volume-high'); }
                btn.title = 'Mute';
            } else {
                v.muted = true;
                if (icon) { icon.classList.remove('fa-volume-high'); icon.classList.add('fa-volume-xmark'); }
                btn.title = 'Unmute';
            }
        }

        window.onload = function() {
            updateDynamicConfigUI();

            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get('ref');
            if (refCode) {
                toggleAuth('signup');
                const refInput = document.getElementById('regRef');
                if(refInput) { refInput.value = refCode; refInput.readOnly = true; }
            } else {
                generateCaptcha();
            }
            ensureHeroVideoPlays();
        };

        function sanitizePhone(phone) { return phone.replace(/\D/g, ''); }

        /* ============================================ */
        /* --- BEAUTIFUL AUTH ERROR ALERTS --- */
        /* ============================================ */
        // Map of well-known error codes -> { title, message, icon, variant }
        // variants: 'error' (red) | 'warning' (amber) | 'info' (blue) | 'success' (green)
        const AUTH_ERROR_PRESETS = {
            empty_fields:        { title: 'Missing information',  icon: 'fa-circle-exclamation', variant: 'warning',
                                    msg: 'Please fill in both your phone number and password to continue.' },
            invalid_phone:       { title: 'Invalid phone number',  icon: 'fa-mobile-screen',       variant: 'warning',
                                    msg: 'Ethiopian phone numbers must start with 9 or 7 and be 9 digits long (e.g. 9X XXX XXXX).' },
            invalid_credentials: { title: 'Incorrect credentials', icon: 'fa-key',                  variant: 'error',
                                    msg: 'The phone number or password you entered is incorrect. Please try again.' },
            account_banned:      { title: 'Account suspended',     icon: 'fa-ban',                  variant: 'error',
                                    msg: 'Your account has been suspended. Please contact support for help.' },
            network_error:       { title: 'Connection problem',    icon: 'fa-wifi',                 variant: 'warning',
                                    msg: 'We could not reach the server. Check your internet connection and try again.' },
            password_mismatch:   { title: 'Passwords do not match', icon: 'fa-unlock-keyhole',     variant: 'warning',
                                    msg: 'The two passwords you entered are different. Please re-enter them carefully.' },
            phone_taken:         { title: 'Phone already registered', icon: 'fa-user-plus',         variant: 'warning',
                                    msg: 'This phone number is already linked to an account. Try signing in instead.' },
            short_password:      { title: 'Password too short',    icon: 'fa-lock',                 variant: 'warning',
                                    msg: 'Please choose a password with at least 6 characters for your security.' },
            unknown:             { title: 'Something went wrong',  icon: 'fa-triangle-exclamation', variant: 'error',
                                    msg: 'An unexpected error occurred. Please try again in a moment.' }
        };

        function showAuthAlert(form, code, customMsg) {
            const alertEl = document.getElementById(form + 'Alert');
            if (!alertEl) return;
            const preset = AUTH_ERROR_PRESETS[code] || AUTH_ERROR_PRESETS.unknown;
            const titleEl = document.getElementById(form + 'AlertTitle');
            const msgEl   = document.getElementById(form + 'AlertMsg');
            const iconEl  = alertEl.querySelector('.aa-icon i');
            if (titleEl) titleEl.textContent = preset.title;
            if (msgEl)   msgEl.textContent = customMsg || preset.msg;
            if (iconEl)  iconEl.className = 'fa-solid ' + preset.icon;

            // Reset variant classes
            alertEl.classList.remove('error', 'warning', 'info', 'success', 'shake');
            alertEl.classList.add(preset.variant);
            // Re-trigger slide-in + shake
            // Force reflow so the animation restarts even when the alert was already visible
            void alertEl.offsetWidth;
            alertEl.classList.add('show', 'shake');

            // Shake the whole form too for extra emphasis
            const formEl = document.getElementById(form + 'Form');
            if (formEl) {
                formEl.classList.remove('shake');
                void formEl.offsetWidth;
                formEl.classList.add('shake');
                setTimeout(() => formEl.classList.remove('shake'), 600);
            }
            // Auto-dismiss the shake class so re-firing works on the next error
            setTimeout(() => alertEl.classList.remove('shake'), 700);
        }

        function hideAuthAlert(form) {
            const alertEl = document.getElementById(form + 'Alert');
            if (alertEl) alertEl.classList.remove('show');
        }

        function setAuthFieldError(pillId, errId, msg) {
            const pill = document.getElementById(pillId);
            const err  = document.getElementById(errId);
            if (pill) {
                pill.classList.remove('has-error');
                void pill.offsetWidth;
                pill.classList.add('has-error');
                setTimeout(() => pill.classList.remove('has-error'), 2500);
            }
            if (err) {
                const span = err.querySelector('span');
                if (span) span.textContent = msg || '';
                err.classList.add('show');
            }
        }

        function clearAuthFieldError(pillId, errId) {
            const pill = document.getElementById(pillId);
            const err  = document.getElementById(errId);
            if (pill) pill.classList.remove('has-error');
            if (err)  err.classList.remove('show');
            // Hide the top-level alert if the user starts correcting their input
            if (pillId && pillId.startsWith('login')) hideAuthAlert('login');
            if (pillId && (pillId.startsWith('regPhone') || pillId.startsWith('regPass'))) hideAuthAlert('signup');
        }

        function setAuthLoading(form, loading) {
            const btn = document.getElementById(form + 'Btn');
            if (!btn) return;
            if (loading) {
                if (!btn.dataset.label) btn.dataset.label = btn.textContent;
                btn.classList.add('loading');
                btn.textContent = form === 'login' ? 'Signing in' : 'Creating account';
            } else {
                btn.classList.remove('loading');
                btn.textContent = btn.dataset.label || (form === 'login' ? 'Continue' : 'Create Account');
            }
        }

        function login() {
            const rawPhone = document.getElementById('loginPhone').value.trim();
            const pass = document.getElementById('loginPass').value;

            // Field-level validation
            if (!rawPhone && !pass) {
                setAuthFieldError('loginPhonePill', 'loginPhoneErr', 'Phone is required');
                setAuthFieldError('loginPassPill',  'loginPassErr',  'Password is required');
                return showAuthAlert('login', 'empty_fields');
            }
            if (!rawPhone) {
                setAuthFieldError('loginPhonePill', 'loginPhoneErr', 'Phone is required');
                return showAuthAlert('login', 'empty_fields', 'Please enter your registered phone number to sign in.');
            }
            if (!pass) {
                setAuthFieldError('loginPassPill', 'loginPassErr', 'Password is required');
                return showAuthAlert('login', 'empty_fields', 'Please enter your password to sign in.');
            }
            if (!/^[79][0-9]{8}$/.test(rawPhone)) {
                setAuthFieldError('loginPhonePill', 'loginPhoneErr', 'Must start with 9 or 7 (9 digits)');
                return showAuthAlert('login', 'invalid_phone');
            }

            const phone = "251" + sanitizePhone(rawPhone);
            setAuthLoading('login', true);

            db.ref('users/' + phone).once('value', (snapshot) => {
                setAuthLoading('login', false);
                const data = snapshot.val();
                if (data && data.password === pass) {
                    if (data.banned === true) {
                        showAuthAlert('login', 'account_banned');
                        return;
                    }
                    hideAuthAlert('login');
                    initApp(data, phone);
                } else {
                    // Don't reveal whether the phone exists — treat as generic invalid credentials
                    showAuthAlert('login', 'invalid_credentials');
                }
            }, (err) => {
                setAuthLoading('login', false);
                showAuthAlert('login', 'network_error', (err && err.message) ? err.message : undefined);
            });
        }

        function signup() {
            const rawPhone = document.getElementById('regPhone').value.trim();
            const pass = document.getElementById('regPass').value;
            const passConfirm = document.getElementById('regPassConfirm').value;
            const refCode = document.getElementById('regRef').value.trim();

            // Field-level validation
            if (!rawPhone) {
                setAuthFieldError('regPhonePill', 'regPhoneErr', 'Phone is required');
                return showAuthAlert('signup', 'empty_fields', 'Please enter your phone number to create an account.');
            }
            if (!pass) {
                setAuthFieldError('regPassPill', 'regPassErr', 'Password is required');
                return showAuthAlert('signup', 'empty_fields', 'Please choose a password for your new account.');
            }
            if (!passConfirm) {
                setAuthFieldError('regPassConfirmPill', 'regPassConfirmErr', 'Please confirm your password');
                return showAuthAlert('signup', 'empty_fields', 'Please re-enter your password to confirm it.');
            }
            if (pass.length < 6) {
                setAuthFieldError('regPassPill', 'regPassErr', 'At least 6 characters');
                return showAuthAlert('signup', 'short_password');
            }
            if (pass !== passConfirm) {
                setAuthFieldError('regPassPill', 'regPassErr', 'Passwords do not match');
                setAuthFieldError('regPassConfirmPill', 'regPassConfirmErr', 'Passwords do not match');
                return showAuthAlert('signup', 'password_mismatch');
            }
            if (!/^[79][0-9]{8}$/.test(rawPhone)) {
                setAuthFieldError('regPhonePill', 'regPhoneErr', 'Must start with 9 or 7 (9 digits)');
                return showAuthAlert('signup', 'invalid_phone');
            }

            const phone = "251" + rawPhone;
            setAuthLoading('signup', true);

            db.ref('users/' + phone).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    setAuthLoading('signup', false);
                    setAuthFieldError('regPhonePill', 'regPhoneErr', 'Already registered');
                    return showAuthAlert('signup', 'phone_taken');
                }

                const autoName = "Investor_" + rawPhone.substring(5);
                let newCode = "";
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                for(let i=0; i<4; i++) newCode += chars.charAt(Math.floor(Math.random() * chars.length));

                const newUser = {
                    name: autoName, phone: phone, password: pass,
                    balance: appConfig.registrationBonus,
                    income: 0, commission: 0,
                    refCode: newCode, referredBy: refCode || "admin",
                    plans: {}
                };
                // Write the user record AND the refCode -> userKey index in one
                // atomic multi-path update. The index is what distributeCommissions
                // uses to find the referrer by code without reading all users.
                const updates = {};
                updates['users/' + phone] = newUser;
                updates['refCodeIndex/' + newCode] = phone;
                db.ref().update(updates).then(() => {
                    setAuthLoading('signup', false);
                    hideAuthAlert('signup');
                    initApp(newUser, phone);
                    showToast(`Account created! ${appConfig.registrationBonus} ETB Bonus Added.`);
                }).catch(err => {
                    setAuthLoading('signup', false);
                    showAuthAlert('signup', 'network_error', (err && err.message) ? err.message : undefined);
                });
            }, (err) => {
                setAuthLoading('signup', false);
                showAuthAlert('signup', 'network_error', (err && err.message) ? err.message : undefined);
            });
        }

        function initApp(data, phoneKey) {
            currentUser = phoneKey;
            userData = data;
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            applyLanguage();
            updateDynamicConfigUI();
            // Hero video stays MUTED by default. The user can tap the
            // speaker button on the video to unmute if they want sound.
            ensureHeroVideoPlays();
            // Always pull the latest admin-configured Telegram links so the
            // user-side buttons (channel / group / service / welcome popup)
            // open the right URLs.
            loadTelegramLinks();
            // Load the admin-uploaded plan table image (welcome popup + About page).
            loadPlanTableImage();

            document.getElementById('bottomNav').style.display = 'flex';
            switchView('home');
            db.ref('users/' + currentUser).on('value', (snap) => {
                userData = snap.val();
                updateUI();
                autoHarvest();
            });
            loadShopPlans();
            // Show the welcome popup on every fresh login / registration
            queueWelcomePopup();
        }

        /* ============================================ */
        /* --- WELCOME POPUP --- */
        /* ============================================ */
        // Declare at the very top of the script (hoisted) so it's always defined
        // even if other code throws before this point.
        var _welcomePopupTimer = null;
        function queueWelcomePopup() {
            try {
                if (_welcomePopupTimer) clearTimeout(_welcomePopupTimer);
                // Wait (max 3s) for the admin's plan table image so the popup doesn't show the default one first.
                const timer = setTimeout(function () {
                    waitForPlanTableImage(3000).then(function () {
                        if (_welcomePopupTimer === timer) showWelcomeModal();   // skip if closed / re-queued meanwhile
                    });
                }, 300);
                _welcomePopupTimer = timer;
            } catch (e) {
                // If anything goes wrong, just call showWelcomeModal directly
                console.error('queueWelcomePopup error, calling directly:', e);
                try { showWelcomeModal(); } catch (e2) { /* swallow */ }
            }
        }

        function showWelcomeModal() {
            try {
                const modal = document.getElementById('welcomeModal');
                if (!modal) {
                    console.warn('welcomeModal element not found');
                    return;
                }

                // Personalize the greeting with the user's name (or phone if missing)
                // Use typeof check + try/catch to be safe against TDZ or uninitialized vars
                const nameEl = document.getElementById('welcomeName');
                if (nameEl) {
                    let display = '';
                    try {
                        if (typeof userData !== 'undefined' && userData && typeof userData.name === 'string' && userData.name.trim()) {
                            display = userData.name.trim().split(/\s+/)[0];
                        }
                    } catch (e) { /* userData may be in TDZ */ }
                    try {
                        if (!display && typeof currentUser !== 'undefined' && currentUser) {
                            display = String(currentUser).slice(-4);
                        }
                    } catch (e) { /* currentUser may be in TDZ */ }
                    if (!display) display = 'Investor';
                    nameEl.textContent = display;
                }

                // Re-trigger the pop-in animation on every show
                const content = modal.querySelector('.modal-content');
                if (content) {
                    content.style.animation = 'none';
                    void content.offsetWidth;
                    content.style.animation = '';
                }

                // Show via class + inline style as a belt-and-suspenders approach.
                // This guarantees the popup is visible even if another rule tries
                // to override it (e.g. another modal with higher z-index).
                modal.classList.add('show');
                modal.setAttribute('aria-hidden', 'false');

                // Use !important inline style to override any CSS that might hide it
                modal.style.cssText = 'display: flex !important; z-index: 99999 !important; align-items: center !important; justify-content: center !important;';

                // Light confetti to celebrate — wrap in try/catch in case the lib
                // hasn't loaded yet (it loads before this file, but be safe).
                try {
                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 80,
                            spread: 70,
                            origin: { y: 0.45 },
                            colors: ['#2563eb', '#3b82f6', '#fde68a', '#0e7490', '#ec4899']
                        });
                    }
                } catch (e) { /* no-op */ }
            } catch (e) {
                console.error('showWelcomeModal failed:', e);
            }
        }

        function closeWelcomeModal() {
            const modal = document.getElementById('welcomeModal');
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
            if (_welcomePopupTimer) {
                clearTimeout(_welcomePopupTimer);
                _welcomePopupTimer = null;
            }
        }

        function autoHarvest() {
            if (!currentUser || !userData || !userData.plans) return;
            let totalAmount = 0;
            let updates = {};
            let hasUpdates = false;
            let now = Date.now();

            for (let key in userData.plans) {
                let uPlan = userData.plans[key];
                if (!uPlan.active) continue;

                if (!uPlan.lastClaimTimestamp) {
                    updates['plans/' + key + '/lastClaimTimestamp'] = now;
                    hasUpdates = true;
                    continue;
                }

                const msPerDay = 24 * 60 * 60 * 1000;
                let elapsedMs = now - uPlan.lastClaimTimestamp;

                if (elapsedMs >= msPerDay) {
                    let daysToClaim = Math.floor(elapsedMs / msPerDay);
                    let remainingDays = uPlan.duration - (uPlan.daysClaimed || 0);

                    if (daysToClaim > remainingDays) {
                        daysToClaim = remainingDays;
                    }

                    if (daysToClaim > 0) {
                        let amountToAdd = uPlan.daily * daysToClaim;
                        totalAmount += amountToAdd;

                        let newDaysClaimed = (uPlan.daysClaimed || 0) + daysToClaim;
                        let updatedPlan = {
                            ...uPlan,
                            daysClaimed: newDaysClaimed,
                            lastClaimDate: new Date(now).toDateString(),
                            lastClaimTimestamp: uPlan.lastClaimTimestamp + (daysToClaim * msPerDay),
                            active: (newDaysClaimed < uPlan.duration)
                        };
                        updates['plans/' + key] = updatedPlan;

                        // Log each daily credit as a separate income record so
                        // history shows one entry per credited day, not one lump sum.
                        for (let i = 0; i < daysToClaim; i++) {
                            const creditTs = uPlan.lastClaimTimestamp + ((i + 1) * msPerDay);
                            const incRef = db.ref('users/' + currentUser + '/incomes').push();
                            updates['incomes/' + incRef.key] = {
                                type: 'daily_income',
                                amount: uPlan.daily,
                                timestamp: creditTs,
                                date: new Date(creditTs).toLocaleString(),
                                planKey: key,
                                planName: uPlan.name || uPlan.planName || 'Investment Plan',
                                note: 'Day ' + (newDaysClaimed - daysToClaim + i + 1) + ' / ' + uPlan.duration
                            };
                        }

                        hasUpdates = true;
                    }
                }
            }

            if (totalAmount > 0) {
                updates['balance'] = (userData.balance || 0) + totalAmount;
                updates['income'] = (userData.income || 0) + totalAmount;
            }

            if (hasUpdates) {
                db.ref('users/' + currentUser).update(updates).then(() => {
                    if (totalAmount > 0) {
                        showToast(`Your investment return of ${totalAmount.toFixed(2)} ETB has been credited!`);
                    }
                    if(document.getElementById('view-orders').classList.contains('active-view')){
                        loadMyOrders();
                    }
                });
            }
        }

        setInterval(() => {
            if (currentUser) {
                autoHarvest();
            }
        }, 30000); 

        function switchView(viewName) {
            if(viewName === 'tasks') {
                if (typeof renderTasksPage === 'function') renderTasksPage();
            }
            if(viewName === 'team-salary') {
                if (typeof renderTeamSalaryPage === 'function') renderTeamSalaryPage();
            }


            if(viewName === 'deposit') {
                document.getElementById('depositStepAmount').style.display = 'block';
                document.getElementById('depositStepBank').style.display = 'none';
                document.getElementById('depositStepDetails').style.display = 'none';
                selectedPaynowBank = null;
                const depAmtEl = document.getElementById('depAmountPage');
                if (depAmtEl && document.activeElement !== depAmtEl) depAmtEl.value = '';
                const txIdEl = document.getElementById('depTxId');
                if (txIdEl) txIdEl.value = '';
                const sendEl = document.getElementById('depSenderName');
                if (sendEl) sendEl.value = '';
                const payBtn = document.getElementById('paynowPayBtn');
                if (payBtn) { payBtn.disabled = true; payBtn.style.opacity = '0.5'; }
            }

            if(viewName === 'withdraw') {
                document.getElementById('withDisplayBal').innerText = parseFloat(userData.balance || 0).toFixed(2);
                
                document.getElementById('withdrawInputs').style.display = 'none';
                document.getElementById('withdrawMsg').style.display = 'none';
                document.getElementById('withdrawNoInvestMsg').style.display = 'none';
                
                const hasActiveInvestment = userData && userData.plans && Object.keys(userData.plans).some(k => {
                    const p = userData.plans[k];
                    if (!p || !p.active) return false;
                    const duration = p.duration || 60;
                    const daysClaimed = p.daysClaimed || 0;
                    return daysClaimed < duration;
                });
                
                if (!hasActiveInvestment) {
                    document.getElementById('withdrawNoInvestMsg').style.display = 'block';
                } else if (!userData.bankInfo || !userData.bankInfo.bankName || !userData.bankInfo.withPass) {
                    document.getElementById('withdrawMsg').style.display = 'block';
                } else {
                    document.getElementById('withdrawInputs').style.display = 'block';
                }
            }
            
            if(viewName === 'invite') {
                if (userData && userData.refCode) {
                    const link = window.location.origin + window.location.pathname + '?ref=' + userData.refCode;
                    const codeEl = document.getElementById('inviteCodeText');
                    const linkEl = document.getElementById('inviteLinkText');
                    const qrEl = document.getElementById('inviteQrImg');
                    if (codeEl) codeEl.innerText = userData.refCode;
                    if (linkEl) linkEl.innerText = link;
                    if (qrEl) qrEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(link);
                }
            }
            if(viewName === 'team') {
                currentTeamLevel = 1;
                document.querySelectorAll('.team-tab').forEach(t => t.classList.remove('active'));
                const firstTab = document.querySelector('.team-tab[data-lv="1"]');
                if (firstTab) firstTab.classList.add('active');
                loadTeamData();
            }
            if(viewName === 'profile') calculateProfileStats();
            if(viewName === 'orders') loadMyOrders();
            if(viewName !== 'orders') {
                if (typeof stopPlanCountdowns === 'function') stopPlanCountdowns();
            }
            if(viewName === 'transactions') loadTransactions();

            if(viewName === 'home' || viewName === 'shop') {
                loadShopPlans();
            }
            
            if(viewName === 'bankcard') {
                const alreadyBound = !!(userData.bankInfo && userData.bankInfo.bankName && userData.bankInfo.accName && userData.bankInfo.accNum);
                const notice = document.getElementById('bankBoundNotice');
                const saveBtn = document.getElementById('bindBankSaveBtn');
                const accNameEl = document.getElementById('bindAccName');
                const accNumEl = document.getElementById('bindAccNum');
                const withPassEl = document.getElementById('bindWithPass');
                if (alreadyBound) {
                    document.getElementById('bindBankName').value = userData.bankInfo.bankName || 'CBE';
                    accNameEl.value = userData.bankInfo.accName || '';
                    accNumEl.value = userData.bankInfo.accNum || '';
                    accNameEl.readOnly = true;
                    accNumEl.readOnly = true;
                    accNameEl.style.background = '#f1f5f9';
                    accNumEl.style.background = '#f1f5f9';
                    accNameEl.style.cursor = 'not-allowed';
                    accNumEl.style.cursor = 'not-allowed';
                    withPassEl.parentElement.style.display = 'none';
                    if (notice) notice.style.display = 'block';
                    if (saveBtn) saveBtn.style.display = 'none';
                } else {
                    document.getElementById('bindBankName').value = 'CBE';
                    accNameEl.readOnly = false;
                    accNumEl.readOnly = false;
                    accNameEl.style.background = '';
                    accNumEl.style.background = '';
                    accNameEl.style.cursor = '';
                    accNumEl.style.cursor = '';
                    withPassEl.parentElement.style.display = '';
                    if (notice) notice.style.display = 'none';
                    if (saveBtn) saveBtn.style.display = '';
                }
            }

            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

            const targetView = document.getElementById('view-' + viewName);
            if(targetView) targetView.classList.add('active-view');

            let navId = 'nav-' + viewName;
            if(viewName === 'bankcard' || viewName === 'transactions' || viewName === 'changepass' || viewName === 'gift' || viewName === 'orders' || viewName === 'shop') navId = 'nav-profile';
            if(viewName === 'deposit' || viewName === 'withdraw' || viewName === 'info') navId = 'nav-home';
            if(viewName === 'team') navId = 'nav-team';
            if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
        }

        let currentTab = 'natural';

        function switchTab(tabName, el) {
            currentTab = (tabName === 'vip') ? 'vip' : 'natural';
            document.querySelectorAll('.tab-pill').forEach(t => t.classList.remove('active'));
            if (el) el.classList.add('active');
            if (typeof loadShopPlans === 'function') loadShopPlans();
        }

        function openChannel() {
            // Use the admin-configured channel link (with hard-coded fallback
            // for the first render before the live value arrives).
            const url = (typeof tgLinks !== 'undefined' && tgLinks && tgLinks.channel) || 'https://t.me/AgroChemChannel';
            window.open(url, '_blank');
        }

        function updateUI() {
            if (document.getElementById('headerName')) {
                document.getElementById('headerName').innerText = userData.name.split(" ")[0]; 
            }
            if (document.getElementById('displayBalance')) {
                document.getElementById('displayBalance').innerText = parseFloat(userData.balance || 0).toFixed(2);
            }
            if (document.getElementById('displayIncome')) {
                document.getElementById('displayIncome').innerText = parseFloat(userData.income || 0).toFixed(2);
            }
            if (document.getElementById('profBalance')) {
                document.getElementById('profBalance').innerText = parseFloat(userData.balance || 0).toFixed(2);
            }
            if (document.getElementById('profDailyIncome')) {
                document.getElementById('profDailyIncome').innerText = parseFloat(userData.income || 0).toFixed(2);
            }
            // New profile stats
            if (document.getElementById('profTotalText')) {
                document.getElementById('profTotalText').innerText = parseFloat(userData.balance || 0).toFixed(2) + ' ETB';
            }
            if (document.getElementById('profIncomeText')) {
                document.getElementById('profIncomeText').innerText = parseFloat(userData.income || 0).toFixed(2) + ' ETB';
            }
        }

        function calculateProfileStats() {
            // Populate phone number
            const phoneEl = document.getElementById('profilePhone');
            if (phoneEl && userData && userData.phone) {
                phoneEl.innerText = userData.phone;
            }

            // Populate the 3 new stat cells (Total = balance, Income = total returns, Recharge = total deposits)
            const totalText = document.getElementById('profTotalText');
            const incomeText = document.getElementById('profIncomeText');
            const rechargeText = document.getElementById('profRechargeText');
            if (totalText) totalText.innerText = parseFloat(userData.balance || 0).toFixed(2) + ' ETB';
            if (incomeText) incomeText.innerText = parseFloat(userData.income || 0).toFixed(2) + ' ETB';

            // Total recharge from approved deposits
            let totDep = 0;
            db.ref('deposits').once('value', (snap) => {
                if(snap.exists()) snap.forEach(c => { if(c.val().user === currentUser && c.val().status === 'approve') totDep += parseFloat(c.val().amount); });
                if (rechargeText) rechargeText.innerText = totDep.toFixed(2) + ' ETB';
                const oldProfTotDep = document.getElementById('profTotDep');
                if (oldProfTotDep) oldProfTotDep.innerText = totDep.toFixed(2);
            });

            // Total withdrawn
            let totWith = 0;
            db.ref('withdrawals').once('value', (snap) => {
                if(snap.exists()) snap.forEach(c => { if(c.val().user === currentUser && c.val().status === 'approve') totWith += parseFloat(c.val().amount); });
                const oldProfTotWith = document.getElementById('profTotWith');
                if (oldProfTotWith) oldProfTotWith.innerText = totWith.toFixed(2);
            });

            if (!userData || !userData.refCode) return;
            db.ref('users').once('value', (snap) => {
                if(!snap.exists()) return;
                const arr = Object.values(snap.val()); 
                const myCode = String(userData.refCode).trim().toUpperCase();
                
                const lvl1 = arr.filter(u => String(u.referredBy).trim().toUpperCase() === myCode);
                const l1c = lvl1.map(u => String(u.refCode).trim().toUpperCase());
                const lvl2 = arr.filter(u => l1c.includes(String(u.referredBy).trim().toUpperCase()));
                const l2c = lvl2.map(u => String(u.refCode).trim().toUpperCase());
                const lvl3 = arr.filter(u => l2c.includes(String(u.referredBy).trim().toUpperCase()));
                
                let inv1 = 0, inv2 = 0, inv3 = 0;
                lvl1.forEach(u => { if(u.plans && Object.keys(u.plans).length > 0) inv1++; });
                lvl2.forEach(u => { if(u.plans && Object.keys(u.plans).length > 0) inv2++; });
                lvl3.forEach(u => { if(u.plans && Object.keys(u.plans).length > 0) inv3++; });

                const team = [...lvl1, ...lvl2, ...lvl3];
                let investors = inv1 + inv2 + inv3;

                if(document.getElementById('teamTotalCnt')) document.getElementById('teamTotalCnt').innerText = team.length;
                if(document.getElementById('teamInvestCnt')) document.getElementById('teamInvestCnt').innerText = investors;
                
                if(document.getElementById('lvl1InvestCnt')) document.getElementById('lvl1InvestCnt').innerText = inv1;
                if(document.getElementById('lvl2InvestCnt')) document.getElementById('lvl2InvestCnt').innerText = inv2;
                if(document.getElementById('lvl3InvestCnt')) document.getElementById('lvl3InvestCnt').innerText = inv3;

                if(document.getElementById('teamTotComm')) document.getElementById('teamTotComm').innerText = parseFloat(userData.commission || 0).toFixed(2);
                
                if(document.getElementById('profTotalTeam')) {
                    document.getElementById('profTotalTeam').innerText = team.length;
                }
                if(document.getElementById('profInvestorTeam')) {
                    document.getElementById('profInvestorTeam').innerText = investors;
                }
            });
        }

        // --- Team Page (Level 1/2/3) ---
        let currentTeamLevel = 1;
        let teamLevelsData = { lvl1: [], lvl2: [], lvl3: [] };
        let teamLevelsRecharge = { lvl1: 0, lvl2: 0, lvl3: 0 };

        function loadTeamData() {
            if (!userData || !userData.refCode) {
                renderTeamPage();
                return;
            }

            const myCode = String(userData.refCode).trim().toUpperCase();

            db.ref('users').once('value', (snap) => {
                if (!snap.exists()) {
                    teamLevelsData = { lvl1: [], lvl2: [], lvl3: [] };
                    teamLevelsRecharge = { lvl1: 0, lvl2: 0, lvl3: 0 };
                    renderTeamPage();
                    return;
                }
                const arr = Object.values(snap.val());

                const lvl1 = arr.filter(u => String(u.referredBy || '').trim().toUpperCase() === myCode);
                const l1c = lvl1.map(u => String(u.refCode || '').trim().toUpperCase()).filter(Boolean);
                const lvl2 = arr.filter(u => l1c.includes(String(u.referredBy || '').trim().toUpperCase()));
                const l2c = lvl2.map(u => String(u.refCode || '').trim().toUpperCase()).filter(Boolean);
                const lvl3 = arr.filter(u => l2c.includes(String(u.referredBy || '').trim().toUpperCase()));

                teamLevelsData = { lvl1, lvl2, lvl3 };

                db.ref('deposits').once('value', (depSnap) => {
                    const deposits = depSnap.exists() ? depSnap.val() : {};
                    const depositByUser = {};
                    for (let key in deposits) {
                        const d = deposits[key];
                        if (d && d.status === 'approve' && d.user) {
                            depositByUser[d.user] = (depositByUser[d.user] || 0) + parseFloat(d.amount || 0);
                        }
                    }

                    const sumRecharge = (users) => users.reduce((sum, u) => sum + (depositByUser[u.phone] || 0), 0);

                    teamLevelsRecharge = {
                        lvl1: sumRecharge(lvl1),
                        lvl2: sumRecharge(lvl2),
                        lvl3: sumRecharge(lvl3)
                    };

                    renderTeamPage();
                });
            });
        }

        function renderTeamPage() {
            const level = currentTeamLevel;
            const users = (teamLevelsData && teamLevelsData['lvl' + level]) || [];
            // Team Recharge is the combined total of all 3 levels (not just the selected tab)
            const recharge = ((teamLevelsRecharge && teamLevelsRecharge.lvl1) || 0) +
                             ((teamLevelsRecharge && teamLevelsRecharge.lvl2) || 0) +
                             ((teamLevelsRecharge && teamLevelsRecharge.lvl3) || 0);

            const header = document.getElementById('teamHeaderTitle');
            if (header) header.textContent = 'Level ' + level + ' Team';

            const rechargeEl = document.getElementById('teamRechargeTotal');
            const membersEl = document.getElementById('teamMembersTotal');
            if (rechargeEl) rechargeEl.textContent = 'ETB ' + recharge.toFixed(2);
            if (membersEl) membersEl.textContent = users.length;

            const emptyLevelEl = document.getElementById('teamEmptyLevel');
            if (emptyLevelEl) emptyLevelEl.textContent = level;

            const listEl = document.getElementById('teamMembersList');
            const emptyEl = document.getElementById('teamEmpty');
            if (!listEl) return;

            // Remove existing member cards
            const oldCards = listEl.querySelectorAll('.team-member-card');
            oldCards.forEach(c => c.remove());

            if (users.length === 0) {
                if (emptyEl) emptyEl.style.display = 'flex';
                return;
            }

            if (emptyEl) emptyEl.style.display = 'none';

            users.forEach(u => {
                const isActive = u.plans && Object.keys(u.plans).length > 0;
                const phone = u.phone || '';
                const displayName = u.name || ('Investor_' + (phone ? phone.slice(-4) : '****'));
                const card = document.createElement('div');
                card.className = 'team-member-card';
                card.innerHTML =
                    '<div class="team-member-avatar"><i class="fa-solid fa-user"></i></div>' +
                    '<div class="team-member-info">' +
                        '<div class="team-member-name">' + escapeHtml(displayName) + '</div>' +
                        '<div class="team-member-phone">' + escapeHtml(phone) + '</div>' +
                    '</div>' +
                    '<div class="team-member-status" style="color:' + (isActive ? 'var(--primary-color)' : 'var(--text-muted)') + ';">' +
                        (isActive ? 'Active' : 'Inactive') +
                    '</div>';
                listEl.appendChild(card);
            });
        }

        function switchTeamLevel(level, el) {
            if (level !== 1 && level !== 2 && level !== 3) return;
            currentTeamLevel = level;
            document.querySelectorAll('.team-tab').forEach(t => t.classList.remove('active'));
            if (el) el.classList.add('active');
            renderTeamPage();
        }

        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // Download the "agro.apk" file that lives in the same directory as this
        // page. The file is served as an Android application package, so the
        // download attribute keeps the filename intact on the user's device.
        function downloadApp() {
            const url = 'agro.apk';
            const a = document.createElement('a');
            a.href = url;
            a.download = 'agro.apk';
            a.rel = 'noopener';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // ============ DAILY TASKS ============
        const TASK_DEFS = [
            {
                id: 'checkin',
                icon: 'fa-calendar-check',
                title: 'Daily Check-in',
                desc: 'Check in every day to build your streak and earn ETB.',
                reward: 10,
                target: 'checkin'
            },
            {
                id: 'first_recharge',
                icon: 'fa-money-bill-wave',
                title: 'First Recharge',
                desc: 'Make your first deposit to unlock this reward.',
                reward: 20,
                target: 'recharge'
            },
            {
                id: 'subscribe_plan',
                icon: 'fa-cube',
                title: 'Subscribe to a Plan',
                desc: 'Buy any investment plan to qualify.',
                reward: 20,
                target: 'plan'
            },
            {
                id: 'invite_friend',
                icon: 'fa-user-plus',
                title: 'Invite a Friend',
                desc: 'Invite a friend who subscribes to a plan to earn this reward.',
                reward: 30,
                target: 'invite'
            },
            {
                id: 'bind_bank',
                icon: 'fa-building-columns',
                title: 'Bind Bank Card',
                desc: 'Save your withdrawal bank details.',
                reward: 10,
                target: 'bank'
            }
        ];

        function getTaskState() {
            try {
                const raw = localStorage.getItem('taskState_' + currentUser);
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return { completed: {}, streak: 0, lastCheckinDate: null, claimed: {}, totalEarned: 0 };
        }

        function saveTaskState(state) {
            try {
                localStorage.setItem('taskState_' + currentUser, JSON.stringify(state));
            } catch (e) {}
        }

        function todayStr() {
            const d = new Date();
            return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        }

        function yesterdayStr() {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        }

        function isTaskNativelyDone(taskId) {
            if (!userData) return Promise.resolve(false);
            switch (taskId) {
                case 'first_recharge':
                    // Approximation: if user has a non-zero balance or has any recorded deposits
                    return Promise.resolve(
                        (userData.totalRecharge && userData.totalRecharge > 0) ||
                        (userData.firstDepositDone === true)
                    );
                case 'subscribe_plan':
                    return Promise.resolve(userData.plans && Object.keys(userData.plans).length > 0);
                case 'bind_bank':
                    return Promise.resolve(!!(userData.bankName && userData.accountNumber));
                case 'invite_friend':
                    return checkInvitedFriendInvested();
                default:
                    return Promise.resolve(false);
            }
        }

        function checkInvitedFriendInvested() {
            return new Promise((resolve) => {
                if (!userData || !userData.refCode || typeof db === 'undefined') {
                    return resolve(false);
                }
                const myCode = String(userData.refCode).trim().toUpperCase();
                db.ref('users').once('value', (snap) => {
                    if (!snap || !snap.exists()) return resolve(false);
                    let found = false;
                    snap.forEach(c => {
                        if (found) return;
                        const u = c.val();
                        if (!u) return;
                        if (String(u.referredBy || '').trim().toUpperCase() === myCode) {
                            if (u.plans && Object.keys(u.plans).length > 0) {
                                found = true;
                            }
                        }
                    });
                    resolve(found);
                }, () => resolve(false));
            });
        }

        async function renderTasksPage() {
            const container = document.getElementById('tasksList');
            if (!container) return;
            const state = getTaskState();

            // Auto-reset daily check-in if a new day (stays cleared until today's check-in)
            if (state.completed['checkin'] && state.completed['checkin'] !== todayStr()) {
                delete state.completed['checkin'];
                state.lastCheckinDate = null;
                saveTaskState(state);
            }

            // Break streak if a full day was missed
            if (state.lastCheckinDate &&
                state.lastCheckinDate !== todayStr() &&
                state.lastCheckinDate !== yesterdayStr()) {
                state.streak = 0;
                saveTaskState(state);
            }

            // Auto-mark natively-done tasks as completed if not already
            let dirty = false;
            for (const t of TASK_DEFS) {
                if (!state.completed[t.id]) {
                    const done = await isTaskNativelyDone(t.id);
                    if (done) {
                        state.completed[t.id] = todayStr();
                        dirty = true;
                    }
                }
            }
            if (dirty) saveTaskState(state);

            // Summary
            const total = TASK_DEFS.length;
            const done = TASK_DEFS.filter(t => !!state.completed[t.id]).length;
            const earned = state.totalEarned || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            const sumCount = document.getElementById('tasksCompletedCount');
            const sumEarned = document.getElementById('tasksEarnedTotal');
            const sumBar = document.getElementById('tasksProgressBar');
            const sumStreak = document.getElementById('tasksStreakCount');
            if (sumCount) sumCount.textContent = done + ' / ' + total;
            if (sumEarned) sumEarned.textContent = 'Earned ' + earned.toFixed(2) + ' ETB from tasks';
            if (sumBar) sumBar.style.width = pct + '%';
            if (sumStreak) sumStreak.textContent = state.streak || 0;

            // Task cards
            container.innerHTML = '';
            TASK_DEFS.forEach(t => {
                const completed = !!state.completed[t.id];
                const isCheckin = t.id === 'checkin';
                let btnLabel, btnClass, btnAction, actionArg = null;

                if (completed && !isCheckin) {
                    btnLabel = 'Done';
                    btnClass = 'done';
                    btnAction = null;
                } else if (isCheckin && state.lastCheckinDate === todayStr()) {
                    btnLabel = 'Claimed';
                    btnClass = 'done';
                    btnAction = null;
                } else if (isCheckin) {
                    btnLabel = 'Check In';
                    btnClass = 'claim';
                    btnAction = 'claim';
                } else {
                    btnLabel = 'Go';
                    btnClass = '';
                    btnAction = 'go';
                    actionArg = t.target;
                }

                const card = document.createElement('div');
                card.className = 'task-card' + (completed ? ' done' : '');

                const iconBox = document.createElement('div');
                iconBox.className = 'task-icon';
                iconBox.innerHTML = completed
                    ? '<i class="fa-solid fa-check"></i>'
                    : '<i class="fa-solid ' + t.icon + '"></i>';

                const info = document.createElement('div');
                info.className = 'task-info';
                info.innerHTML =
                    '<div class="task-title">' + escapeHtml(t.title) + '</div>' +
                    '<div class="task-desc">' + escapeHtml(t.desc) + '</div>' +
                    '<span class="task-reward"><i class="fa-solid fa-coins"></i> +' + t.reward + ' ETB</span>';

                card.appendChild(iconBox);
                card.appendChild(info);

                if (btnAction) {
                    const btn = document.createElement('button');
                    btn.className = 'task-action ' + btnClass;
                    btn.textContent = btnLabel;
                    btn.onclick = function() {
                        if (btnAction === 'claim') claimTask(t.id);
                        else if (btnAction === 'go') goTaskTarget(actionArg);
                    };
                    card.appendChild(btn);
                } else {
                    const span = document.createElement('span');
                    span.className = 'task-action done';
                    span.textContent = btnLabel;
                    card.appendChild(span);
                }

                container.appendChild(card);
            });
        }

        function claimTask(taskId) {
            if (!currentUser) return showToast('Please log in first');
            if (taskId !== 'checkin') return;

            const state = getTaskState();
            if (state.lastCheckinDate === todayStr()) return showToast('Already checked in today');

            // Update streak
            if (state.lastCheckinDate === yesterdayStr()) {
                state.streak = (state.streak || 0) + 1;
            } else {
                state.streak = 1;
            }
            state.lastCheckinDate = todayStr();
            state.completed['checkin'] = todayStr();

            // Credit reward
            const t = TASK_DEFS.find(x => x.id === taskId);
            const reward = t ? t.reward : 0;
            state.totalEarned = (state.totalEarned || 0) + reward;
            saveTaskState(state);

            const newBalance = (userData.balance || 0) + reward;
            db.ref('users/' + currentUser).update({ balance: newBalance }).then(() => {
                userData.balance = newBalance;
                showToast('Checked in! +' + reward + ' ETB  (Streak: ' + state.streak + ' days)');
                renderTasksPage();
                if (typeof updateUI === 'function') updateUI();
            });
        }

        function goTaskTarget(target) {
            switch (target) {
                case 'recharge': switchView('deposit'); break;
                case 'plan':     switchView('shop'); break;
                case 'invite':   switchView('invite'); break;
                case 'bank':     switchView('bankcard'); break;
                default:         showToast('Coming soon');
            }
        }

        // ============ Daily Team Salary ============
        // Tier-based salary: based on number of ACTIVE investors in the team.
        // "Active" = a team member who has bought at least one plan.
        // Higher tiers replace lower ones — user earns the highest tier reached.
        // Tracked in userData.lastTeamSalaryDate and userData.totalTeamSalary.
        const TEAM_SALARY_TIERS = [
            { tier: 1, required: 5,   reward: 30,   icon: 'fa-medal' },
            { tier: 2, required: 12,  reward: 70,   icon: 'fa-medal' },
            { tier: 3, required: 20,  reward: 150,  icon: 'fa-trophy' },
            { tier: 4, required: 40,  reward: 500,  icon: 'fa-trophy' },
            { tier: 5, required: 60,  reward: 1000, icon: 'fa-crown' }
        ];

        // Count active investors across all team levels (L1, L2, L3).
        // A member is "active" if they have at least one plan purchase.
        function countActiveInvestors() {
            let count = 0;
            try {
                const data = (typeof teamLevelsData !== 'undefined') ? teamLevelsData : null;
                if (!data) return 0;
                for (const lvl of ['lvl1', 'lvl2', 'lvl3']) {
                    const arr = data[lvl] || [];
                    for (const u of arr) {
                        if (u && u.plans && Object.keys(u.plans).length > 0) count++;
                    }
                }
            } catch (e) {}
            return count;
        }

        // Find the highest tier the user qualifies for, given an active-investor count.
        // Returns { tier, reward, required } or null if no tier met.
        function findCurrentTier(activeCount) {
            let current = null;
            for (const t of TEAM_SALARY_TIERS) {
                if (activeCount >= t.required) current = t;
            }
            return current;
        }

        // Compute today's salary based on the active-investor count.
        function calcTeamSalary() {
            const active = countActiveInvestors();
            const current = findCurrentTier(active);
            const reward = current ? current.reward : 0;
            return {
                active: active,
                tier: current ? current.tier : 0,
                reward: reward,
                total: reward
            };
        }

        function renderTeamSalaryPage() {
            // Make sure team data is fresh
            if (typeof loadTeamData === 'function') {
                try { loadTeamData(); } catch (e) {}
            }

            const salary = calcTeamSalary();
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

            // Summary
            set('teamSalaryActive', salary.active);
            set('teamSalaryToday', salary.reward.toFixed(2));
            if (salary.tier > 0) {
                set('teamSalaryTierLabel', 'Level ' + salary.tier + ' reached · earning ' + salary.reward + ' ETB/day');
            } else {
                const need = TEAM_SALARY_TIERS[0].required;
                const left = Math.max(0, need - salary.active);
                set('teamSalaryTierLabel', 'Need ' + left + ' more active investors for Level 1');
            }

            // Per-tier status
            for (const t of TEAM_SALARY_TIERS) {
                const card = document.getElementById('teamSalaryTier' + t.tier);
                const desc = document.getElementById('teamSalaryTier' + t.tier + 'Desc');
                if (!card || !desc) continue;

                // Reset classes
                card.classList.remove('done', 'completed-stamp');
                card.style.borderLeft = '';
                card.style.background = '';

                if (salary.tier === t.tier) {
                    // Currently active tier
                    desc.textContent = 'Current tier · ' + salary.active + ' active investors';
                    card.style.borderLeft = '6px solid var(--primary-color)';
                    card.style.background = '#eff6ff';
                } else if (salary.tier > t.tier) {
                    // Lower tier that was surpassed — visually marked as stopped
                    desc.textContent = 'Replaced by Level ' + salary.tier + ' (no longer pays)';
                    card.style.opacity = '0.55';
                } else {
                    // Future tier — show progress
                    const left = Math.max(0, t.required - salary.active);
                    card.style.opacity = '1';
                    if (left > 0) {
                        desc.textContent = 'Need ' + left + ' more active investors';
                    } else {
                        desc.textContent = 'Reached · claim to activate';
                    }
                }
            }

            // Update claim button state
            const btn = document.getElementById('teamSalaryClaimBtn');
            if (btn) {
                const claimedToday = userData && userData.lastTeamSalaryDate === todayStr();
                if (claimedToday) {
                    btn.disabled = true;
                    btn.style.opacity = '0.55';
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Claimed Today';
                } else {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> Claim ' + salary.reward.toFixed(0) + ' ETB Today';
                }
            }
        }

        function claimTeamSalary() {
            if (!userData) return showToast('Please log in first');
            if (userData.lastTeamSalaryDate === todayStr()) {
                return showToast('Already claimed today');
            }
            if (!currentUser) return showToast('Session error');

            const salary = calcTeamSalary();
            if (salary.reward <= 0) {
                return showToast('No salary to claim today. Invite investors to start earning.');
            }

            const claimAmount = parseFloat(salary.reward.toFixed(2));
            const ts = Date.now();
            const incRef = db.ref('users/' + currentUser + '/incomes').push();
            const updates = {
                lastTeamSalaryDate: todayStr(),
                totalTeamSalary: (parseFloat(userData.totalTeamSalary || 0)) + claimAmount,
                balance: (parseFloat(userData.balance || 0)) + claimAmount,
                ['incomes/' + incRef.key]: {
                    type: 'team_salary',
                    amount: claimAmount,
                    timestamp: ts,
                    date: new Date(ts).toLocaleString(),
                    tier: salary.tier || 0,
                    activeInvestors: salary.active || 0,
                    note: 'Daily team salary · Tier ' + (salary.tier || 0)
                }
            };

            db.ref('users/' + currentUser).update(updates).then(() => {
                userData.lastTeamSalaryDate = updates.lastTeamSalaryDate;
                userData.totalTeamSalary = updates.totalTeamSalary;
                userData.balance = updates.balance;
                renderTeamSalaryPage();
                if (typeof updateBalanceUI === 'function') updateBalanceUI();
                showToast('Claimed ' + claimAmount.toFixed(2) + ' ETB team salary!');
                try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
                if (typeof loadTransactions === 'function' && document.getElementById('view-transactions').classList.contains('active-view')) {
                    loadTransactions();
                }
            }).catch(err => {
                showToast('Claim failed: ' + (err && err.message ? err.message : 'unknown'));
            });
        }

        let plansListenerAttached = false;
        let plansLoadTimeout = null;

        function renderPlanCard(plan, key) {
            let pCount = 0;
            if (userData && userData.plans) {
                for (let pk in userData.plans) {
                    if (userData.plans[pk].planId === key) pCount++;
                }
            }
            
            const limit = (plan.limit !== undefined && plan.limit !== null && plan.limit !== "") ? parseInt(plan.limit) : 1;
            const duration = plan.duration || 60;
            const totalRevenue = parseFloat((plan.roi * duration).toFixed(2));
            
            let btnTxt = "Buy";
            let dis = "";
            let isPresale = false;

            if (limit === 0) {
                btnTxt = "Presale";
                dis = "disabled";
                isPresale = true;
            } else if (pCount >= limit) { 
                btnTxt = "Sold Out"; 
                dis = "disabled"; 
            }

            const defaultImg = (plan.price >= 5000) ? 'product-mixed.png' : 'product-orange.png';

            const planCat = (plan.category === 'vip') ? 'vip' : 'natural';
            const catBadge = (planCat === 'vip')
                ? '<span style="display:inline-block; margin-left:6px; padding:2px 8px; border-radius: 0; font-size:0.6rem; font-weight:700; letter-spacing:0.3px; background:linear-gradient(135deg,#f59e0b,#d97706); color:white; vertical-align:middle;">VIP</span>'
                : '<span style="display:inline-block; margin-left:6px; padding:2px 8px; border-radius: 0; font-size:0.6rem; font-weight:700; letter-spacing:0.3px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:white; vertical-align:middle;">STD</span>';

            return `
            <div class="product-tile animate-up">
                <div class="product-tile-img">
                    <img src="${plan.img || defaultImg}" onerror="this.src='product-orange.png'">
                </div>
                <div class="product-tile-body">
                    <div class="product-tile-name">${plan.name}${catBadge}</div>
                    <div class="product-tile-rows">
                        <div class="product-tile-row">
                            <span class="lbl">Price:</span>
                            <span class="val">ETB ${plan.price}</span>
                        </div>
                        <div class="product-tile-row">
                            <span class="lbl">Daily:</span>
                            <span class="val">ETB ${plan.roi}</span>
                        </div>
                        <div class="product-tile-row">
                            <span class="lbl">Days:</span>
                            <span class="val">${duration}</span>
                        </div>
                        <div class="product-tile-row total">
                            <span class="lbl">Total:</span>
                            <span class="val">ETB ${totalRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                    <button class="product-tile-btn" ${dis} onclick="buyPlan('${key}', ${plan.price}, ${plan.roi}, ${limit}, ${duration}, '${plan.category || 'natural'}')">${btnTxt}</button>
                </div>
            </div>`;
        }

        function showPlansLoadingState() {
            const loadingHtml = "<p style='grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:20px;'><i class='fa-solid fa-spinner fa-spin' style='font-size:1.5rem; color:var(--primary-color);'></i><br><br>Loading plans...</p>";
            const shopC = document.getElementById('shopPlanList');
            const homeC = document.getElementById('homePlanList');
            if (shopC) shopC.innerHTML = loadingHtml;
            if (homeC) homeC.innerHTML = loadingHtml;
        }

        function showPlansErrorState(errMsg) {
            const errorHtml = "<div style='grid-column: 1 / -1; text-align:center; padding:20px;'>" +
                "<i class='fa-solid fa-triangle-exclamation' style='font-size:2.5rem; color:#ef4444; margin-bottom:10px;'></i>" +
                "<p style='color:#ef4444; font-weight:600; margin-bottom:5px;'>Failed to load plans</p>" +
                "<p style='color:var(--text-muted); font-size:0.8rem; margin-bottom:15px;'>" + (errMsg || 'Check your connection or Firebase rules.') + "</p>" +
                "<button onclick='loadShopPlans()' style='background:var(--primary-color); color:white; border:none; padding:10px 20px; border-radius: 0; cursor:pointer; font-weight:600;'>" +
                "<i class='fa-solid fa-refresh'></i> Retry</button></div>";
            const shopC = document.getElementById('shopPlanList');
            const homeC = document.getElementById('homePlanList');
            if (shopC) shopC.innerHTML = errorHtml;
            if (homeC) homeC.innerHTML = errorHtml;
        }

        function showPlansEmptyState() {
            const emptyHtml = "<div style='grid-column: 1 / -1; text-align:center; padding:30px 20px;'>" +
                "<i class='fa-solid fa-box-open' style='font-size:3rem; color:var(--text-muted); margin-bottom:10px; opacity:0.5;'></i>" +
                "<p style='color:var(--text-muted); font-weight:600;'>No investment plans available yet</p>" +
                "<p style='color:var(--text-muted); font-size:0.85rem; margin-top:5px;'>The admin hasn't published any plans. Please check back later.</p>" +
                "<button onclick='loadShopPlans()' style='background:var(--primary-color); color:white; border:none; padding:8px 16px; border-radius: 0; cursor:pointer; margin-top:15px;'>" +
                "<i class='fa-solid fa-refresh'></i> Refresh</button></div>";
            const shopC = document.getElementById('shopPlanList');
            const homeC = document.getElementById('homePlanList');
            if (shopC) shopC.innerHTML = emptyHtml;
            if (homeC) homeC.innerHTML = emptyHtml;
        }

        function loadShopPlans() {
            showPlansLoadingState();

            if (plansLoadTimeout) {
                clearTimeout(plansLoadTimeout);
                plansLoadTimeout = null;
            }

            if (plansListenerAttached) {
                db.ref('plans').off('value');
                plansListenerAttached = false;
            }

            plansLoadTimeout = setTimeout(() => {
                const shopC = document.getElementById('shopPlanList');
                const homeC = document.getElementById('homePlanList');
                const stillLoading = (shopC && shopC.innerHTML.indexOf('Loading') !== -1) ||
                                     (homeC && homeC.innerHTML.indexOf('Loading') !== -1);
                if (stillLoading) {
                    console.warn('Plans load timed out');
                    showPlansErrorState('Request timed out. Your Firebase database rules may be blocking reads, or you have no internet connection.');
                }
            }, 10000);

            db.ref('plans').on('value', (snapshot) => {
                if (plansLoadTimeout) {
                    clearTimeout(plansLoadTimeout);
                    plansLoadTimeout = null;
                }
                plansListenerAttached = true;

                const container = document.getElementById('shopPlanList');
                const homeContainer = document.getElementById('homePlanList'); 
                
                if (container) container.innerHTML = ""; 
                if (homeContainer) homeContainer.innerHTML = ""; 

                if (!snapshot.exists()) {
                    showPlansEmptyState();
                    return;
                }

                let homeCount = 0;
                snapshot.forEach((childSnap) => {
                    const plan = childSnap.val(); 
                    const key = childSnap.key;
                    const planCat = (plan.category === 'vip') ? 'vip' : 'natural';
                    const planHtml = renderPlanCard(plan, key);

                    // Shop view shows ALL plans (admin may want to see everything at a glance)
                    if (container) container.insertAdjacentHTML('beforeend', planHtml);

                    // Home view filters by the active tab (natural / vip)
                    if (homeContainer && planCat === currentTab) {
                        homeContainer.insertAdjacentHTML('beforeend', planHtml);
                        homeCount++;
                    }
                });

                if (homeContainer && homeCount === 0) {
                    const tabLabel = (currentTab === 'vip') ? 'VIP' : 'Standard';
                    homeContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:30px 10px;">
                        <i class="fa-solid fa-box-open" style="font-size:1.8rem; color:var(--primary-color); opacity:0.5; display:block; margin-bottom:10px;"></i>
                        No ${tabLabel} plans yet. Add one from the admin panel.
                    </p>`;
                }
            }, (error) => {
                console.error('Firebase plans load error:', error);
                if (plansLoadTimeout) {
                    clearTimeout(plansLoadTimeout);
                    plansLoadTimeout = null;
                }
                showPlansErrorState(error.message || 'Permission denied or connection lost.');
            });
        }

        function buyPlan(planId, cost, dailyRate, limit, duration, category) {
            if (limit === 0) return showToast("This plan is coming soon!");
            let pCount = 0;
            if(userData.plans) for(let pk in userData.plans) if(userData.plans[pk].planId === planId) pCount++;
            if(pCount >= limit) return showToast("Subscription Limit Reached!");

            // B-Natural-VIP is gated behind having bought at least one B-Natural plan.
            if (category === 'vip') {
                const ownsNatural = userData.plans && Object.keys(userData.plans).some(pk => {
                    const p = userData.plans[pk];
                    return p && p.category === 'natural';
                });
                if (!ownsNatural) {
                    return showToast("You must buy at least one B-Natural plan first");
                }
            }

            if(userData.balance < cost) return showToast("Insufficient Balance");

            const isFirst = (!userData.plans || Object.keys(userData.plans).length === 0);
            const newBal = userData.balance - cost;
            const newPlans = userData.plans || {};
            const uniqueKey = planId + '_' + Date.now();

            newPlans[uniqueKey] = {
                active: true, planId: planId, daily: dailyRate,
                duration: duration, daysClaimed: 0,
                category: category || 'natural',
                lastClaimDate: new Date().toDateString(),
                lastClaimTimestamp: Date.now()
            };

            db.ref('users/' + currentUser).update({ balance: newBal, plans: newPlans }).then(() => {
                showToast("Plan Subscribed!");
                if(userData.referredBy && userData.referredBy !== 'admin') {
                    distributeCommissions(userData.referredBy, cost, isFirst);
                }
                updateUI(); loadShopPlans();
            });
        }

        function distributeCommissions(refCode, amount, isFirst) {
            // Referral commission is paid ONLY on the user's first product purchase.
            // Any subsequent product purchases earn no commission for the referrer chain.
            if (!isFirst) return;
            if (!refCode || refCode === 'admin') return;

            // Use the refCode -> userKey reverse index instead of reading all users.
            // This works with the locked-down security rules (users.* requires auth,
            // and the index is publicly readable by code).
            db.ref('refCodeIndex/' + refCode).once('value', (idxSnap) => {
                if (!idxSnap.exists()) return; // referrer not found (or signed up before the index existed)
                const u1Key = idxSnap.val();
                db.ref('users/' + u1Key).once('value', (u1Snap) => {
                    if (!u1Snap.exists()) return;
                    const u1 = u1Snap.val();
                    // Level 1: 25%
                    const lvl1Amount = amount * 0.25;
                    const ts = Date.now();
                    const lvl1Ref = db.ref('users/' + u1Key + '/incomes').push();
                    db.ref('users/' + u1Key).update({
                        balance: (u1.balance || 0) + lvl1Amount,
                        commission: (u1.commission || 0) + lvl1Amount,
                        ['incomes/' + lvl1Ref.key]: {
                            type: 'referral',
                            amount: lvl1Amount,
                            timestamp: ts,
                            date: new Date(ts).toLocaleString(),
                            level: 1,
                            fromUser: currentUser || '',
                            note: 'Level 1 referral commission (25%)'
                        }
                    });
                    // Level 2: 3%
                    if (u1.referredBy && u1.referredBy !== 'admin') {
                        db.ref('refCodeIndex/' + u1.referredBy).once('value', (idx2Snap) => {
                            if (!idx2Snap.exists()) return;
                            const u2Key = idx2Snap.val();
                            db.ref('users/' + u2Key).once('value', (u2Snap) => {
                                if (!u2Snap.exists()) return;
                                const u2 = u2Snap.val();
                                const lvl2Amount = amount * 0.03;
                                const lvl2Ref = db.ref('users/' + u2Key + '/incomes').push();
                                db.ref('users/' + u2Key).update({
                                    balance: (u2.balance || 0) + lvl2Amount,
                                    commission: (u2.commission || 0) + lvl2Amount,
                                    ['incomes/' + lvl2Ref.key]: {
                                        type: 'referral',
                                        amount: lvl2Amount,
                                        timestamp: ts,
                                        date: new Date(ts).toLocaleString(),
                                        level: 2,
                                        fromUser: currentUser || '',
                                        note: 'Level 2 referral commission (3%)'
                                    }
                                });
                                // Level 3: 2%
                                if (u2.referredBy && u2.referredBy !== 'admin') {
                                    db.ref('refCodeIndex/' + u2.referredBy).once('value', (idx3Snap) => {
                                        if (!idx3Snap.exists()) return;
                                        const u3Key = idx3Snap.val();
                                        db.ref('users/' + u3Key).once('value', (u3Snap) => {
                                            if (!u3Snap.exists()) return;
                                            const u3 = u3Snap.val();
                                            const lvl3Amount = amount * 0.02;
                                            const lvl3Ref = db.ref('users/' + u3Key + '/incomes').push();
                                            db.ref('users/' + u3Key).update({
                                                balance: (u3.balance || 0) + lvl3Amount,
                                                commission: (u3.commission || 0) + lvl3Amount,
                                                ['incomes/' + lvl3Ref.key]: {
                                                    type: 'referral',
                                                    amount: lvl3Amount,
                                                    timestamp: ts,
                                                    date: new Date(ts).toLocaleString(),
                                                    level: 3,
                                                    fromUser: currentUser || '',
                                                    note: 'Level 3 referral commission (2%)'
                                                }
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            });
        }

        function closeModal(id) {
            document.getElementById(id).style.display = 'none'; 
            if(id === 'claimSuccessModal') {
                document.getElementById('claimModalTitle').innerText = "Returns Credited!";
                document.getElementById('claimModalIcon').className = "fa-solid fa-flask-vial";
                document.getElementById('claimModalIcon').style.color = "var(--primary-color)";
                document.getElementById('claimModalDesc').innerText = "Your daily return is ready.";
            }
        }

        function loadMyOrders() {
            const container = document.getElementById('myOrdersList');
            container.innerHTML = "";
            if (!userData.plans || Object.keys(userData.plans).length === 0) {
                renderOrdersEmpty(container);
                updatePlanSummary(0, 0, 0);
                stopPlanCountdowns();
                return;
            }

            const now = Date.now();
            const msPerDay = 24 * 60 * 60 * 1000;

            db.ref('plans').once('value', (snap) => {
                const allPlans = snap.val() || {};
                const planData = [];

                for (let key in userData.plans) {
                    const uPlan = userData.plans[key];
                    if (!uPlan) continue;
                    if (!uPlan.active && !(uPlan.daysClaimed >= (uPlan.duration || 60))) continue;
                    const pid = uPlan.planId || key;
                    const pDetail = allPlans[pid] || { name: "Investment Plan" };
                    planData.push({ key, uPlan, pDetail, msPerDay });
                }

                if (planData.length === 0) {
                    renderOrdersEmpty(container);
                    updatePlanSummary(0, 0, 0);
                    stopPlanCountdowns();
                    return;
                }

                // Build new redesigned cards
                planData.forEach(({ key, uPlan, pDetail, msPerDay }) => {
                    const duration = uPlan.duration || 60;
                    const daysClaimed = uPlan.daysClaimed || 0;
                    const isExpired = daysClaimed >= duration;
                    const lastTs = uPlan.lastClaimTimestamp || now;
                    const dailyAmount = parseFloat(uPlan.daily) || 0;
                    const principal = parseFloat(uPlan.amount || uPlan.price || (dailyAmount * duration / 2)) || 0;
                    const totalEarned = dailyAmount * daysClaimed;
                    const progressPct = Math.min(100, Math.round((daysClaimed / duration) * 100));

                    const cardHtml = `
                        <div class="plan-card animate-up" data-plan-key="${key}">
                            <div class="plan-card-head">
                                <div class="plan-card-head-row">
                                    <div class="plan-card-icon"><i class="fa-solid fa-flask-vial"></i></div>
                                    <div class="plan-card-name">${escapeHtml(pDetail.name)}</div>
                                    <span class="plan-card-status ${isExpired ? 'expired' : ''}">${isExpired ? 'Completed' : 'Active'}</span>
                                </div>
                                <div class="plan-card-daily-label">Daily Income</div>
                                <div class="plan-card-daily-val">
                                    <span>${dailyAmount.toFixed(2)}</span><small>ETB</small>
                                </div>
                            </div>
                            <div class="plan-card-body">
                                <div class="plan-countdown-wrap">
                                    <div class="plan-ring">
                                        <svg viewBox="0 0 100 100">
                                            <circle class="plan-ring-bg" cx="50" cy="50" r="44" fill="none" stroke-width="9"></circle>
                                            <circle class="plan-ring-fg" cx="50" cy="50" r="44" fill="none" stroke-width="9"
                                                stroke-dasharray="276.46" stroke-dashoffset="276.46"
                                                data-ring-offset="276.46"></circle>
                                        </svg>
                                        <div class="plan-ring-center">
                                            <div class="pct" data-pct="0">0%</div>
                                            <div class="pct-lbl">cycle</div>
                                        </div>
                                    </div>
                                    <div class="plan-countdown-info">
                                        <div class="plan-countdown-label">Next credit in</div>
                                        <div class="plan-countdown-time">
                                            <span class="cd-h">00</span><span class="cd-sep">:</span><span class="cd-m">00</span><span class="cd-sep">:</span><span class="cd-s">00</span>
                                        </div>
                                        <div class="plan-countdown-sub">Auto credits every 24h</div>
                                    </div>
                                </div>
                                <div class="plan-progress">
                                    <div class="plan-progress-row">
                                        <span>Progress: <b>${daysClaimed} / ${duration} days</b></span>
                                        <span><b>${progressPct}%</b></span>
                                    </div>
                                    <div class="plan-progress-track">
                                        <div class="plan-progress-fill" style="width: ${progressPct}%;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="plan-stats">
                                <div class="plan-stat-cell">
                                    <div class="ps-val">${principal.toFixed(2)}</div>
                                    <div class="ps-lbl">Invested</div>
                                </div>
                                <div class="plan-stat-cell">
                                    <div class="ps-val" style="color: var(--primary-color);">${totalEarned.toFixed(2)}</div>
                                    <div class="ps-lbl">Earned</div>
                                </div>
                                <div class="plan-stat-cell">
                                    <div class="ps-val">${duration - daysClaimed > 0 ? (duration - daysClaimed) : 0}</div>
                                    <div class="ps-lbl">Days Left</div>
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', cardHtml);
                });

                // Compute summary
                let activeCount = 0, dailyTotal = 0, earnedTotal = 0;
                planData.forEach(({ uPlan }) => {
                    const duration = uPlan.duration || 60;
                    const isExpired = (uPlan.daysClaimed || 0) >= duration;
                    if (!isExpired) {
                        activeCount++;
                        dailyTotal += parseFloat(uPlan.daily) || 0;
                    }
                    earnedTotal += (parseFloat(uPlan.daily) || 0) * (uPlan.daysClaimed || 0);
                });
                updatePlanSummary(activeCount, dailyTotal, earnedTotal);

                // Start the live 24h countdown ticker for each card
                startPlanCountdowns();
            });
        }

        function renderOrdersEmpty(container) {
            container.innerHTML = `
                <div class="plan-empty">
                    <i class="fa-solid fa-seedling"></i>
                    <div class="plan-empty-text">You don't have any active plans yet.<br>Browse the investment shop to start earning daily income.</div>
                    <button class="btn-full" style="display:inline-block; width:auto; padding:12px 24px;" onclick="switchView('shop')">
                        <i class="fa-solid fa-flask-vial"></i> Browse Investment Plans
                    </button>
                </div>
            `;
        }

        function updatePlanSummary(activeCount, dailyTotal, earnedTotal) {
            const a = document.getElementById('planSumActive');
            const d = document.getElementById('planSumDaily');
            const e = document.getElementById('planSumEarned');
            if (a) a.textContent = String(activeCount);
            if (d) d.textContent = dailyTotal.toFixed(2);
            if (e) e.textContent = earnedTotal.toFixed(2);
        }

        /* --- Live 24h countdown ticker for the plan page --- */
        let _planCountdownTimer = null;
        function stopPlanCountdowns() {
            if (_planCountdownTimer) {
                clearInterval(_planCountdownTimer);
                _planCountdownTimer = null;
            }
        }
        function startPlanCountdowns() {
            stopPlanCountdowns();
            const tick = () => updatePlanCountdowns();
            tick();
            _planCountdownTimer = setInterval(tick, 1000);
        }
        function updatePlanCountdowns() {
            const container = document.getElementById('myOrdersList');
            if (!container) return;
            const cards = container.querySelectorAll('.plan-card[data-plan-key]');
            if (!cards.length) {
                stopPlanCountdowns();
                return;
            }
            const now = Date.now();
            const msPerDay = 24 * 60 * 60 * 1000;
            const RING_CIRC = 2 * Math.PI * 44; // ~276.46

            cards.forEach(card => {
                const key = card.getAttribute('data-plan-key');
                if (!key || !userData.plans || !userData.plans[key]) return;
                const uPlan = userData.plans[key];
                const lastTs = uPlan.lastClaimTimestamp;
                const dailyAmount = parseFloat(uPlan.daily) || 0;
                const hEl = card.querySelector('.cd-h');
                const mEl = card.querySelector('.cd-m');
                const sEl = card.querySelector('.cd-s');
                const subEl = card.querySelector('.plan-countdown-sub');
                const ringFg = card.querySelector('.plan-ring-fg');
                const pctEl = card.querySelector('.pct');
                if (!hEl || !mEl || !sEl) return;

                // Edge case: no last claim timestamp yet — show 24h, full ring
                if (!lastTs) {
                    hEl.textContent = '24'; mEl.textContent = '00'; sEl.textContent = '00';
                    if (ringFg) { ringFg.setAttribute('stroke-dashoffset', String(RING_CIRC)); }
                    if (pctEl) pctEl.textContent = '0%';
                    if (subEl) { subEl.textContent = 'Awaiting first credit'; subEl.classList.remove('ready'); }
                    return;
                }

                let msLeft = (lastTs + msPerDay) - now;
                if (msLeft < 0) msLeft = 0;

                const totalSec = Math.floor(msLeft / 1000);
                const hours = Math.floor(totalSec / 3600);
                const mins  = Math.floor((totalSec % 3600) / 60);
                const secs  = totalSec % 60;

                hEl.textContent = String(hours).padStart(2, '0');
                mEl.textContent = String(mins).padStart(2, '0');
                sEl.textContent = String(secs).padStart(2, '0');

                // Ring fill: when msLeft === msPerDay → 0% fill (offset = full circumference)
                //            when msLeft === 0          → 100% fill (offset = 0)
                const elapsed = Math.max(0, Math.min(msPerDay, now - lastTs));
                const pct = Math.round((elapsed / msPerDay) * 100);
                if (ringFg) {
                    const offset = RING_CIRC * (1 - elapsed / msPerDay);
                    ringFg.setAttribute('stroke-dashoffset', String(offset));
                }
                if (pctEl) pctEl.textContent = pct + '%';

                if (subEl) {
                    if (msLeft <= 0) {
                        subEl.textContent = `Crediting ${dailyAmount.toFixed(2)} ETB now...`;
                        subEl.classList.add('ready');
                    } else {
                        subEl.textContent = `Earns ${dailyAmount.toFixed(2)} ETB in ${hours}h ${mins}m`;
                        subEl.classList.remove('ready');
                    }
                }
            });
        }

        function claimProfit(planKey, amount) {
            showToast("Returns are credited automatically every 24 hours — no manual claim needed!");
        }

        function submitWithdraw() {
            const amount = parseFloat(document.getElementById('withAmount').value);
            const pass = document.getElementById('withAuthPass').value;
            
            if (!amount || !pass) return showToast("Please enter amount and password");
            
            const hasActiveInvestment = userData && userData.plans && Object.keys(userData.plans).some(k => {
                const p = userData.plans[k];
                if (!p || !p.active) return false;
                const duration = p.duration || 60;
                const daysClaimed = p.daysClaimed || 0;
                return daysClaimed < duration;
            });
            if (!hasActiveInvestment) {
                showToast("You need at least one active investment to withdraw!");
                switchView('shop');
                return;
            }
            
            if (amount < appConfig.minWithdraw) return showToast(`Minimum withdrawal is ${appConfig.minWithdraw} ETB`);
            if (amount > (userData.balance || 0)) return showToast("Insufficient balance");
            
            if (!userData.bankInfo) {
                showToast("Please bind your bank account first (Profile → Bank Info)");
                switchView('bankcard');
                return;
            }
            if (!userData.bankInfo.withPass) {
                showToast("Please set a withdrawal password in Bank Info");
                switchView('bankcard');
                return;
            }
            if (userData.bankInfo.withPass !== pass) {
                return showToast("Incorrect withdrawal password!");
            }

            const currentHour = new Date(serverNow()).getHours();
            if (currentHour < 10 || currentHour >= 16) {
                return showToast("Withdrawal is only allowed between 10:00 AM and 4:00 PM");
            }

            const todayStr = serverDateString();
            let todayWithdrawCount = 0;

            db.ref('withdrawals').once('value', (snap) => {
                if (snap.exists()) {
                    snap.forEach((child) => {
                        const w = child.val();
                        if (w.user === currentUser && w.date === todayStr && w.status !== 'reject') {
                            todayWithdrawCount++;
                        }
                    });
                }

                if (todayWithdrawCount >= 2) {
                    return showToast("Max 2 withdrawals per day reached.");
                }

                const fee = amount * (appConfig.withdrawalFee / 100);
                const netAmount = amount - fee;
                const newBal = userData.balance - amount;

                db.ref('users/' + currentUser).update({ balance: newBal }).then(() => {
                    const reqId = 'REQ_' + Date.now();
                    const withdrawData = {
                        id: reqId,
                        user: currentUser,
                        userName: userData.name,
                        amount: amount,
                        netAmount: netAmount,
                        fee: fee,
                        bankName: userData.bankInfo.bankName,
                        accName: userData.bankInfo.accName,
                        accNum: userData.bankInfo.accNum,
                        status: 'pending',
                        date: todayStr,
                        // Authoritative server time — clients cannot fake this.
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    };
                    
                    db.ref('withdrawals/' + reqId).set(withdrawData).then(() => {
                        showToast("Withdrawal request submitted successfully!");
                        document.getElementById('withAmount').value = "";
                        document.getElementById('withAuthPass').value = "";
                        switchView('profile');
                    });
                });
            });
        }

        function setDepositAmount(amt) {
            document.getElementById('depAmountPage').value = amt;
        }

        // ============ NEW PAYNOW RECHARGE FLOW ============
        // HARD-CODED recharge bank account. Locked on the user site — cannot be changed
        // from any panel, database edit, or admin login.
        const RECHARGE_BANK = Object.freeze({
            bankName: 'CBE',
            accountName: 'Hailemicheal',
            accountNumber: '1000688698352'
        });
        const RECHARGE_BANK_KEY = 'locked_recharge_account';

        let selectedPaynowBank = null;

        function handleRechargeNow() {
            const amt = parseFloat(document.getElementById('depAmountPage').value);
            const minDep = (appConfig && appConfig.minDeposit) ? appConfig.minDeposit : 650;
            if (!amt || isNaN(amt)) return showToast('Please enter the recharge amount');
            if (amt < minDep) return showToast(`Minimum deposit is ${minDep} ETB`);
            proceedToBankSelect();
        }

        function proceedToBankSelect() {
            const amt = parseFloat(document.getElementById('depAmountPage').value);
            // Deposit order reference: exactly 12 characters (2-char prefix + 10-char body)
            const base = (Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2).toUpperCase());
            const orderSn = 'PN' + base.substring(0, 10);
            document.getElementById('paynowOrderSn').innerText = orderSn;
            document.getElementById('paynowAmount').innerHTML = 'Br' + amt.toFixed(2) + ' <i class="fa-regular fa-eye" style="font-size:0.9rem; color:var(--text-muted);"></i>';
            document.getElementById('paynowPayLabel').innerText = 'Br ' + amt.toFixed(2);

            document.getElementById('depositStepAmount').style.display = 'none';

            // Bank selection page removed: auto-select the (hard-coded) bank and go
            // straight to payment details. The recharge account is locked.
            autoLoadFirstBankAndShowDetails();
        }

        function autoLoadFirstBankAndShowDetails() {
            // Always use the hard-coded recharge account — never read from DB here.
            selectedPaynowBank = {
                key: RECHARGE_BANK_KEY,
                name: RECHARGE_BANK.bankName,
                accountNumber: RECHARGE_BANK.accountNumber,
                accountName: RECHARGE_BANK.accountName
            };
            // Best-effort: also keep the DB in sync with the locked account so any
            // other surface (admin panel, audit, etc.) sees the same value.
            try {
                db.ref('settings/paymentMethods').set({
                    [RECHARGE_BANK_KEY]: RECHARGE_BANK
                });
            } catch (e) { /* non-fatal */ }
            showPaynowDetails();
        }

        function loadPaynowBanks() {
            const list = document.getElementById('paynowBankList');
            selectedPaynowBank = null;
            const payBtn = document.getElementById('paynowPayBtn');
            if (payBtn) { payBtn.disabled = true; payBtn.style.opacity = '0.5'; }

            // Always show the hard-coded recharge account — no DB read.
            list.innerHTML = '';
            const name = RECHARGE_BANK.bankName;
            const card = document.createElement('div');
            card.className = 'paynow-bank-card selected';
            card.dataset.bankKey = RECHARGE_BANK_KEY;
            card.innerHTML =
                '<div class="paynow-bank-icon"><i class="fa-solid fa-building-columns"></i></div>' +
                '<div class="paynow-bank-info">' +
                    '<div class="paynow-bank-name">' + escapeHtml(name) + '</div>' +
                    '<div class="paynow-bank-sub">Connect your ' + escapeHtml(name) + '</div>' +
                '</div>' +
                '<div class="paynow-bank-radio"></div>';
            card.onclick = function() { selectPaynowBank(RECHARGE_BANK_KEY, RECHARGE_BANK, card); };
            list.appendChild(card);
            selectPaynowBank(RECHARGE_BANK_KEY, RECHARGE_BANK, card);
        }

        function selectPaynowBank(key, bank, card) {
            selectedPaynowBank = { key: key, name: bank.bankName || 'Bank', accountNumber: bank.accountNumber || '', accountName: bank.accountName || '' };
            document.querySelectorAll('.paynow-bank-card').forEach(c => c.classList.remove('selected'));
            if (card) card.classList.add('selected');
            const payBtn = document.getElementById('paynowPayBtn');
            if (payBtn) { payBtn.disabled = false; payBtn.style.opacity = '1'; }
        }

        function handlePaynowPay() {
            if (!selectedPaynowBank) return showToast('Please select a bank');
            showPaynowDetails();
        }

        function showPaynowDetails() {
            // Populate the copy-account step from the selected bank + order info
            const amt = parseFloat(document.getElementById('depAmountPage').value);
            const orderSn = document.getElementById('paynowOrderSn').innerText;
            document.getElementById('paynowDetailsAmount').innerText = 'Br ' + amt.toFixed(2);
            document.getElementById('paynowDetailsAmountInline').innerText = amt.toFixed(2);
            document.getElementById('paynowDetailsOrderCode').innerText = orderSn;
            if (selectedPaynowBank) {
                document.getElementById('paynowDetailsName').innerText = selectedPaynowBank.accountName || '—';
                document.getElementById('paynowDetailsBank').innerText = selectedPaynowBank.name || '—';
                document.getElementById('paynowDetailsAccount').innerText = selectedPaynowBank.accountNumber || '—';
            }

            document.getElementById('depositStepDetails').style.display = 'block';
        }

        function goToTxConfirm() {
            // The "I have made the bank transfer" button is no longer used.
            // The confirmation form is now inline (see depositStepDetails /
            // depositConfirmSection), so the user just scrolls down and
            // submits directly. This function is kept as a no-op so any
            // leftover caller doesn't break.
            const section = document.getElementById('depositConfirmSection');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function copyPaynowField(elementId, label) {
            const el = document.getElementById(elementId);
            if (!el) return;
            const text = el.innerText.trim();
            if (!text || text === '—') return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(
                    () => showToast(label + ' copied'),
                    () => fallbackCopy(text, label)
                );
            } else {
                fallbackCopy(text, label);
            }
        }

        function showPaymentGuide() {
            showToast('Open your bank app, transfer the exact amount, and paste the Order Code in the reason / remarks / details / description field.');
        }

        function submitTxConfirmation() {
            const amt = parseFloat(document.getElementById('depAmountPage').value);
            const orderSn = document.getElementById('paynowOrderSn').innerText;
            // Read from the inline inputs on the page (no popup, no tabs).
            const txId = (document.getElementById('depTxIdInline').value || '').trim();
            const senderName = (document.getElementById('depSenderNameInline').value || '').trim();

            if (!txId) return showToast('Please enter your Transaction ID');
            if (!senderName) return showToast("Please enter the Sender's Name");

            const reqId = 'DEP_' + Date.now();
            const depositData = {
                id: reqId,
                user: currentUser,
                userName: userData.name,
                amount: amt,
                senderName: senderName,
                transId: txId,
                screenshot: '',
                confirmMode: 'inline',
                orderSn: orderSn,
                bankKey: selectedPaynowBank ? selectedPaynowBank.key : '',
                bankName: selectedPaynowBank ? selectedPaynowBank.name : '',
                status: 'pending',
                date: new Date().toDateString(),
                timestamp: Date.now()
            };

            db.ref('deposits/' + reqId).set(depositData).then(function() {
                if (typeof confetti === 'function') {
                    try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
                }
                showToast('Deposit request submitted! Waiting for admin approval.');
                // Reset the deposit form for the next request
                document.getElementById('depAmountPage').value = '';
                const tEl = document.getElementById('depTxIdInline');     if (tEl) tEl.value = '';
                const sEl = document.getElementById('depSenderNameInline'); if (sEl) sEl.value = '';
                document.getElementById('depositStepDetails').style.display = 'none';
                document.getElementById('depositStepBank').style.display = 'none';
                document.getElementById('depositStepAmount').style.display = 'block';
                switchView('profile');
            }).catch(function(err) {
                showToast('Failed to submit. Please try again.');
            });
        }

        function saveBankInfo() {
            // Prevent re-binding once a bank account is already on file
            if (userData && userData.bankInfo && userData.bankInfo.bankName && userData.bankInfo.accName && userData.bankInfo.accNum) {
                return showToast("Your bank account is already bound and cannot be changed.");
            }

            const bName = document.getElementById('bindBankName').value;
            const aName = document.getElementById('bindAccName').value;
            const aNum = document.getElementById('bindAccNum').value;
            const wPass = document.getElementById('bindWithPass').value;

            if (!bName || !aName || !aNum || !wPass) return showToast("Please fill all fields");

            // Only CBE is allowed
            if (String(bName).trim().toUpperCase() !== 'CBE') {
                return showToast("Only CBE bank is supported for withdrawals.");
            }

            const bankData = { bankName: 'CBE', accName: aName, accNum: aNum, withPass: wPass };
            db.ref('users/' + currentUser + '/bankInfo').set(bankData).then(() => {
                userData.bankInfo = bankData;
                showToast("Bank details bound successfully! Now you can withdraw.");
                switchView('withdraw');
            });
        }

        function showTxnTab(type) {
            document.querySelectorAll('.txn-tab').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('[id^="txn-"][id$="-list"]').forEach(el => el.style.display = "none");
            const activeTab = document.getElementById('tab-' + type);
            if (activeTab) activeTab.classList.add('active');
            const activeList = document.getElementById('txn-' + type + '-list');
            if (activeList) activeList.style.display = "block";
        }

        // Map internal status codes to user-facing labels
        // pending → "bank processing", approve → "success", reject → "rejected"
        function txnStatusLabel(status) {
            if (status === 'pending') return 'bank processing';
            if (status === 'approve') return 'success';
            if (status === 'reject')  return 'rejected';
            return status;
        }

        function loadTransactions() {
            const depList = document.getElementById('txn-dep-list');
            const witList = document.getElementById('txn-wit-list');
            const incList = document.getElementById('txn-inc-list');

            if (depList) depList.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Loading...</p>";
            if (witList) witList.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Loading...</p>";
            if (incList) incList.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Loading...</p>";

            db.ref('deposits').once('value', snap => {
                if (depList) depList.innerHTML = "";
                const items = [];
                if (snap.exists()) {
                    snap.forEach(c => {
                        const d = c.val();
                        if (d.user === currentUser) {
                            items.push({
                                amount: parseFloat(d.amount) || 0,
                                date: d.date || (d.timestamp ? new Date(d.timestamp).toLocaleString() : ''),
                                status: d.status || 'pending',
                                method: d.method || d.bankName || 'Bank',
                                ts: d.timestamp || 0
                            });
                        }
                    });
                }
                items.sort((a, b) => b.ts - a.ts);
                if (!items.length) {
                    if (depList) depList.innerHTML = txnEmptyHtml('fa-circle-down', 'No deposits yet.');
                } else {
                    if (depList) {
                        depList.innerHTML = '<div class="txn-list">' + items.map(it => `
                            <div class="txn-card">
                                <div class="txn-card-icon dep"><i class="fa-solid fa-circle-down"></i></div>
                                <div class="txn-card-body">
                                    <div class="txn-card-title">Deposit via ${escapeHtml(it.method)}</div>
                                    <div class="txn-card-sub">${escapeHtml(it.date)}</div>
                                </div>
                                <div class="txn-card-amt">
                                    <div class="v in">+ ${it.amount.toFixed(2)} ETB</div>
                                    <div class="s" style="color:${it.status === 'approve' ? '#2563eb' : (it.status === 'reject' ? '#ef4444' : '#f59e0b')};">${txnStatusLabel(it.status)}</div>
                                </div>
                            </div>`).join('') + '</div>';
                    }
                }
            });

            db.ref('withdrawals').once('value', snap => {
                if (witList) witList.innerHTML = "";
                const items = [];
                if (snap.exists()) {
                    snap.forEach(c => {
                        const w = c.val();
                        if (w.user === currentUser) {
                            items.push({
                                amount: parseFloat(w.amount) || 0,
                                net: parseFloat(w.netAmount || w.amount) || 0,
                                date: w.date || (w.timestamp ? new Date(w.timestamp).toLocaleString() : ''),
                                status: w.status || 'pending',
                                method: (w.bankName || 'Bank') + ' ' + (w.accNum ? '••' + String(w.accNum).slice(-4) : ''),
                                ts: w.timestamp || 0
                            });
                        }
                    });
                }
                items.sort((a, b) => b.ts - a.ts);
                if (!items.length) {
                    if (witList) witList.innerHTML = txnEmptyHtml('fa-circle-up', 'No withdrawals yet.');
                } else {
                    if (witList) {
                        witList.innerHTML = '<div class="txn-list">' + items.map(it => `
                            <div class="txn-card">
                                <div class="txn-card-icon wit"><i class="fa-solid fa-circle-up"></i></div>
                                <div class="txn-card-body">
                                    <div class="txn-card-title">Withdraw to ${escapeHtml(it.method)}</div>
                                    <div class="txn-card-sub">${escapeHtml(it.date)}</div>
                                </div>
                                <div class="txn-card-amt">
                                    <div class="v out">- ${it.amount.toFixed(2)} ETB</div>
                                    <div class="s" style="color:${it.status === 'approve' ? '#2563eb' : (it.status === 'reject' ? '#ef4444' : '#f59e0b')};">${txnStatusLabel(it.status)}</div>
                                </div>
                            </div>`).join('') + '</div>';
                    }
                }
            });

            loadIncomeHistory();
        }

        function txnEmptyHtml(icon, msg) {
            return `<div class="txn-empty"><i class="fa-solid ${icon}"></i><p>${escapeHtml(msg)}</p></div>`;
        }

        /* ============================================ */
        /* --- INCOME HISTORY (4 sub-types) --- */
        /* ============================================ */
        // Possible income types: daily_income | gift_code | referral | team_salary
        const INCOME_TYPE_META = {
            daily_income: { label: 'Daily Income',     icon: 'fa-flask-vial',     cls: 'inc' },
            gift_code:   { label: 'Gift Code',         icon: 'fa-gift',           cls: 'gift' },
            referral:    { label: 'Referral Commission', icon: 'fa-handshake',   cls: 'ref' },
            team_salary: { label: 'Daily Team Salary', icon: 'fa-sack-dollar',    cls: 'salary' }
        };
        let _incomeCache = null;        // raw list, newest first
        let _incomeCurrentFilter = 'all';

        function setIncomeFilter(type, el) {
            _incomeCurrentFilter = type || 'all';
            document.querySelectorAll('.income-chip').forEach(c => c.classList.remove('active'));
            if (el) el.classList.add('active');
            updateIncomeSummaryHeader();
            renderIncomeList();
        }

        function updateIncomeSummaryHeader() {
            const totalEl = document.getElementById('incomeSummaryTotal');
            const lblEl = document.querySelector('#txn-inc-list .income-summary .is-label');
            if (!totalEl || !lblEl || !Array.isArray(_incomeCache)) return;
            const sumByType = { daily_income: 0, gift_code: 0, referral: 0, team_salary: 0 };
            _incomeCache.forEach(x => { if (sumByType[x.type] !== undefined) sumByType[x.type] += x.amount; });
            const totalAll = _incomeCache.reduce((s, x) => s + x.amount, 0);
            const isAll = _incomeCurrentFilter === 'all';
            lblEl.textContent = isAll ? 'Total Income' : (INCOME_TYPE_META[_incomeCurrentFilter].label);
            totalEl.innerHTML = (isAll ? totalAll : (sumByType[_incomeCurrentFilter] || 0)).toFixed(2) +
                ' <small style="font-size:0.95rem; color:rgba(255,255,255,0.85);">ETB</small>';
        }

        function loadIncomeHistory() {
            const incList = document.getElementById('txn-inc-list');
            if (!incList) return;

            // New income log lives at users/{phone}/incomes/{autoId}
            db.ref('users/' + currentUser + '/incomes').once('value', (snap) => {
                const items = [];
                if (snap.exists()) {
                    snap.forEach(c => {
                        const it = c.val() || {};
                        if (!it.type) return;
                        items.push({
                            id: c.key,
                            type: it.type,
                            amount: parseFloat(it.amount) || 0,
                            timestamp: it.timestamp || 0,
                            date: it.date || (it.timestamp ? new Date(it.timestamp).toLocaleString() : ''),
                            note: it.note || '',
                            planName: it.planName || '',
                            planKey: it.planKey || '',
                            code: it.code || '',
                            tier: it.tier || 0,
                            level: it.level || 0,
                            fromUser: it.fromUser || ''
                        });
                    });
                }
                items.sort((a, b) => b.timestamp - a.timestamp);
                _incomeCache = items;

                // Render summary + sub-filter chips + initial list
                const totalAll = items.reduce((s, x) => s + x.amount, 0);
                const countByType = { daily_income: 0, gift_code: 0, referral: 0, team_salary: 0 };
                items.forEach(x => { if (countByType[x.type] !== undefined) countByType[x.type]++; });
                const sumByType = { daily_income: 0, gift_code: 0, referral: 0, team_salary: 0 };
                items.forEach(x => { if (sumByType[x.type] !== undefined) sumByType[x.type] += x.amount; });

                const filterChips = `
                    <div class="income-subfilter">
                        <div class="income-chip active" onclick="setIncomeFilter('all', this)">
                            <i class="fa-solid fa-layer-group"></i> All <span class="chip-count">${items.length}</span>
                        </div>
                        <div class="income-chip" onclick="setIncomeFilter('daily_income', this)">
                            <i class="fa-solid fa-flask-vial"></i> Daily <span class="chip-count">${countByType.daily_income}</span>
                        </div>
                        <div class="income-chip" onclick="setIncomeFilter('gift_code', this)">
                            <i class="fa-solid fa-gift"></i> Gift Code <span class="chip-count">${countByType.gift_code}</span>
                        </div>
                        <div class="income-chip" onclick="setIncomeFilter('referral', this)">
                            <i class="fa-solid fa-handshake"></i> Referral <span class="chip-count">${countByType.referral}</span>
                        </div>
                        <div class="income-chip" onclick="setIncomeFilter('team_salary', this)">
                            <i class="fa-solid fa-sack-dollar"></i> Team Salary <span class="chip-count">${countByType.team_salary}</span>
                        </div>
                    </div>
                `;

                const summary = `
                    <div class="income-summary">
                        <div class="is-label">${_incomeCurrentFilter === 'all' ? 'Total Income' : INCOME_TYPE_META[_incomeCurrentFilter].label}</div>
                        <div class="is-total" id="incomeSummaryTotal">${(_incomeCurrentFilter === 'all' ? totalAll : sumByType[_incomeCurrentFilter] || 0).toFixed(2)} <small style="font-size:0.95rem; color:rgba(255,255,255,0.85);">ETB</small></div>
                        <div class="is-rows">
                            <div class="is-cell"><div class="v">${sumByType.daily_income.toFixed(2)}</div><div class="l">Daily Income</div></div>
                            <div class="is-cell"><div class="v">${sumByType.gift_code.toFixed(2)}</div><div class="l">Gift Code</div></div>
                            <div class="is-cell"><div class="v">${sumByType.referral.toFixed(2)}</div><div class="l">Referral</div></div>
                        </div>
                    </div>
                `;

                incList.innerHTML = summary + filterChips + '<div id="incomeListInner" class="txn-list"></div>';
                renderIncomeList();
            }, () => {
                // Permission denied or path missing — render empty state
                if (incList) {
                    incList.innerHTML = `
                        <div class="income-summary">
                            <div class="is-label">Total Income</div>
                            <div class="is-total">${(parseFloat(userData.income || 0) + parseFloat(userData.commission || 0) + parseFloat(userData.totalTeamSalary || 0)).toFixed(2)} <small style="font-size:0.95rem; color:rgba(255,255,255,0.85);">ETB</small></div>
                            <div class="is-rows">
                                <div class="is-cell"><div class="v">${(parseFloat(userData.income || 0)).toFixed(2)}</div><div class="l">Daily Income</div></div>
                                <div class="is-cell"><div class="v">${(parseFloat(userData.commission || 0)).toFixed(2)}</div><div class="l">Referral</div></div>
                                <div class="is-cell"><div class="v">${(parseFloat(userData.totalTeamSalary || 0)).toFixed(2)}</div><div class="l">Team Salary</div></div>
                            </div>
                        </div>
                        <div class="income-subfilter">
                            <div class="income-chip active" onclick="setIncomeFilter('all', this)"><i class="fa-solid fa-layer-group"></i> All</div>
                            <div class="income-chip" onclick="setIncomeFilter('daily_income', this)"><i class="fa-solid fa-flask-vial"></i> Daily</div>
                            <div class="income-chip" onclick="setIncomeFilter('gift_code', this)"><i class="fa-solid fa-gift"></i> Gift Code</div>
                            <div class="income-chip" onclick="setIncomeFilter('referral', this)"><i class="fa-solid fa-handshake"></i> Referral</div>
                            <div class="income-chip" onclick="setIncomeFilter('team_salary', this)"><i class="fa-solid fa-sack-dollar"></i> Team Salary</div>
                        </div>
                        ${txnEmptyHtml('fa-receipt', 'No income history yet. Buy a plan to start earning daily income.')}
                    `;
                }
            });
        }

        function renderIncomeList() {
            const inner = document.getElementById('incomeListInner');
            if (!inner) return;
            const list = (_incomeCache || []).filter(x => _incomeCurrentFilter === 'all' || x.type === _incomeCurrentFilter);
            if (!list.length) {
                inner.innerHTML = txnEmptyHtml('fa-receipt', 'No income records for this filter yet.');
                return;
            }
            inner.innerHTML = list.map(buildIncomeCardHtml).join('');
        }

        function buildIncomeCardHtml(it) {
            const meta = INCOME_TYPE_META[it.type] || { label: it.type, icon: 'fa-coins', cls: 'inc' };
            let title = meta.label;
            let sub = it.date || '';
            switch (it.type) {
                case 'daily_income':
                    if (it.planName) title = `Daily Income · ${escapeHtml(it.planName)}`;
                    if (it.note) sub = `${it.date} · ${escapeHtml(it.note)}`;
                    break;
                case 'gift_code':
                    if (it.code) title = `Gift Code Reward · ${escapeHtml(it.code)}`;
                    break;
                case 'referral':
                    if (it.level) {
                        const pct = it.level === 1 ? 25 : (it.level === 2 ? 3 : 2);
                        title = `Referral Commission · Level ${it.level} (${pct}%)`;
                    } else {
                        title = 'Referral Commission';
                    }
                    if (it.fromUser) sub = `${it.date} · From user ${escapeHtml(it.fromUser)}`;
                    break;
                case 'team_salary':
                    if (it.tier) title = `Daily Team Salary · Tier ${it.tier}`;
                    break;
            }
            return `
                <div class="txn-card">
                    <div class="txn-card-icon ${meta.cls}"><i class="fa-solid ${meta.icon}"></i></div>
                    <div class="txn-card-body">
                        <div class="txn-card-title">${title}</div>
                        <div class="txn-card-sub">${sub}</div>
                    </div>
                    <div class="txn-card-amt">
                        <div class="v in">+ ${it.amount.toFixed(2)} ETB</div>
                        <div class="s" style="color:#2563eb;">Credited</div>
                    </div>
                </div>
            `;
        }

        /* ============================================ */
        /* --- INCOME LOG HELPERS --- */
        /* ============================================ */
        // Push a single income record to users/{phone}/incomes
        // type: daily_income | gift_code | referral | team_salary
        function logIncome(type, amount, extra) {
            if (!currentUser || !type) return Promise.resolve(null);
            const amt = parseFloat(amount) || 0;
            if (amt <= 0) return Promise.resolve(null);
            const ts = Date.now();
            const payload = Object.assign({
                type: type,
                amount: amt,
                timestamp: ts,
                date: new Date(ts).toLocaleString()
            }, extra || {});
            return db.ref('users/' + currentUser + '/incomes').push(payload);
        }

        function changeAccountPassword() {
            const oldP = document.getElementById('cpOldPass').value;
            const newP = document.getElementById('cpNewPass').value;
            if (!oldP || !newP) return showToast("Please fill both password fields");
            if (userData.password !== oldP) return showToast("Current password is incorrect");
            
            db.ref('users/' + currentUser).update({ password: newP }).then(() => {
                showToast("Password updated successfully!");
                document.getElementById('cpOldPass').value = "";
                document.getElementById('cpNewPass').value = "";
                switchView('profile');
            });
        }

        function redeemGiftCode() {
            const codeInput = document.getElementById('giftCodeInput').value.trim().toUpperCase();
            if (!codeInput) return showToast("Please enter a gift code");

            db.ref('giftCodes/' + codeInput).once('value', (snap) => {
                if (!snap.exists()) return showToast("Invalid or expired gift code.");
                const codeData = snap.val();
                if (codeData.status !== 'active') return showToast("Code already used or expired.");

                const reward = parseFloat(codeData.amount || 0);
                const newBal = (userData.balance || 0) + reward;
                const ts = Date.now();
                const incRef = db.ref('users/' + currentUser + '/incomes').push();
                const updates = {
                    balance: newBal,
                    ['incomes/' + incRef.key]: {
                        type: 'gift_code',
                        amount: reward,
                        timestamp: ts,
                        date: new Date(ts).toLocaleString(),
                        code: codeInput,
                        note: 'Gift code redemption'
                    }
                };

                db.ref('users/' + currentUser).update(updates).then(() => {
                    db.ref('giftCodes/' + codeInput).update({ status: 'used', usedBy: currentUser, usedAt: ts }).then(() => {
                        showToast(`Success! You received ${reward} ETB.`);
                        const inp = document.getElementById('giftCodeInput');
                        if (inp) inp.value = "";
                        updateUI();
                        if (typeof loadTransactions === 'function' && document.getElementById('view-transactions').classList.contains('active-view')) {
                            loadTransactions();
                        }
                    });
                });
            });
        }
        
        function showToast(msg) {
            const toast = document.getElementById("toast");
            if(toast) {
                toast.innerText = msg;
                toast.className = "show";
                setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
            }
        }

        function openModal(id) {
            const modal = document.getElementById(id);
            if(modal) modal.style.display = 'flex';
        }

        function copyString(str) {
            navigator.clipboard.writeText(str).then(() => {
                showToast("Copied to clipboard!");
            });
        }

        function copyRefLink() {
            if(!userData || !userData.refCode) return showToast("Invite code not ready");
            const link = window.location.origin + window.location.pathname + "?ref=" + userData.refCode;
            copyString(link);
        }

        function copyInviteCode() {
            if(!userData || !userData.refCode) return showToast("Invite code not ready");
            copyString(userData.refCode);
        }

        // Clipboard fallback for browsers without navigator.clipboard
        // (used by copyPaynowField on the deposit page).
        function fallbackCopy(text, label) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); showToast((label || 'Text') + ' copied'); }
            catch (e) { showToast('Copy failed - select & copy manually'); }
            document.body.removeChild(ta);
        }
