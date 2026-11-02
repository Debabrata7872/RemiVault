import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  X, 
  EyeOff, 
  KeyRound, 
  AlertTriangle,
  Server,
  Database
} from 'lucide-react';
import './LegalComplianceModal.css';

export type LegalTab = 'zero-knowledge' | 'privacy' | 'terms';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'zero-knowledge',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // Sync tab when opened with a specific initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="legal-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="legal-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="legal-modal-header">
          <div className="legal-header-left">
            <div className="legal-header-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="legal-header-title">Legal, Trust &amp; Cryptography</h3>
              <p className="legal-header-sub">RemiVault Security Architecture &amp; User Protection Agreements</p>
            </div>
          </div>
          <button className="legal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="legal-nav-tabs" role="tablist">
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'zero-knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('zero-knowledge')}
            role="tab"
            aria-selected={activeTab === 'zero-knowledge'}
          >
            <Lock size={15} />
            <span>Zero-Knowledge Disclosure</span>
          </button>

          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
            role="tab"
            aria-selected={activeTab === 'privacy'}
          >
            <EyeOff size={15} />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
            role="tab"
            aria-selected={activeTab === 'terms'}
          >
            <FileText size={15} />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="legal-modal-body">
          <span className="legal-last-updated">Last Updated: November 2026 • Production Edition</span>

          {/* TAB 1: ZERO-KNOWLEDGE ARCHITECTURE & ENCRYPTION DISCLOSURE */}
          {activeTab === 'zero-knowledge' && (
            <div className="legal-tab-content">
              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <KeyRound size={18} color="#f59e0b" />
                  <span>1. Zero-Knowledge Cryptographic Principle</span>
                </h4>
                <p>
                  RemiVault is architected around the fundamental standard of <strong>Zero-Knowledge Encryption</strong>. 
                  This means your passwords, account secrets, and private recovery notes are encrypted with <strong>AES-256-CBC</strong> 
                  and cryptographic HMAC signatures before they ever touch physical disk storage.
                </p>

                <div className="legal-callout-card gold-theme">
                  <h5>
                    <EyeOff size={16} color="#f59e0b" />
                    <span>The RemiVault Zero-Access Guarantee</span>
                  </h5>
                  <p>
                    Neither RemiVault developers, server engineers, hosting providers, nor automated maintenance workers 
                    can read, inspect, decrypt, or share your saved passwords. The cryptographic cipher keys required to unlock 
                    your records are strictly authenticated by your authorized credentials and PIN.
                  </p>
                </div>
              </div>

              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <Database size={18} color="#818cf8" />
                  <span>2. Zero-LocalStorage Data Policy</span>
                </h4>
                <p>
                  Unlike standard web applications that cache sensitive user records into unencrypted browser <code>localStorage</code> or 
                  device cookies, RemiVault enforces an absolute <strong>Zero-LocalStorage Policy</strong> for credentials:
                </p>
                <ul className="legal-bullets-list">
                  <li><strong>Ephemeral In-Memory Hydration:</strong> Unencrypted passwords exist only in volatile React memory while you actively interact with them.</li>
                  <li><strong>Instant Auto-Purge:</strong> Closing your browser tab, switching profiles, or remaining inactive instantly dumps decrypted records from RAM.</li>
                  <li><strong>Cross-Site Scripting (XSS) Immunity:</strong> Malicious browser extensions or third-party scripts cannot extract stored passwords from browser storage.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <AlertTriangle size={18} color="#ef4444" />
                  <span>3. User Ownership &amp; Recovery Responsibility</span>
                </h4>
                <p>
                  Because we cannot decrypt your records on your behalf, you are the sole custodian of your account. 
                  Account recovery is mediated exclusively through verified two-factor Email OTP authorization sent to your verified email address. 
                  Keep your registered email account secure.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="legal-tab-content">
              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <ShieldCheck size={18} color="#10b981" />
                  <span>1. Information We Collect</span>
                </h4>
                <p>
                  RemiVault collects only the bare minimum information necessary to maintain your security vault:
                </p>
                <ul className="legal-bullets-list">
                  <li><strong>Account Identity:</strong> Your chosen account name and email address for login authentication and OTP delivery.</li>
                  <li><strong>Vault Records (Encrypted):</strong> Credentials, notes, deadlines, and reminders created by you (stored in encrypted format).</li>
                  <li><strong>Diagnostics &amp; Security Telemetry:</strong> Anonymized app opening counts and active session duration (heartbeat) used solely to optimize app performance and detect platform health.</li>
                </ul>
              </div>

              <div className="legal-callout-card green-theme">
                <h5>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>What We NEVER Collect or Sell</span>
                </h5>
                <p>
                  We never sell, rent, monetize, or monetize your personal information to third parties or advertising networks. 
                  We do not track your browsing habits, IP geo-locations outside rate-limiting defenses, or device contacts.
                </p>
              </div>

              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <Server size={18} color="#818cf8" />
                  <span>2. Third-Party Service Providers</span>
                </h4>
                <p>
                  To deliver reliable notifications and authentication, we use trusted infrastructure partners operating under strict data agreements:
                </p>
                <ul className="legal-bullets-list">
                  <li><strong>Brevo (Sendinblue):</strong> Transactional email relay for delivering verification OTPs and security alerts over TLS encryption.</li>
                  <li><strong>Firebase (Google LLC):</strong> Optional authentication provider if you select "Continue with Google".</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <FileText size={18} color="#f59e0b" />
                  <span>3. User Data Deletion Rights</span>
                </h4>
                <p>
                  You retain complete ownership over your data. You may edit, archive, or permanently delete any individual vault record, 
                  reminder, or note at any time. When deleted, records are immediately purged from active database tables.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="legal-tab-content">
              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <FileText size={18} color="#818cf8" />
                  <span>1. Acceptance of Terms</span>
                </h4>
                <p>
                  By registering an account, downloading the standalone RemiVault mobile app, or accessing our services, 
                  you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use RemiVault.
                </p>
              </div>

              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <Lock size={18} color="#f59e0b" />
                  <span>2. User Responsibilities &amp; Device Security</span>
                </h4>
                <p>
                  You are solely responsible for maintaining the confidentiality of your account credentials, Master PIN, and mobile device security:
                </p>
                <ul className="legal-bullets-list">
                  <li>You must configure a non-trivial 4-digit Security PIN and enable device lock screen defenses on your phone.</li>
                  <li>You agree not to use RemiVault for illegal data exfiltration, storage of malicious code, or unauthorized network probing.</li>
                  <li>You must notify us immediately through the in-app Feedback &amp; Bug Report drawer if you suspect unauthorized access.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h4 className="legal-heading">
                  <AlertTriangle size={18} color="#ef4444" />
                  <span>3. Limitation of Liability &amp; Disclaimers</span>
                </h4>
                <p>
                  RemiVault is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While we employ industry-standard 
                  AES-256 encryption, rate limiting, and dual-layer verification, no internet transmission or electronic storage system 
                  is 100% impenetrable. We do not warrant that services will be uninterrupted or error-free.
                </p>
                <div className="legal-callout-card">
                  <h5>
                    <ShieldCheck size={16} color="#818cf8" />
                    <span>Disaster Recovery Recommendation</span>
                  </h5>
                  <p>
                    We recommend keeping offline physical recovery sheets of your most critical primary email and financial recovery codes 
                    in a physical safe alongside using RemiVault.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="legal-modal-footer">
          <div className="legal-security-assurance">
            <CheckCircle2 size={16} />
            <span>End-to-End Cryptographic Zero-Knowledge Standard</span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary legal-dismiss-btn" 
            onClick={onClose}
          >
            I Understand &amp; Agree
          </button>
        </div>

      </div>
    </div>
  );
};

