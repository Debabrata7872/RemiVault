# RemiVault

RemiVault is a secure personal productivity and information-management application designed to isolate user data and manage:
- Reminders
- Important / specific dates
- Notes
- Password & credential vault entries
- Personal profile data

---

## Architecture Overview

RemiVault uses a decoupled client-server architecture:

```
+---------------------------+             +-------------------------------+
|  Frontend (SPA)           |   HTTP/JSON |  Backend (REST API)           |
|  React + TypeScript       | <---------> |  Laravel (PHP 8.2+)           |
|  Vite Dev Server          |             |  Laravel Artisan Serve        |
+---------------------------+             +---------------+---------------+
                                                          |
                                                          | PDO Connection
                                                          v
                                                  +---------------+
                                                  |  Database     |
                                                  |  MySQL        |
                                                  +---------------+
```

### Directory Structure
- `backend/`: Laravel REST API (Authentication, Authorization, Business Logic, Encryption, Scheduling)
- `frontend/`: React + TypeScript SPA (UI, State Management, API Client)

---

## Security Foundations
- Strict authorization checks on all user data (mitigating IDOR / BOLA).
- Sensitive authentication credentials hashed with modern algorithms (Bcrypt / Argon2id).
- Vault secrets symmetrically encrypted (AES-256-GCM) with authenticated user keys.
- Never commit `.env` or application secrets into source control.
