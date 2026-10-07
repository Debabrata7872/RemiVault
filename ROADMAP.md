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
