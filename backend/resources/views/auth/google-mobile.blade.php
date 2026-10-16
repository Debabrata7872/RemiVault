<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>RemiVault • Google Sign In</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #07090e;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
      background-image: radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.12) 0%, transparent 60%);
    }
    .card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 20px;
      padding: 2rem 1.5rem;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
    }
    .logo svg {
      width: 36px;
      height: 36px;
      fill: none;
      stroke: #07090e;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    h1 {
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #ffffff;
    }
    p {
      font-size: 0.88rem;
      color: #94a3b8;
      line-height: 1.45;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      width: 100%;
      padding: 0.85rem 1.2rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-decoration: none;
    }
    .btn-google {
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    }
    .btn-google:active {
      transform: scale(0.98);
      background: #f1f5f9;
    }
    .btn-return {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.35);
      margin-top: 0.5rem;
      font-size: 0.88rem;
    }
    .status-box {
      font-size: 0.82rem;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      width: 100%;
      display: none;
    }
    .status-loading {
      display: block;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .status-error {
      display: block;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .status-success {
      display: block;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      vertical-align: middle;
      margin-right: 0.4rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>

  <!-- Firebase App & Auth Compatibility SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
</head>
<body>

  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>

    <div>
      <h1>Sign In to RemiVault</h1>
      <p style="margin-top: 0.25rem;">Authenticate securely using your Google account to unlock your mobile vault.</p>
    </div>

    <div id="statusBox" class="status-box"></div>

    <button id="googleBtn" class="btn btn-google" onclick="initiateGoogleAuth()">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      <span>Continue with Google</span>
    </button>

    <a id="returnBtn" href="remivault://auth-callback?cancelled=true" class="btn btn-return" style="display: none;">
      Return to RemiVault App
    </a>
  </div>

  <script>
    const firebaseConfig = {
      apiKey: "AIzaSyBgc2Dap9csYQ0foT_1L0fGQgDO4GiCBZc",
      authDomain: "remivault-2026.firebaseapp.com",
      projectId: "remivault-2026",
      storageBucket: "remivault-2026.firebasestorage.app",
      messagingSenderId: "660958535135",
      appId: "1:660958535135:web:06b0728699185fb8e1386a",
      measurementId: "G-8HKYBLW3YE"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const statusBox = document.getElementById('statusBox');
    const googleBtn = document.getElementById('googleBtn');
    const returnBtn = document.getElementById('returnBtn');

    function setStatus(type, msg) {
      statusBox.className = 'status-box status-' + type;
      statusBox.innerHTML = msg;
      statusBox.style.display = 'block';
    }

    async function handleAuthSuccess(user) {
      setStatus('loading', '<span class="spinner"></span> Syncing with RemiVault vault...');
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/auth/firebase-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            idToken: idToken,
            email: user.email,
            name: user.displayName,
            photo_url: user.photoURL
          })
        });

        const data = await res.json();
        if (res.ok && data.token && data.user) {
          setStatus('success', '✓ Authenticated! Opening RemiVault...');
          const deepLink = 'remivault://auth-callback?token=' + encodeURIComponent(data.token) + 
                           '&user=' + encodeURIComponent(JSON.stringify(data.user));
          
          returnBtn.href = deepLink;
          returnBtn.style.display = 'inline-flex';
          returnBtn.innerText = 'Open RemiVault Now';
          
          // Automatic hand-off to app
          setTimeout(() => {
            window.location.href = deepLink;
          }, 350);
        } else {
          setStatus('error', data.message || 'Failed to authenticate with vault server.');
        }
      } catch (err) {
        setStatus('error', 'Network error connecting to vault server: ' + err.message);
      }
    }

    async function initiateGoogleAuth() {
      setStatus('loading', '<span class="spinner"></span> Connecting to Google...');
      googleBtn.disabled = true;

      try {
        // Try redirect first for seamless mobile browser support
        const result = await auth.signInWithPopup(provider);
        if (result && result.user) {
          await handleAuthSuccess(result.user);
        }
      } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
          // Fall back to redirect
          try {
            await auth.signInWithRedirect(provider);
          } catch (redirectErr) {
            setStatus('error', redirectErr.message);
            googleBtn.disabled = false;
          }
        } else {
          setStatus('error', err.message || 'Google sign-in was cancelled.');
          googleBtn.disabled = false;
        }
      }
    }

    // Check if returning from a redirect
    auth.getRedirectResult()
      .then(async (result) => {
        if (result && result.user) {
          await handleAuthSuccess(result.user);
        }
      })
      .catch((err) => {
        if (err && err.code) {
          setStatus('error', err.message);
        }
      });

    // Auto-trigger on mobile browser launch
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!auth.currentUser) {
          initiateGoogleAuth();
        }
      }, 500);
    });
  </script>
</body>
</html>
