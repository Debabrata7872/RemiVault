import React from 'react';
import { SkeletonBase } from './SkeletonBase';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="user-overview-container skeleton-container-fade">
      {/* Welcome Hero Skeleton */}
      <section className="overview-welcome-card skeleton-card-base">
        <div className="overview-welcome-content">
          <SkeletonBase width={150} height={24} borderRadius={20} style={{ marginBottom: '1rem' }} />
          <SkeletonBase width="45%" height={32} borderRadius={10} style={{ marginBottom: '0.75rem' }} />
          <SkeletonBase width="75%" height={16} borderRadius={6} style={{ marginBottom: '0.4rem' }} />
          <SkeletonBase width="55%" height={16} borderRadius={6} />
        </div>
      </section>

      {/* 4 Interactive Hub Cards Skeletons */}
      <div className="overview-modules-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="overview-module-card skeleton-card-base">
            <div className="overview-card-header">
              <SkeletonBase width={44} height={44} borderRadius={12} />
              <SkeletonBase width={36} height={26} borderRadius={8} />
            </div>
            <SkeletonBase width="65%" height={20} borderRadius={6} style={{ marginTop: '0.85rem', marginBottom: '0.65rem' }} />
            <SkeletonBase width="90%" height={14} borderRadius={5} style={{ marginBottom: '0.4rem' }} />
            <SkeletonBase width="70%" height={14} borderRadius={5} style={{ marginBottom: '1.25rem' }} />
            <div className="overview-card-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <SkeletonBase width={80} height={14} borderRadius={5} />
              <SkeletonBase width={18} height={14} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>

      {/* Priority Focus Widget Skeleton */}
      <section className="overview-priority-widget skeleton-card-base">
        <div className="priority-widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <SkeletonBase width={34} height={34} borderRadius={10} />
            <div>
              <SkeletonBase width={130} height={18} borderRadius={6} style={{ marginBottom: '0.35rem' }} />
              <SkeletonBase width={220} height={13} borderRadius={5} />
            </div>
          </div>
          <SkeletonBase width={85} height={24} borderRadius={20} />
        </div>

        <div className="priority-items-list" style={{ marginTop: '1rem' }}>
          <div className="priority-item skeleton-sub-card">
            <SkeletonBase width={20} height={20} borderRadius={6} />
            <div className="priority-item-info" style={{ flex: 1, marginLeft: '0.5rem' }}>
              <SkeletonBase width="50%" height={15} borderRadius={5} style={{ marginBottom: '0.3rem' }} />
              <SkeletonBase width="35%" height={12} borderRadius={4} />
            </div>
            <SkeletonBase width={70} height={30} borderRadius={8} />
          </div>

          <div className="priority-item skeleton-sub-card">
            <SkeletonBase width={20} height={20} borderRadius={6} />
            <div className="priority-item-info" style={{ flex: 1, marginLeft: '0.5rem' }}>
              <SkeletonBase width="55%" height={15} borderRadius={5} style={{ marginBottom: '0.3rem' }} />
              <SkeletonBase width="40%" height={12} borderRadius={4} />
            </div>
            <SkeletonBase width={70} height={30} borderRadius={8} />
          </div>
        </div>
      </section>

      {/* Security Privacy Card Skeleton */}
      <section className="overview-security-card skeleton-card-base">
        <div className="security-card-inner">
          <div className="security-card-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <SkeletonBase width={36} height={36} borderRadius={10} />
            <div>
              <SkeletonBase width={180} height={16} borderRadius={6} style={{ marginBottom: '0.35rem' }} />
              <SkeletonBase width={280} height={12} borderRadius={5} />
            </div>
          </div>
          <div className="security-badges-row" style={{ display: 'flex', gap: '0.5rem' }}>
            <SkeletonBase width={110} height={24} borderRadius={20} />
            <SkeletonBase width={90} height={24} borderRadius={20} />
            <SkeletonBase width={100} height={24} borderRadius={20} />
          </div>
        </div>
      </section>
    </div>
  );
};
