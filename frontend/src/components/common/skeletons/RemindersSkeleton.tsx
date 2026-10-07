import React from 'react';
import { SkeletonBase } from './SkeletonBase';

export const RemindersSkeleton: React.FC = () => {
  return (
    <div className="reminders-container skeleton-container-fade">
      {/* Header Skeleton */}
      <div className="reminders-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <SkeletonBase width={190} height={26} borderRadius={8} />
            <SkeletonBase width={100} height={22} borderRadius={16} />
          </div>
          <SkeletonBase width={340} height={14} borderRadius={5} />
        </div>

        <div className="reminders-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SkeletonBase width={120} height={34} borderRadius={20} />
          <SkeletonBase width={130} height={38} borderRadius={10} />
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="reminders-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="reminder-kpi-card skeleton-card-base" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem' }}>
            <SkeletonBase width={40} height={40} borderRadius={10} />
            <div style={{ flex: 1 }}>
              <SkeletonBase width={70} height={12} borderRadius={4} style={{ marginBottom: '0.4rem' }} />
              <SkeletonBase width={45} height={22} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Control Bar Skeleton */}
      <div className="reminders-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SkeletonBase width={70} height={34} borderRadius={8} />
          <SkeletonBase width={90} height={34} borderRadius={8} />
          <SkeletonBase width={85} height={34} borderRadius={8} />
          <SkeletonBase width={95} height={34} borderRadius={8} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SkeletonBase width={180} height={36} borderRadius={8} />
          <SkeletonBase width={110} height={36} borderRadius={8} />
        </div>
      </div>

      {/* Reminders List Skeletons */}
      <div className="reminders-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="reminder-card skeleton-card-base"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.1rem 1.25rem',
              borderRadius: '12px',
              borderLeft: '4px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <SkeletonBase width={22} height={22} borderRadius={50} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <SkeletonBase width="40%" height={16} borderRadius={5} />
                <SkeletonBase width={60} height={18} borderRadius={12} />
              </div>
              <SkeletonBase width="65%" height={12} borderRadius={4} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SkeletonBase width={110} height={24} borderRadius={6} />
              <SkeletonBase width={28} height={28} borderRadius={6} />
              <SkeletonBase width={28} height={28} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
