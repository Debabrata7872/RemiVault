import React from 'react';
import { SkeletonBase } from './SkeletonBase';

export const NotesSkeleton: React.FC = () => {
  // Varying mock line patterns to create a realistic masonry staggered layout
  const mockCards = [
    { height: 160, lines: 3 },
    { height: 210, lines: 5 },
    { height: 140, lines: 2 },
    { height: 190, lines: 4 },
    { height: 230, lines: 6 },
    { height: 150, lines: 3 },
  ];

  return (
    <div className="notes-container skeleton-container-fade">
      {/* Header Skeleton */}
      <div className="notes-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <SkeletonBase width={160} height={26} borderRadius={8} />
            <SkeletonBase width={120} height={22} borderRadius={16} />
          </div>
          <SkeletonBase width={320} height={14} borderRadius={5} />
        </div>

        <div className="notes-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SkeletonBase width={240} height={38} borderRadius={10} />
          <SkeletonBase width={110} height={38} borderRadius={10} />
        </div>
      </div>

      {/* Grid of Note Cards Skeleton */}
      <div className="notes-masonry" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {mockCards.map((card, idx) => (
          <div
            key={idx}
            className="note-card skeleton-card-base"
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              minHeight: `${card.height}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <SkeletonBase width="65%" height={18} borderRadius={6} />
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <SkeletonBase width={16} height={16} borderRadius={4} />
                  <SkeletonBase width={16} height={16} borderRadius={4} />
                </div>
              </div>

              {Array.from({ length: card.lines }).map((_, lineIdx) => (
                <SkeletonBase
                  key={lineIdx}
                  width={lineIdx === card.lines - 1 ? '45%' : '95%'}
                  height={13}
                  borderRadius={4}
                  style={{ marginBottom: '0.4rem' }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <SkeletonBase width={70} height={12} borderRadius={4} />
              <SkeletonBase width={18} height={18} borderRadius={50} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
