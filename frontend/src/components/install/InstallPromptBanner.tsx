import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Monitor,
  Share2
} from 'lucide-react';
import { 
  getDeviceType, 
  shouldShowInstallPrompt, 
  dismissInstallPrompt, 
  triggerApkDownload,
  promptPwaInstall,
  canTriggerPwaInstall,
  fetchAppVersionInfo,
  type AppVersionInfo
} from '../../services/installPromptService';
import './InstallApp.css';

interface InstallPromptBannerProps {
  onOpenDetailsModal: () => void;
  disabled?: boolean;
}

export const InstallPromptBanner: React.FC<InstallPromptBannerProps> = ({
  onOpenDetailsModal,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  const device = getDeviceType();

  // Polite delay before showing banner (4.5s) to avoid intruding on initial load
  useEffect(() => {
    if (disabled || !shouldShowInstallPrompt()) {
      return;
    }

    const timer = setTimeout(() => {
      // Re-verify after timer in case user logged out or changed state
      if (shouldShowInstallPrompt()) {
        setIsVisible(true);
        fetchAppVersionInfo().then(setVersionInfo);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [disabled]);

  if (!isVisible || disabled) return null;

  const handleDismiss = () => {
    dismissInstallPrompt();
    setIsVisible(false);
  };

  const handleDownloadApk = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    triggerApkDownload();
    setDownloadTriggered(true);

    setTimeout(() => {
      setIsDownloading(false);
      // Fade out banner smoothly after successful download trigger
      setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    }, 1200);
  };

  const handlePwaInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const installed = await promptPwaInstall();
    if (installed) {
      setPwaInstalled(true);
      setTimeout(() => setIsVisible(false), 2000);
    }
  };

  const handleOpenDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDetailsModal();
  };

  const apkSize = versionInfo?.apk_size_formatted || '17.5 MB';

  return (
    <div className="install-banner-wrapper" role="region" aria-label="App Installation Prompt">
      <div className="install-banner-card">
        {/* Close Button */}
        <button 
          type="button" 
          className="install-banner-close" 
          onClick={handleDismiss}
          title="Dismiss for 48 hours"
          aria-label="Dismiss banner"
        >
          <X size={15} />
        </button>

        {/* Ambient Left Icon */}
        <div className="install-banner-icon-box">
          {device === 'android' ? (
            <Smartphone size={22} className="banner-phone-icon" />
          ) : device === 'ios' ? (
            <Share2 size={22} className="banner-phone-icon" />
          ) : (
            <Monitor size={22} className="banner-phone-icon" />
          )}
          <span className="banner-icon-sparkle">
            <Sparkles size={11} />
          </span>
        </div>

        {/* Banner Text Body */}
        <div className="install-banner-text">
          <div className="install-banner-badge-row">
            {device === 'android' ? (
              <span className="badge badge-primary banner-badge">Android .APK</span>
            ) : device === 'ios' ? (
              <span className="badge badge-primary banner-badge">Add to Home Screen</span>
            ) : (
              <span className="badge badge-primary banner-badge">Standalone App</span>
            )}
            <span className="banner-meta-tag">
              {device === 'android' ? `${apkSize} • Offline Ready` : 'Fast & Private'}
            </span>
          </div>

          <h4 className="install-banner-title">
            {device === 'android' 
              ? 'Get RemiVault for Android' 
              : device === 'ios' 
              ? 'Add RemiVault to Home Screen' 
              : 'Install RemiVault App'}
          </h4>

          <p className="install-banner-subtitle">
            {device === 'android'
              ? 'Hardware PIN lock, zero browser bars, and status bar notification alerts.'
              : device === 'ios'
              ? 'Instant home screen launch with dedicated fullscreen security.'
              : 'Available as a standalone Android .APK for your phone and native Desktop App.'}
          </p>

          {downloadTriggered && (
            <div className="banner-feedback-pill success">
              <CheckCircle2 size={13} />
              <span>Download started! Open <code>RemiVault.apk</code> to install.</span>
            </div>
          )}

          {pwaInstalled && (
            <div className="banner-feedback-pill success">
              <CheckCircle2 size={13} />
              <span>RemiVault Desktop App successfully installed!</span>
            </div>
          )}
        </div>

        {/* Banner Action Controls */}
        <div className="install-banner-actions">
          {device === 'android' ? (
            <button
              type="button"
              className="btn btn-primary banner-action-btn main"
              onClick={handleDownloadApk}
              disabled={isDownloading}
            >
              <Download size={14} className={isDownloading ? 'spin-anim' : ''} />
              <span>{isDownloading ? 'Downloading...' : `Download APK (${apkSize})`}</span>
            </button>
          ) : canTriggerPwaInstall() ? (
            <button
              type="button"
              className="btn btn-primary banner-action-btn main"
              onClick={handlePwaInstall}
            >
              <Download size={14} />
              <span>Install Desktop App</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary banner-action-btn main"
              onClick={handleDownloadApk}
            >
              <Download size={14} />
              <span>Get Android APK</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary banner-action-btn secondary"
            onClick={handleOpenDetails}
          >
            <Info size={13} />
            <span>Guide</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost banner-later-btn"
            onClick={handleDismiss}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
