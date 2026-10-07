import React from 'react';
import { SkeletonBase } from './SkeletonBase';

export const VaultSkeleton: React.FC = () => {
  return (
    <div className="vault-container skeleton-container-fade">
      {/* Header Skeleton */}
      <div className="vault-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <SkeletonBase width={210} height={26} borderRadius={8} />
            <SkeletonBase width={120} height={22} borderRadius={16} />
          </div>
          <SkeletonBase width={380} height={14} borderRadius={5} />
        </div>

        <div className="vault-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SkeletonBase width={140} height={38} borderRadius={10} />
          <SkeletonBase width={135} height={38} borderRadius={10} />
        </div>
      </div>

      {/* 6 KPI Metric Cards */}
      <div className="vault-metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginTop: '1.25rem' }}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="vault-metric-card skeleton-card-base" style={{ padding: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <SkeletonBase width={70} height={11} borderRadius={4} />
              <SkeletonBase width={16} height={16} borderRadius={4} />
            </div>
            <SkeletonBase width={42} height={24} borderRadius={6} style={{ marginBottom: '0.25rem' }} />
            <SkeletonBase width={65} height={11} borderRadius={4} />
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="vault-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.5rem' }}>
        <div className="vault-category-pills" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {[85, 95, 90, 80, 110, 100].map((w, idx) => (
            <SkeletonBase key={idx} width={w} height={32} borderRadius={16} style={{ flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
          <SkeletonBase width={290} height={38} borderRadius={10} />
          <SkeletonBase width={110} height={38} borderRadius={10} />
        </div>
      </div>

      {/* Vault Cards Grid */}
      <div className="vault-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="vault-card skeleton-card-base"
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              borderTop: '3px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <SkeletonBase width={110} height={22} borderRadius={12} />
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <SkeletonBase width={22} height={22} borderRadius={6} />
                <SkeletonBase width={22} height={22} borderRadius={6} />
                <SkeletonBase width={22} height={22} borderRadius={6} />
              </div>
            </div>

            <SkeletonBase width="70%" height={18} borderRadius={6} style={{ marginBottom: '0.35rem' }} />
            <SkeletonBase width="45%" height={12} borderRadius={4} style={{ marginBottom: '1rem' }} />

            {/* Credential Data Fields Box */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBase width="55%" height={14} borderRadius={4} />
                <SkeletonBase width={20} height={20} borderRadius={5} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBase width="65%" height={14} borderRadius={4} />
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <SkeletonBase width={20} height={20} borderRadius={5} />
                  <SkeletonBase width={20} height={20} borderRadius={5} />
                </div>
              </div>
            </div>

            {/* Strength Bar & Footer */}
            <div style={{ marginTop: '0.85rem' }}>
              <SkeletonBase width="100%" height={5} borderRadius={3} style={{ marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBase width={60} height={12} borderRadius={4} />
                <SkeletonBase width={80} height={11} borderRadius={4} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
