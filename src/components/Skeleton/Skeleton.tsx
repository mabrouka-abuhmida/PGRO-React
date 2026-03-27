/**
 * Skeleton - Loading skeleton component for better UX
 */
import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  className = '',
  animation = 'pulse',
}) => {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1em',
  };

  return (
    <div
      className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <Skeleton variant="rectangular" height={24} width="60%" />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="90%" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = '' 
}) => (
  <div className={`skeleton-list ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className = '' 
}) => (
  <div className={`skeleton-grid ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

