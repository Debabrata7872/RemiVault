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

- [ ] **5. Brand Identity & Custom App Logo Design**
  - Design a bespoke, luxury fintech logo for RemiVault (Vault + Shield + Spark concept).
  - Generate comprehensive brand assets: SVG vector logo, crisp favicon, PWA app icons (192x192, 512x512), and mobile launcher icon.
  - Integrate official logo across Navbar, Auth screen, Profile Lock screen, Settings, and Email templates.

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


- [ ] **8. Instant Local Storage Caching & Optimistic UI**
  - Cache notes, reminders, dates, and vault entries in `localStorage`.
  - Optimistic UI updates (instant local state update before server response).
  - Background synchronization (Stale-While-Revalidate pattern) for lightning-fast loads.

- [ ] **9. Task & Work Notifications (Permission Access Flow & Active Alerts)**
  - **Permission Access Request Flow**: Friendly, non-intrusive prompt explaining the value of notifications before triggering browser `Notification.requestPermission()`.
  - **Active Notifications (After Access Allowed)**:
    - Welcome confirmation notification once the user allows permission.
    - Automated push/browser notifications for due tasks, reminder deadlines, and expiring documents/dates.
    - Audio chime for completed tasks or urgent alerts.
    - In-app notification center / toast banners for real-time foreground updates.

- [ ] **10. Admin Panel (Exclusive to Super Admin)**
  - Dedicated admin controls and diagnostics, hidden and inaccessible to regular users, restricted strictly to the authorized super-admin account.
  - User accounts overview, active sessions, and verification statuses.
  - Real-time system health metrics, database status, and activity telemetry.

- [ ] **11. Mobile App (.APK Build)**
  - Capacitor integration with the Vite / React frontend.
  - Android Studio / Android CLI build pipeline.
  - Generates standalone installable `.apk` file for Android devices.
