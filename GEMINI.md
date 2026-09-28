# Project Rules

## Database Safety
- **Mandatory User Confirmation**: Never modify, update, truncate, drop, or delete database data or tables without asking for and receiving explicit user approval first.

## Git & Version Control
- **No Automatic Commits or Pushes**: Never commit or push to Git/GitHub automatically. Only commit or push when the user explicitly requests it.

## Daily Morning Reminder Protocol
- **Proactive Task Reminders**: Unless the user explicitly instructs to stop, always remind the user of the pending tasks and roadmap changes every morning (or start of day) when they text.
- **Active Task Progress**: Keep this list updated as tasks are completed.

## RemiVault Pending Works & Roadmap
1. [x] **Theme Modes (Dark, Light, System)**: Integrated with ThemeProvider, ThemeSwitcher, smooth transitions, and persistent storage. *(Ready to commit/deploy)*
2. [ ] **Modernize OTP Email Template**: Transform `otp.blade.php` into a world-class luxury fintech HTML email with gradient branding and security guidelines.
3. [ ] **Professional Email for Sending OTPs**: Transition from personal Gmail (`debabratasahoo499905@gmail.com`) to a professional sender (custom domain / transactional service like Brevo, Resend, or Google Workspace).
4. [ ] **Local Storage Caching & Optimistic UI**: Make saves, updates, and data fetching instantaneous via cache-first/SWR local storage strategies.
5. [ ] **Task & Work Notifications**: Web Notifications API, sound alerts, and reminder popups for due tasks and upcoming dates.
6. [ ] **Admin Panel**: Role-based access, user management, system health metrics, and activity logs.
7. [ ] **Mobile App (.APK)**: Package the web application into an installable Android APK via Capacitor / Android CLI.

