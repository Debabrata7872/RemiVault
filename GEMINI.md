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
8. [ ] **Local Storage Caching & Optimistic UI**: Make saves, updates, and data fetching instantaneous via cache-first/SWR local storage strategies.
9. [ ] **Task & Work Notifications (Permission Flow & Active Alerts)**: Friendly permission request flow explaining value, followed by active notifications after access is allowed (welcome alert, due task/reminder notifications, document expiration countdowns, and sound chimes).
10. [ ] **Admin Panel**: Role-based access exclusively for authorized super admin (hidden and off for all other users), user management, system health metrics, and activity logs.
11. [ ] **Mobile App (.APK)**: Package the web application into an installable Android APK via Capacitor / Android CLI.
