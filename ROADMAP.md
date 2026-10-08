# RemiVault - Project Roadmap & Pending Works

> **Status Tracking & Daily Morning Review**  
> This roadmap is tracked by the AI agent and will be reviewed daily every morning until completed or instructed to stop.

---

## 📋 Task List & Milestones

- [x] **1. Theme Modes (Dark, Light, System)**
  - Segmented 3-button switcher (`Sun`, `Moon`, `Monitor`).
  - Dynamic system color scheme detection (`prefers-color-scheme`).
  - Persistent user preference in `localStorage`.
  - Comprehensive light mode palette with buttery smooth transitions.
  - *Status:* Completed & Deployed.

- [x] **2. Security PIN & Profile Lock (Cross-Device Database Persistence)**
  - 4-digit PIN setup with interactive numeric keypad.
  - Profile lock screen with auto-lock on inactivity.
  - Direct database persistence in `users.security_pin` with authoritative online verification.
  - Instant cross-device synchronization and stale local cache purging.
  - *Status:* Completed & Deployed.

- [x] **3. Multi-Profile & Custom Avatars**
  - Multiple device profiles on shared devices.
  - Custom gradient avatars, initials, and photo upload support.
  - Quick profile switching and session segregation.
  - *Status:* Completed & Deployed.

- [x] **4. In-App User Feedback System**
  - Interactive feedback drawer in Settings modal.
  - Categorized submissions (App Improvement, Feature Request, Bug Report).
  - Direct persistence into backend database with non-technical, friendly user experience.
  - *Status:* Completed & Deployed.

- [x] **5. Brand Identity & Custom App Logo Design**
  - Designed a bespoke, luxury fintech logo for RemiVault (Vault + Shield + Spark concept).
  - Generated comprehensive brand assets: scalable SVG vector logo, crisp tab favicon, PWA app icons (192x192, 512x512), apple-touch-icon (180x180), and web app manifest.
  - Created reusable `<BrandLogo />` React component with glowing gradient styling and integrated across Navbar, App header, and Profile Lock screen.
  - *Status:* Completed.


- [x] **6. Modernize OTP Email Template**
  - Revamped [`backend/resources/views/emails/otp.blade.php`](file:///c:/xampp/htdocs/RemiVault/backend/resources/views/emails/otp.blade.php).
  - Modern, responsive HTML email design compatible with Gmail, Apple Mail, Outlook (table-based, MSO tags, inline styling).
  - High-impact discrete 6-digit verification code tiles, security advisory, timer countdown notice, session audit table, and official branding.
  - *Status:* Completed.


- [x] **7. Professional Email Setup for Sending OTPs**
  - Configured Brevo (Sendinblue) transactional relay with 300 free emails/day.
  - Successfully connected SMTP relay on port 587 with TLS encryption.
  - Tested and verified real-world dispatch of the luxury light-theme OTP email template.
  - Supports identical zero-configuration deployment across local and online servers.
  - *Status:* Completed & Verified.


- [x] **8. Premium Skeleton Placeholders, Progressive Fetching & Adaptive Preloading (Zero LocalStorage)**
  - **Zero LocalStorage Policy**: Strictly no user data (notes, reminders, vault records) cached in browser `localStorage`, ensuring absolute data privacy and security.
  - **Premium Shimmer Skeleton Placeholders**: Replace jarring blank screens or stuck fetch states after login/credential verification with luxury fintech-grade animated shimmer skeletons across Dashboard, Notes, Reminders, Important Dates, and Password Vault.
  - **Adaptive Performance by Data Volume**:
    - **Light Data Users**: Immediate, near-instantaneous query response and rapid rendering in a single consolidated `/api/dashboard/overview` endpoint.
    - **Heavy Data Users**: Eliminates freezing or sluggish page loads by chunking requests, returning instant SQL aggregate counts + preview slices first, and non-blocking background streaming for full lists.
  - **Progressive Minimal-Time Hydration**: Critical dashboard metrics and recent widgets load within a minimal time window first, followed by secondary elements.
  - **Dashboard Multi-Function Preloading**: When the user enters the dashboard, concurrently streams initial preview data for other core modules (Notes, Reminders, Vault) in React memory so navigating between tabs is fluid and seamless.
  - *Status:* Completed & Verified.

- [x] **9. Task & Work Notifications (Cross-Platform System Tray & Desktop Alerts)**
  - **Permission Access Request Flow**: Friendly, luxury non-intrusive modal (`<NotificationPromptModal />`) explaining the value of notifications before triggering browser permissions, with smart 3-day dismissal cooldown.
  - **Cross-Platform Notification Support**:
    - **Mobile Devices (.APK & Mobile Browsers)**: Native push alerts delivered directly to the Android/mobile system notification tray (top status bar alongside Wi-Fi, battery, and clock icons) via dedicated Service Worker registration (`sw.js`) and `registration.showNotification()` with custom vibration cadence.
    - **Desktop Users (App & Desktop Browsers)**: Native OS desktop notifications (Windows Action Center, macOS Notification Center, Linux) via the browser Notification API and Service Worker client message dispatch.
    - **Web Browser Users**: Unified background notification support across Chrome, Edge, Safari, Firefox, and mobile Android browsers.
  - **Active Notifications & Automation**:
    - Automatic welcome confirmation notification and audio chime on permission grant.
    - 45-second background polling scheduler scanning due tasks, reminder deadlines, and expiring documents/dates (within 7-day countdown).
    - Synthesized luxury crystal fintech audio chimes (`playFintechChime()`) via the Web Audio API without relying on external media assets.
    - Foreground glassmorphic floating toast alerts (`<NotificationToast />`) with click-to-navigate action.
    - Dedicated "System Alerts & Notifications" section in Settings modal with live status pill, sound/due task/expiration toggles, and test notification/chime buttons.
  - *Status:* Completed & Verified.

- [x] **10. Admin Panel & Usage Telemetry (Exclusive to Super Admin)**
  - Dedicated admin controls and diagnostics, hidden and completely inaccessible to regular users, restricted strictly to authorized super-admin account.
  - Master PIN verification prompt (4-digit Master Admin PIN) required before granting entry to the Admin Panel.
  - Auto-lock protection: Admin panel automatically locks and clears authorization immediately upon modal exit, window blur, tab/app switching, session expiry, or new login.
  - Dedicated `user_usage_metrics` database table linked to `users.id` tracking:
    - User name & account identity
    - Frequency of app openings (`app_opens`)
    - Total active usage duration (`total_time_spent_seconds` / formatted hours and minutes)
    - Real-time active status (online dot indicator based on heartbeat telemetry)
  - Real-time system health metrics, database latency ping, environment diagnostics, and stored encrypted vault records breakdown.
  - Integrated User Feedbacks & Bug Reports management drawer with category badges and status updates.
  - *Status:* Completed & Deployed.

- [ ] **11. Mobile App (.APK Build)**
  - Capacitor integration with the Vite / React frontend.
  - Android Studio / Android CLI build pipeline.
  - Generates standalone installable `.apk` file for Android devices.

- [ ] **12. Superb Professional Loading Screen (Luxury App Splash & Launch Experience)**
  - High-fidelity luxury fintech splash/loading screen on initial app launch and cold starts.
  - Pulsing glowing RemiVault shield logo, biometric/fintech radiance ring, subtle typography, and smooth progress track.
  - Seamless transition/fade-out into the main application once authentication and initial data are hydrated.

- [ ] **13. Smart In-App Install Prompt (.APK / Device Compatibility Banner)**
  - Periodic, non-intrusive banner/modal popup detecting mobile device compatibility and offering one-click install/download of the standalone `.apk` app.
  - Dismissal cooldown logic (prompts periodically, remembers user dismissals so it doesn't annoy on every navigation/refresh).
  - Device detection (Android user agent vs desktop) to offer the appropriate `.apk` package or PWA install.

- [ ] **14. App Version Upgrade Notification & Download Management**
  - In-app version check against backend endpoint (`/api/app/version` or update manifest).
  - When a new version is released: shows an update alert banner/card announcing the new version.
  - Displays explicit download size (e.g. `Update size: 12.4 MB`) so users are aware of their internet/data usage before downloading.
  - If user clicks "Download & Update", initiates immediate update/download.
  - If deferred or ignored: snoozes and periodically reminds the user after several logins or next day until updated.

- [ ] **15. Post-Update "What's New" Changelog Modal (Auto-Dismiss by Content Height)**
  - After a successful upgrade (detected by version bump in local storage/app state), displays a sleek "What's New in vX.X.X" release notes modal highlighting new features and bug fixes.
  - Timed auto-close feature calibrated dynamically based on content length/height (longer release notes stay visible proportionally longer, or closes after reading time if untouched), while also allowing manual dismissal with a single tap.
