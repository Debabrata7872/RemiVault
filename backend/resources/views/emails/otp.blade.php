<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your RemiVault Security Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #0b1120;
      padding: 40px 15px;
    }
    .email-container {
      max-width: 540px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .email-header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%);
      padding: 32px 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin: 0;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #818cf8 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: #818cf8;
    }
    .badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .email-body {
      padding: 35px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message-text {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 25px;
    }
    .otp-card {
      background: #1e293b;
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 25px;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .otp-code {
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #38bdf8;
      margin: 0;
      text-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
    }
    .expiry-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
    .security-notice {
      background: rgba(245, 158, 11, 0.08);
      border-left: 3px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12px;
      color: #fbbf24;
      line-height: 1.5;
      margin-bottom: 25px;
    }
    .email-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <h1 class="brand-title">Remi<span class="brand-gradient">Vault</span></h1>
        <div class="badge">Zero-Knowledge Security</div>
      </div>

      <!-- Body -->
      <div class="email-body">
        <p class="greeting">Hello {{ $userName ?? 'there' }},</p>

        @if($type === 'register')
          <p class="message-text">
            Thank you for registering your secure sanctuary on <strong>RemiVault</strong>. Please use the verification code below to verify your email address and activate your account.
          </p>
        @else
          <p class="message-text">
            We received a request to reset the password for your <strong>RemiVault</strong> account. Enter the verification code below to proceed with setting a new password.
          </p>
        @endif

        <!-- OTP Code Card -->
        <div class="otp-card">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">{{ $otp }}</div>
          <div class="expiry-note">⏱ This code is valid for <strong>10 minutes</strong>.</div>
        </div>

        <!-- Security Warning -->
        <div class="security-notice">
          <strong>Security Tip:</strong> Never share this verification code with anyone. RemiVault will never ask for your code over phone, email, or chat. If you did not request this, you can safely ignore this email.
        </div>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        &copy; {{ date('Y') }} RemiVault • Encrypted Personal Sanctuary<br>
        All user data is cryptographically isolated and secure.
      </div>
    </div>
  </div>
</body>
</html>
