import React from 'react';
import { SkeletonBase } from './SkeletonBase';

export const ImportantDatesSkeleton: React.FC = () => {
  return (
    <div className="dates-container skeleton-container-fade">
      {/* Header Skeleton */}
      <div className="dates-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <SkeletonBase width={190} height={26} borderRadius={8} />
            <SkeletonBase width={130} height={22} borderRadius={16} />
          </div>
          <SkeletonBase width={360} height={14} borderRadius={5} />
        </div>

        <SkeletonBase width={135} height={38} borderRadius={10} />
      </div>

      {/* 4 Metric Cards */}
      <div className="dates-metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="dates-metric-card skeleton-card-base" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <SkeletonBase width={85} height={12} borderRadius={4} />
              <SkeletonBase width={18} height={18} borderRadius={4} />
            </div>
            <SkeletonBase width={48} height={26} borderRadius={6} style={{ marginBottom: '0.3rem' }} />
            <SkeletonBase width={90} height={12} borderRadius={4} />
          </div>
        ))}
      </div>

      {/* Category Pills & Search Toolbar */}
      <div className="dates-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.5rem' }}>
        <div className="dates-category-pills" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {[90, 85, 95, 100, 80, 110, 105].map((w, idx) => (
            <SkeletonBase key={idx} width={w} height={32} borderRadius={16} style={{ flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
          <SkeletonBase width={280} height={38} borderRadius={10} />
          <SkeletonBase width={140} height={38} borderRadius={10} />
        </div>
      </div>

      {/* Dates Cards Grid */}
      <div className="dates-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="dates-card skeleton-card-base"
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              borderTop: '3px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <SkeletonBase width={100} height={22} borderRadius={12} />
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <SkeletonBase width={24} height={24} borderRadius={6} />
                <SkeletonBase width={24} height={24} borderRadius={6} />
              </div>
            </div>

            <SkeletonBase width="75%" height={18} borderRadius={6} style={{ marginBottom: '1rem' }} />

            {/* Countdown Box */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', marginBottom: '0.85rem' }}>
              <SkeletonBase width={90} height={24} borderRadius={6} style={{ marginBottom: '0.35rem' }} />
              <SkeletonBase width={130} height={12} borderRadius={4} />
            </div>

            <SkeletonBase width="90%" height={12} borderRadius={4} style={{ marginBottom: '0.35rem' }} />
            <SkeletonBase width="65%" height={12} borderRadius={4} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <SkeletonBase width={110} height={18} borderRadius={10} />
              <SkeletonBase width={50} height={12} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
