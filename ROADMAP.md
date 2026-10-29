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

- [x] **11. Mobile App (.APK Build)**
  - Capacitor integration with the Vite / React frontend (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/splash-screen`, `@capacitor/status-bar`).
  - Android Gradle build pipeline using OpenJDK 21 and Android SDK tools.
  - Bespoke RemiVault launcher icons across all screen densities and luxury dark splash screens.
  - Cleartext local development traffic and dynamic API resolution (`getApiBaseUrl()`).
  - Generated standalone installable `.apk` file (4.89 MB) ready for deployment.
  - *Status:* Completed.

- [x] **12. Superb Professional Loading Screen (Luxury App Splash & Launch Experience)**
  - High-fidelity luxury fintech launch screen with central floating RemiVault crest and dual rotating combination dials.
  - Interactive category security capsules animating Passwords & Secrets, Private Notes & Documents, Reminders & Alerts, and Important Dates into "Locked Safely" status.
  - Non-linear mechanical progress easing, dynamic security telemetry feed, and harmonic crystal audio chime.
  - Replay button integrated directly into Settings ("Vault Launch & Lock Experience") allowing users to admire the animations anytime.
  - Seamless fade-out transition into the main application.
  - *Status:* Completed.

- [x] **13. Smart In-App Install Prompt (.APK / Device Compatibility Banner)**
  - Periodic, non-intrusive floating banner & comprehensive modal detecting mobile device compatibility and offering one-click download/installation of the standalone `.apk` app.
  - Device detection distinguishing Android mobile browsers, desktop PCs, Apple iOS devices, and standalone native platforms.
  - Native platform detection via `Capacitor.isNativePlatform()` ensuring installed APK users never see prompts.
  - Non-intrusive dismissal cooldown logic (48-hour cooldown on dismissal, 14-day cooldown upon APK download).
  - High-fidelity `InstallAppModal` with direct 4-step installation walkthrough, features overview, offline SVG QR code generator for scanning from desktop to phone, and PWA installation support.
  - Integrated "Mobile App (.APK) & Desktop" drawer in Settings allowing instant manual download and access anytime.
  - Backend `/api/app/version` and `/api/download/apk` endpoints with package-archive headers preventing browser `.zip` naming quirks.
  - *Status:* Completed.

- [x] **14. App Version Upgrade Notification & Download Management**
  - In-app version check against backend endpoint (`/api/app/version`) with semver and version code comparison (`compareSemver`).
  - Sleek `AppUpdateBanner` announcing new version availability (`v0.2.0 ➔ v0.3.0`) with animated pulse indicators and non-blocking layout.
  - Prominent bandwidth awareness badge explicitly displaying download size (`17.5 MB`) so users are aware of their mobile data usage before downloading.
  - One-click "Download & Update" action triggering instant APK download with live feedback.
  - Periodic snooze logic (`snoozeUpdate`): hides alert for 24 hours, but automatically reminds the user on the next day or after 3 app logins until updated.
  - Comprehensive `AppUpdateModal` with release notes, data usage advisories, and categorized changelog bullets.
  - Settings Modal integration with "Check Updates" button and developer simulation controls (`/api/app/toggle-simulated-release`).
  - *Status:* Completed.

- [x] **15. Post-Update "What's New" Changelog Modal (Auto-Dismiss by Content Height)**
  - Automatic post-update detection (`shouldShowWhatsNew`) triggering on first launch after a version upgrade or initial deployment.
  - Interactive, luxury fintech `WhatsNewModal` highlighting features, security updates, and performance optimizations.
  - Dynamic content-height-calibrated auto-dismiss timer (`calculateAutoDismissDuration`): accurately measures scrollable DOM height and changelog density to scale the countdown duration proportionally (10s to 32s).
  - Hover, scroll, and touch detection automatically pausing the auto-close timer into "reading mode".
  - Sleek visual countdown progress bar with manual toggle (Pause / Resume timer).
  - Instant single-tap dismissal via "Got It, Explore Vault" CTA button, top-right close icon, or Escape key.
  - Settings Modal integration with a "View What's New" replay button allowing users to review release notes anytime.
  - *Status:* Completed.

- [ ] **16. Native Mobile Bottom Navigation Bar (Thumb Reachability & Safe-Area Insets)**
  - Fixed, frosted-glass bottom tab navigation bar for mobile viewports (`<= 768px`) and standalone Android APK.
  - One-handed thumb reachability for instantaneous switching across Dashboard, Password Vault, Important Dates, Reminders, and Personal Notes.
  - Native safe-area inset support (`env(safe-area-inset-bottom)`) accommodating modern Android gesture navigation bars and edge-to-edge displays.

- [ ] **17. Interactive Landing Page Hero Preview (Interactive Live Vault Demo)**
  - Interactive live vault demo card right in the public hero section.
  - Interactive password reveal toggle with cryptographic obfuscation animation, auto-lock countdown timer simulation, and real-time encryption flip to demonstrate zero-knowledge security to new visitors before sign-up.

- [ ] **18. Tactile Haptic Feedback on Mobile (PIN Entry & Mechanical Dial Actions)**
  - Subtle physical haptic tick vibrations (`@capacitor/haptics` on Android native app and Web Vibration API fallback) on 4-digit PIN button presses, lock/unlock triggers, combination dials, and credential copying.
  - Simulates the tactile sensation of a precision physical mechanical vault dial in the user's hand.
