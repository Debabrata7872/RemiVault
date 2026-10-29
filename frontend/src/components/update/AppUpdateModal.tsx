import React, { useState } from 'react';
import { 
  X, 
  ArrowUpCircle, 
  Download, 
  Clock, 
  HardDrive, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Wifi
} from 'lucide-react';
import { 
  type AppUpdateInfo, 
  executeAppUpdate 
} from '../../services/versionUpdateService';
import { APP_VERSION } from '../../config/version';
import './AppUpdate.css';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
  onSnooze?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onSnooze,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const updateSize = updateInfo.apk_size_formatted || '17.5 MB';

  const handleDownload = () => {
    setIsDownloading(true);
    executeAppUpdate(updateInfo.version);
    setDownloadSuccess(true);
    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze();
    }
    onClose();
  };

  return (
    <div className="modal-backdrop update-modal-backdrop" onClick={onClose} style={{ zIndex: 1080 }}>
      <div 
        className="modal-content update-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="update-modal-close" 
          onClick={onClose}
          title="Close release notes"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="update-modal-header">
          <div className="update-modal-icon-ring">
            <ArrowUpCircle size={32} />
          </div>

          <div style={{ flex: 1 }}>
            <span className="badge badge-primary banner-badge" style={{ marginBottom: '0.35rem' }}>
              Release Notes
            </span>
            <h2 className="update-modal-title">Upgrade to RemiVault v{updateInfo.version}</h2>
            <p className="update-modal-sub">
              A new version of RemiVault is ready with security improvements and feature updates.
            </p>
          </div>
        </div>

        {/* Version Comparison Card */}
        <div className="update-comparison-card">
          <div className="version-col">
            <span className="version-col-label">Installed Version</span>
            <span className="version-col-val current">v{APP_VERSION}</span>
          </div>

          <div className="version-diff-arrow">
            <ArrowRight size={18} />
          </div>

          <div className="version-col" style={{ textAlign: 'right' }}>
            <span className="version-col-label">Latest Version</span>
            <span className="version-col-val new">v{updateInfo.version}</span>
          </div>
        </div>

        {/* Bandwidth / Internet Data Consumption Box */}
        <div className="update-bandwidth-box">
          <div className="bandwidth-left">
            <div className="bandwidth-icon-box">
              <HardDrive size={18} />
            </div>
            <div className="bandwidth-info">
              <strong>Data / Bandwidth Usage Awareness</strong>
              <span>
                <Wifi size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                Wi-Fi recommended on metered mobile connections
              </span>
            </div>
          </div>

          <div className="bandwidth-size-pill">
            {updateSize}
          </div>
        </div>

        {/* Download Success Notice */}
        {downloadSuccess && (
          <div className="install-alert-banner success" style={{ marginBottom: '1.15rem' }}>
            <CheckCircle2 size={16} />
            <span>
              <strong>Download Started!</strong> Check your status bar or Downloads folder for <code>RemiVault.apk</code>.
            </span>
          </div>
        )}

        {/* Categorized Changelog Section */}
        <div className="update-changelog-section">
          <h4 className="changelog-title">
            <Sparkles size={15} color="#f59e0b" />
            <span>What's New in v{updateInfo.version}</span>
          </h4>

          <ul className="changelog-list">
            {(updateInfo.changelog && updateInfo.changelog.length > 0
              ? updateInfo.changelog
              : [
                  'Standalone Android APK improvements with hardware-backed performance',
                  'Real-time system tray & status bar alerts for due tasks and expirations',
                  'High-security 4-digit PIN authentication & biometric encryption',
                  'Speed optimizations and zero localStorage encryption security',
                ]
            ).map((item, index) => (
              <li key={index} className="changelog-item">
                <span className="changelog-dot" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="update-modal-actions">
          {!updateInfo.is_mandatory && (
            <button
              type="button"
              className="btn btn-secondary update-modal-snooze-btn"
              onClick={handleSnooze}
            >
              <Clock size={15} />
              <span>Snooze (24 Hours)</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary update-modal-download-btn"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download size={16} className={isDownloading ? 'spin-anim' : ''} />
            <span>{isDownloading ? 'Starting Download...' : `Download & Update (${updateSize})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
