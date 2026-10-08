# Project Rules

## Database Safety
- **Mandatory User Confirmation**: Never modify, update, truncate, drop, or delete database data or tables without asking for and receiving explicit user approval first.

## Git & Version Control
- **No Automatic Commits or Pushes**: Never commit or push to Git/GitHub automatically. Only commit or push when the user explicitly requests it.

## Daily Morning Reminder Protocol
- **Proactive Task Reminders**: Unless the user explicitly instructs to stop, always remind the user of the pending tasks and roadmap changes every morning (or start of day) when they text.
- **Active Task Progress**: Keep this list updated as tasks are completed.

## RemiVault Pending Works & Roadmap
1. [x] **Theme Modes (Dark, Light, System)**: Integrated with ThemeProvider, ThemeSwitcher, smooth transitions, and persistent storage. *(Deployed/Committed)*
2. [x] **Security PIN & Profile Lock**: Secure 4-digit PIN setup, profile lock screen with cooldown timer, auto-lock on inactivity, authoritative database sync, and cross-device persistence. *(Deployed/Committed)*
3. [x] **Multi-Profile & Custom Avatars**: Support for multiple device profiles, custom avatars/initials, and profile switching. *(Deployed/Committed)*
4. [x] **In-App User Feedback System**: Interactive feedback modal in Settings with categories, clean user-friendly messaging, and backend database storage. *(Deployed/Committed)*
5. [x] **Brand Identity & Custom App Logo Design**: Bespoke luxury fintech logo (Vault + Shield + Spark concept), crisp vector favicon, PWA icons (192x192, 512x512), mobile launcher icon, BrandLogo React component, and integrated headers across Navbar and Profile Lock. *(Completed)*
6. [x] **Modernize OTP Email Template**: Redesigned into a luxury fintech HTML email with responsive tables, discrete digit tiles, audit metadata, security advisories, and cross-client compatibility. *(Completed)*
7. [x] **Professional Email for Sending OTPs**: Transitioned to Brevo transactional email relay with TLS encryption, 300 free emails/day quota, verified sender, and cross-platform (local & online server) support. *(Completed)*
8. [x] **Premium Skeleton Placeholders, Progressive Fetching & Adaptive Preloading (Zero LocalStorage)**: Luxury fintech shimmer skeleton placeholders during fetch, progressive minimal-time hydration, adaptive non-blocking chunking for heavy-data users, and background preloading of multi-function preview data from the dashboard without storing any data in local storage. *(Completed)*
9. [x] **Task & Work Notifications (Cross-Platform System Tray & Desktop Alerts)**: Friendly permission request flow explaining value, followed by active system-level notifications after access is allowed. Mobile (.APK and mobile browser) users receive push notifications in the top Android system notification tray (alongside Wi-Fi/battery/clock), desktop and web browser users receive OS desktop notifications, with automated due task alerts, document expiration countdowns, and sound chimes. *(Completed)*
10. [x] **Admin Panel & Usage Telemetry**: Role-based access exclusively for authorized super admin (hidden and off for all other users). Protected with 4-digit Master Admin PIN verification before entry. Dedicated `user_usage_metrics` database table tracking user name, app opening frequency (app_opens), and active time spent (heartbeat telemetry). Integrated system health diagnostics and user feedback management. *(Completed)*
11. [ ] **Mobile App (.APK)**: Package the web application into an installable Android APK via Capacitor / Android CLI.
12. [ ] **Superb Professional Loading Screen**: Luxury app splash and launch loading screen with radiant pulsing logo, progress indicators, and smooth reveal animation.
13. [ ] **Smart In-App Install Prompt (.APK Download)**: Periodic, non-intrusive popup/banner detecting compatible mobile devices to offer one-click download/installation of the standalone `.apk` app, with dismissal cooldown.
14. [ ] **App Version Upgrade Notification & Download Management**: Automatic version update detection showing new release alerts, explicit download size preview (for data/bandwidth awareness), instant update trigger, and periodic snoozed reminders until updated.
15. [ ] **Post-Update "What's New" Changelog Modal (Auto-Dismiss by Content Height)**: Interactive release notes modal appearing on post-update first launch, with auto-close timing calibrated dynamically to content length/height.

