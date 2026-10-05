<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>{{ $otp }} is your RemiVault security code</title>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&family=Outfit:wght@600;700;800&display=swap');

    /* Global Resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #f1f5f9;
      color: #334155;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* Mobile Responsive Rules */
    @media only screen and (max-width: 620px) {
      .email-wrapper {
        padding: 16px 8px !important;
      }
      .email-card {
        width: 100% !important;
        border-radius: 12px !important;
      }
      .email-header {
        padding: 28px 20px 20px 20px !important;
      }
      .email-body {
        padding: 24px 20px 30px 20px !important;
      }
      .email-footer {
        padding: 24px 20px !important;
      }
      .otp-digit-tile {
        width: 38px !important;
        height: 48px !important;
        font-size: 24px !important;
        margin: 0 2px !important;
      }
      .hero-title {
        font-size: 20px !important;
        line-height: 26px !important;
      }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Hidden Preview Preheader Text (appears in inbox preview line) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #f1f5f9; opacity: 0;">
    {{ $otp }} is your RemiVault security code. Valid for {{ $expiresInMinutes ?? 10 }} minutes.
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>

  <!-- Outer Full-Width Container (Light Slate Canvas) -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #f1f5f9; min-height: 100vh; padding: 40px 16px;">
    <tr>
      <td align="center" valign="top">

        <!-- Outer MSO Constraint Table for Outlook -->
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="560">
        <tr>
        <td align="center" valign="top" width="560">
        <![endif]-->

        <!-- Main Card Container (Pure White Crisp Card) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03);">

          <!-- Top Brand Accent Bar (Fintech Vibrant Gradient) -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%); font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Header Section with Official Embedded Logo -->
          <tr>
            <td align="center" class="email-header" style="padding: 36px 36px 20px 36px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    
                    <!-- Official RemiVault Logo (CID Embedded Image for Universal Gmail / Outlook support) -->
                    @php
                      $logoPath = public_path('images/logo.png');
                    @endphp

                    <div style="margin-bottom: 14px;">
                      @if(isset($message) && file_exists($logoPath))
                        <img src="{{ $message->embed($logoPath) }}" width="52" height="52" alt="RemiVault" style="display: block; width: 52px; height: 52px; border-radius: 14px; border: 0; outline: none; margin: 0 auto;" />
                      @elseif(file_exists($logoPath))
                        <img src="{{ asset('images/logo.png') }}" width="52" height="52" alt="RemiVault" style="display: block; width: 52px; height: 52px; border-radius: 14px; border: 0; outline: none; margin: 0 auto;" />
                      @else
                        <!-- Fallback styled emblem -->
                        <div style="width: 52px; height: 52px; line-height: 52px; background: #4f46e5; border-radius: 14px; color: #ffffff; font-size: 24px; font-weight: 800; text-align: center; margin: 0 auto;">
                          🛡️
                        </div>
                      @endif
                    </div>

                    <!-- Brand Name Title -->
                    <h1 style="margin: 0; font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
                      REMI<span style="color: #4f46e5;">VAULT</span>
                    </h1>
                    <div style="margin-top: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">
                      Encrypted Personal Sanctuary
                    </div>

                    <!-- Category Status Tag -->
                    <div style="margin-top: 14px;">
                      @if($type === 'register')
                        <span style="display: inline-block; padding: 5px 14px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #047857; text-transform: uppercase;">
                          ● Account Verification
                        </span>
                      @elseif($type === 'forgot_password')
                        <span style="display: inline-block; padding: 5px 14px; background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #4338ca; text-transform: uppercase;">
                          ● Password Reset Request
                        </span>
                      @elseif($type === 'reset_pin')
                        <span style="display: inline-block; padding: 5px 14px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #0369a1; text-transform: uppercase;">
                          ● Security PIN Recovery
                        </span>
                      @else
                        <span style="display: inline-block; padding: 5px 14px; background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #4338ca; text-transform: uppercase;">
                          ● Security Authorization
                        </span>
                      @endif
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Email Content Body -->
          <tr>
            <td class="email-body" style="padding: 32px 36px 36px 36px;">

              <!-- Hero Greeting -->
              <h2 class="hero-title" style="margin: 0 0 12px 0; font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                Hello {{ $userName ? $userName : 'there' }},
              </h2>

              <!-- Context-Aware Explanation Text -->
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                @if($type === 'register')
                  Thank you for registering on <strong>RemiVault</strong>. Please use the verification code below to confirm your email and activate your account:
                @elseif($type === 'forgot_password')
                  We received a request to reset your password. Use the verification code below to proceed with setting a new password:
                @elseif($type === 'reset_pin')
                  We received a request to reset your 4-digit Security PIN. Enter the code below to configure a new PIN:
                @else
                  Please use the security code below to complete your authentication:
                @endif
              </p>

              <!-- Central Verification Code Showcase Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
                <tr>
                  <td align="center" style="padding: 24px 18px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 14px;">
                      Verification Code
                    </div>

                    <!-- Discrete Digits Tiles Row -->
                    @if(isset($digits) && is_array($digits) && count($digits) === 6)
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
                        <tr>
                          @foreach($digits as $digit)
                            <td class="otp-digit-tile" align="center" valign="middle" style="width: 46px; height: 56px; background-color: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 10px; font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 28px; font-weight: 800; color: #1e293b; box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05); padding: 0 4px;">
                              {{ $digit }}
                            </td>
                            @if(!$loop->last)
                              <td width="6" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
                            @endif
                          @endforeach
                        </tr>
                      </table>
                    @else
                      <!-- Fallback Big Monospace Box -->
                      <div style="font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e293b; margin: 0 0 12px 10px;">
                        {{ $otp }}
                      </div>
                    @endif

                    <!-- Expiration Notice with Countdown Icon -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin-top: 8px;">
                      <tr>
                        <td valign="middle" style="font-size: 14px; line-height: 1;">⏱</td>
                        <td valign="middle" style="padding-left: 6px; font-size: 13px; font-weight: 500; color: #64748b;">
                          This code expires in <strong style="color: #0f172a;">{{ $expiresInMinutes ?? 10 }} minutes</strong>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Strict Security Warning & Anti-Phishing Advisory (Light Amber Accent Card) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px 10px 10px 4px; margin-top: 10px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="20" style="font-size: 15px; line-height: 1.2; padding-right: 8px;">
                          🛡️
                        </td>
                        <td valign="top" style="font-size: 13px; line-height: 1.5; color: #78350f;">
                          <strong style="color: #92400e;">Security Tip:</strong> Never share this code with anyone. RemiVault will never contact you asking for your verification code. If you did not request this, you can safely ignore this email.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td align="center" class="email-footer" style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              
              <div style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px;">
                🔒 RemiVault • Encrypted Personal Sanctuary
              </div>

              <!-- Copyright & Organization -->
              <div style="font-size: 11px; line-height: 1.5; color: #64748b;">
                &copy; {{ date('Y') }} RemiVault Inc. All rights reserved.<br>
                Please do not reply directly to this automated email.
              </div>
            </td>
          </tr>

        </table>
        <!-- End Main Card Container -->

        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>
