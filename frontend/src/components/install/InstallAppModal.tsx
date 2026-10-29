import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  ShieldCheck, 
  Check, 
  Copy, 
  QrCode, 
  Monitor, 
  Bell, 
  Lock, 
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  getDeviceType, 
  getApkDownloadUrl, 
  triggerApkDownload, 
  promptPwaInstall, 
  canTriggerPwaInstall,
  fetchAppVersionInfo,
  type AppVersionInfo 
} from '../../services/installPromptService';
import { generateQrMatrix } from '../../utils/qrCode';
import './InstallApp.css';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'android' | 'desktop' | 'qr';
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  initialTab,
}) => {
  const device = getDeviceType();
  const [activeTab, setActiveTab] = useState<'android' | 'desktop' | 'qr'>('android');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [pwaInstallSuccess, setPwaInstallSuccess] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  // Set default tab based on device detection or initialTab prop
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (device === 'android') {
      setActiveTab('android');
    } else {
      setActiveTab('android'); // Default highlight Android APK
    }
  }, [initialTab, device]);

  // Fetch dynamic version metadata
  useEffect(() => {
    if (isOpen) {
      fetchAppVersionInfo().then(setVersionInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadUrl = getApkDownloadUrl();
  const fullDownloadUrl = downloadUrl.startsWith('http') 
    ? downloadUrl 
    : `${window.location.origin}${downloadUrl}`;

  const handleDownloadApk = () => {
    setIsDownloading(true);
    triggerApkDownload();
    setDownloadSuccess(true);
    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullDownloadUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  const handleInstallPwa = async () => {
    const success = await promptPwaInstall();
    if (success) {
      setPwaInstallSuccess(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  // Generate QR Code matrix
  const qrMatrix = generateQrMatrix(fullDownloadUrl);

  return (
    <div className="modal-backdrop install-modal-backdrop" onClick={onClose} style={{ zIndex: 1070 }}>
      <div 
        className="modal-content install-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn install-modal-close" 
          onClick={onClose}
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Hero Header */}
        <div className="install-hero-header">
          <div className="install-icon-emblem">
            <Smartphone size={32} className="install-phone-icon" />
            <span className="install-sparkle-pill">
              <Sparkles size={14} />
            </span>
          </div>

          <div className="install-title-wrap">
            <div className="install-pill-row">
              <span className="badge badge-primary install-badge">Standalone Mobile App</span>
              <span className="install-version-tag">
                {versionInfo?.version ? `v${versionInfo.version}` : 'v0.2.0'}
              </span>
            </div>
            <h2 className="install-main-title">RemiVault Standalone .APK</h2>
            <p className="install-subtitle">
              Install the high-security standalone Android app for instant offline access, hardware PIN lock, and system notification tray alerts.
            </p>
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="install-nav-tabs">
          <button 
            type="button"
            className={`install-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={15} />
            <span>Android (.APK)</span>
            {device === 'android' && <span className="tab-current-pill">Recommended</span>}
          </button>

          <button 
            type="button"
            className={`install-tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode size={15} />
            <span>Scan to Phone</span>
          </button>

          <button 
            type="button"
            className={`install-tab-btn ${activeTab === 'desktop' ? 'active' : ''}`}
            onClick={() => setActiveTab('desktop')}
          >
            <Monitor size={15} />
            <span>Desktop App</span>
          </button>
        </div>

        {/* TAB 1: ANDROID APK */}
        {activeTab === 'android' && (
          <div className="install-tab-content">
            {/* Primary Download Banner Card */}
            <div className="install-download-box">
              <div className="install-box-left">
                <div className="install-apk-badge">
                  <span className="apk-label">APK</span>
                  <span className="apk-size">{versionInfo?.apk_size_formatted || '17.5 MB'}</span>
                </div>
                <div>
                  <h3 className="download-box-heading">RemiVault Android Release</h3>
                  <p className="download-box-sub">
                    Direct installer • Android 8.0+ • Zero Google Play required
                  </p>
                </div>
              </div>

              <div className="install-box-right">
                <button
                  type="button"
                  className="btn btn-primary download-apk-main-btn"
                  onClick={handleDownloadApk}
                  disabled={isDownloading}
                >
                  <Download size={17} className={isDownloading ? 'spin-anim' : ''} />
                  <span>{isDownloading ? 'Starting Download...' : 'Download .APK (17.5 MB)'}</span>
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="install-alert-banner success">
                <CheckCircle2 size={16} />
                <span>
                  <strong>Download Initiated!</strong> Check your notification bar or Downloads folder for <code>RemiVault.apk</code>.
                </span>
              </div>
            )}

            {/* Core Advantages */}
            <div className="install-benefits-grid">
              <div className="install-benefit-card">
                <div className="benefit-icon-ring green">
                  <ShieldCheck size={18} />
                </div>
                <div className="benefit-text">
                  <strong>Hardware-Backed PIN Lock</strong>
                  <p>Persistent biometric &amp; 4-digit PIN security without browser cookie wipes.</p>
                </div>
              </div>

              <div className="install-benefit-card">
                <div className="benefit-icon-ring amber">
                  <Bell size={18} />
                </div>
                <div className="benefit-text">
                  <strong>Status Bar &amp; Tray Alerts</strong>
                  <p>Real-time notifications right in your top Android notification bar beside Wi-Fi.</p>
                </div>
              </div>

              <div className="install-benefit-card">
                <div className="benefit-icon-ring blue">
                  <Lock size={18} />
                </div>
                <div className="benefit-text">
                  <strong>100% Offline Capable</strong>
                  <p>Encrypted passwords, notes, and dates accessible even without an active internet connection.</p>
                </div>
              </div>

              <div className="install-benefit-card">
                <div className="benefit-icon-ring purple">
                  <Sparkles size={18} />
                </div>
                <div className="benefit-text">
                  <strong>Zero Browser Chrome</strong>
                  <p>Clean, distraction-free fullscreen vault experience with ultra-smooth native transitions.</p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Installation Instructions */}
            <div className="install-steps-section">
              <h4 className="install-steps-title">
                <Info size={15} />
                <span>Quick 4-Step Installation Guide</span>
              </h4>

              <div className="install-steps-list">
                <div className="install-step-item">
                  <span className="step-number">1</span>
                  <div className="step-info">
                    <strong>Tap Download .APK</strong>
                    <p>The package (<code>RemiVault.apk</code>) will download directly to your mobile device.</p>
                  </div>
                </div>

                <div className="install-step-item">
                  <span className="step-number">2</span>
                  <div className="step-info">
                    <strong>Open the Downloaded File</strong>
                    <p>Pull down your notification shade or open your phone's <em>Files / Downloads</em> app and tap <code>RemiVault.apk</code>.</p>
                  </div>
                </div>

                <div className="install-step-item">
                  <span className="step-number">3</span>
                  <div className="step-info">
                    <strong>Allow Unknown App Source</strong>
                    <p>If Android displays <em>"For security, your phone is not allowed to install unknown apps"</em>, tap <strong>Settings</strong> and toggle <strong>Allow from this source</strong> to ON.</p>
                  </div>
                </div>

                <div className="install-step-item">
                  <span className="step-number">4</span>
                  <div className="step-info">
                    <strong>Tap Install &amp; Launch</strong>
                    <p>Select <strong>Install</strong>. Once complete, RemiVault will appear on your app drawer and home screen!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCAN QR CODE TO PHONE */}
        {activeTab === 'qr' && (
          <div className="install-tab-content install-qr-tab">
            <div className="qr-hero-card">
              <div className="qr-matrix-container">
                <svg 
                  viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                  className="qr-matrix-svg"
                  shapeRendering="crispEdges"
                >
                  <rect width={qrMatrix.length} height={qrMatrix.length} fill="#ffffff" rx={1} />
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) =>
                      cell ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c}
                          y={r}
                          width={1}
                          height={1}
                          fill="#0f172a"
                        />
                      ) : null
                    )
                  )}
                </svg>
                <div className="qr-center-shield">
                  <ShieldCheck size={18} color="#d97706" />
                </div>
              </div>

              <div className="qr-instructions">
                <h3 className="qr-title">Scan Camera to Download APK</h3>
                <p className="qr-sub">
                  Point your Android phone's camera or Google Lens at this code to download and install <code>RemiVault.apk</code> instantly on your phone.
                </p>

                <div className="qr-link-copy-row">
                  <input 
                    type="text" 
                    readOnly 
                    value={fullDownloadUrl}
                    className="qr-link-input"
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary qr-copy-btn"
                    onClick={handleCopyLink}
                    title="Copy Download URL"
                  >
                    {isCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DESKTOP APP (PWA) */}
        {activeTab === 'desktop' && (
          <div className="install-tab-content">
            <div className="install-download-box">
              <div className="install-box-left">
                <div className="install-apk-badge desktop">
                  <Monitor size={22} />
                </div>
                <div>
                  <h3 className="download-box-heading">RemiVault Desktop App</h3>
                  <p className="download-box-sub">
                    Runs in an isolated window with taskbar pinning and native shortcuts.
                  </p>
                </div>
              </div>

              <div className="install-box-right">
                {canTriggerPwaInstall() ? (
                  <button
                    type="button"
                    className="btn btn-primary download-apk-main-btn"
                    onClick={handleInstallPwa}
                  >
                    <Download size={17} />
                    <span>Install Desktop App</span>
                  </button>
                ) : (
                  <span className="badge badge-success pwa-ready-badge">
                    <CheckCircle2 size={14} />
                    <span>PWA Ready</span>
                  </span>
                )}
              </div>
            </div>

            {pwaInstallSuccess && (
              <div className="install-alert-banner success">
                <CheckCircle2 size={16} />
                <span>RemiVault has been installed to your desktop applications!</span>
              </div>
            )}

            <div className="install-steps-section">
              <h4 className="install-steps-title">
                <Monitor size={15} />
                <span>How to Install on Chrome, Edge &amp; Brave</span>
              </h4>

              <div className="install-steps-list">
                <div className="install-step-item">
                  <span className="step-number">1</span>
                  <div className="step-info">
                    <strong>Look at the Address Bar</strong>
                    <p>In the top URL bar of your browser, find the <strong>Install RemiVault</strong> icon (computer screen with a down arrow).</p>
                  </div>
                </div>

                <div className="install-step-item">
                  <span className="step-number">2</span>
                  <div className="step-info">
                    <strong>Click Install</strong>
                    <p>Or click the three dots menu (⋮) in your browser top-right, go to <em>"Save and share"</em> or <em>"Apps"</em>, and select <strong>"Install RemiVault"</strong>.</p>
                  </div>
                </div>

                <div className="install-step-item">
                  <span className="step-number">3</span>
                  <div className="step-info">
                    <strong>Pin to Taskbar or Dock</strong>
                    <p>Launch RemiVault anytime with a single click from your Windows Taskbar, macOS Dock, or Start Menu.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="install-modal-footer">
          <div className="install-footer-note">
            <ShieldCheck size={14} color="#10b981" />
            <span>Cryptographically signed package • Built with Capacitor &amp; Vite</span>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary install-close-btn"
            onClick={onClose}
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
