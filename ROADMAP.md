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
  - *Status:* Implemented & verified. Ready to commit.

- [ ] **2. Modernize OTP Email Template**
  - Revamp [`backend/resources/views/emails/otp.blade.php`](file:///c:/xampp/htdocs/RemiVault/backend/resources/views/emails/otp.blade.php).
  - Modern, responsive HTML email design compatible with Gmail, Apple Mail, Outlook.
  - Large formatted 6-digit code box, security advisory, timer countdown notice, and branded header.

- [ ] **3. Professional Email Setup for Sending OTPs**
  - Transition from personal Gmail (`debabratasahoo499905@gmail.com`) to a professional sending system.
  - Options:
    1. **Transactional Email API (Free tiers available)**: Brevo (formerly Sendinblue - 300 free emails/day), Resend (3,000 free emails/month), or Mailgun.
    2. **Custom Domain Email**: `auth@remivault.com` / `noreply@remivault.com` via Google Workspace or Zoho Mail.
  - Update `MAIL_*` environment variables in Laravel and Render.

- [ ] **4. Instant Local Storage Caching & Optimistic UI**
  - Cache notes, reminders, dates, and vault entries in `localStorage`.
  - Optimistic UI updates (instant local state update before server response).
  - Background synchronization (Stale-While-Revalidate pattern) for lightning-fast loads.

- [ ] **5. Task & Work Notifications**
  - Web Notifications API for desktop and mobile browser push notifications.
  - Audio sound chime for completed / due reminders.
  - Urgent reminder banner and popup alerts when deadlines approach.

- [ ] **6. Admin Panel**
  - Dedicated admin route and dashboard.
  - User accounts overview, active sessions, and verification statuses.
  - Real-time server telemetry, database status, and error logs.

- [ ] **7. Mobile App (.APK Build)**
  - Capacitor integration with the Vite / React frontend.
  - Android Studio / Android CLI build pipeline.
  - Generates standalone installable `.apk` file for Android users.
