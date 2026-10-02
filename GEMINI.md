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
2. [x] **Security PIN & Profile Lock**: Secure 4-digit PIN setup, profile lock screen with cooldown timer, auto-lock on inactivity, and encrypted storage. *(Deployed/Committed)*
3. [x] **Multi-Profile & Custom Avatars**: Support for multiple device profiles, custom avatars/initials, and profile switching. *(Deployed/Committed)*
4. [x] **In-App User Feedback System**: Interactive feedback modal in Settings with ratings, category selection, and backend database storage. *(Deployed/Committed)*
5. [ ] **Modernize OTP Email Template**: Transform `otp.blade.php` into a world-class luxury fintech HTML email with gradient branding and security guidelines.
6. [ ] **Professional Email for Sending OTPs**: Transition from personal Gmail (`debabratasahoo499905@gmail.com`) to a professional sender (custom domain / transactional service like Brevo, Resend, or Google Workspace).
7. [ ] **Local Storage Caching & Optimistic UI**: Make saves, updates, and data fetching instantaneous via cache-first/SWR local storage strategies.
8. [ ] **Task & Work Notifications**: Web Notifications API, sound alerts, and reminder popups for due tasks and upcoming dates.
9. [ ] **Admin Panel**: Role-based access, user management, system health metrics, and activity logs.
10. [ ] **Mobile App (.APK)**: Package the web application into an installable Android APK via Capacitor / Android CLI.


