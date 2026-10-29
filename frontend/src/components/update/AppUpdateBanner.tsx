import React, { useState } from 'react';
import { 
  ArrowUpCircle, 
  Download, 
  X, 
  Clock, 
  FileText, 
  HardDrive, 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';
import { 
  type AppUpdateInfo, 
  executeAppUpdate 
} from '../../services/versionUpdateService';
import { APP_VERSION } from '../../config/version';
import './AppUpdate.css';

interface AppUpdateBannerProps {
  updateInfo: AppUpdateInfo;
  onOpenDetails: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  updateInfo,
  onOpenDetails,
  onSnooze,
  onDismiss,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    executeAppUpdate(updateInfo.version);
    setDownloadTriggered(true);

    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  const updateSize = updateInfo.apk_size_formatted || '17.5 MB';

  return (
    <div className="app-update-banner-wrap" role="region" aria-label="Version Upgrade Notification">
      <div className="app-update-banner-card">
        {/* Left Icon & Text */}
        <div className="update-banner-left">
          <div className="update-glow-badge">
            <ArrowUpCircle size={26} />
            <span className="update-sparkle-dot" title="New Release Available" />
          </div>

          <div className="update-banner-content">
            <div className="update-meta-row">
              <span className="update-pill-release">New Version Available</span>
              <span className="update-version-transition">
                <span>v{APP_VERSION}</span>
                <ArrowRight size={12} className="update-arrow-icon" />
                <code>v{updateInfo.version}</code>
              </span>
              {/* Explicit Download Size Badge for Bandwidth Awareness */}
              <span className="update-size-badge" title="Internet data usage required for this update">
                <HardDrive size={12} />
                <span>Update Size: <strong>{updateSize}</strong></span>
              </span>
            </div>

            <h4 className="update-banner-title">
              <span>RemiVault v{updateInfo.version} is ready for installation</span>
            </h4>

            <p className="update-banner-sub">
              {updateInfo.changelog?.[0] || 'Includes new features, security hardening, and performance improvements.'}
            </p>

            {downloadTriggered && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.74rem', marginTop: '0.2rem' }}>
                <CheckCircle2 size={13} />
                <span>Downloading RemiVault.apk ({updateSize})... Tap notification to complete upgrade.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="update-banner-right">
          <button
            type="button"
            className="btn btn-primary update-btn-main"
            onClick={handleDownload}
            disabled={isDownloading}
            title={`Download installer package (${updateSize})`}
          >
            <Download size={14} className={isDownloading ? 'spin-anim' : ''} />
            <span>{isDownloading ? 'Downloading...' : `Download & Update (${updateSize})`}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary update-btn-ghost"
            onClick={onOpenDetails}
            title="Read full release notes & changes"
          >
            <FileText size={13} />
            <span>Release Notes</span>
          </button>

          {!updateInfo.is_mandatory && (
            <button
              type="button"
              className="update-btn-snooze"
              onClick={onSnooze}
              title="Snooze update alert for 24 hours"
            >
              <Clock size={13} />
              <span>Remind Later</span>
            </button>
          )}

          <button
            type="button"
            className="modal-close-btn"
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={onDismiss}
            title="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
