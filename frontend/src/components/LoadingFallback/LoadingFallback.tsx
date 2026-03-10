/**
 * LoadingFallback - Fallback component for Suspense boundaries
 */
import React from 'react';
import { SkeletonGrid } from '@/components';
import './LoadingFallback.css';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="loading-fallback">
      <SkeletonGrid count={6} />
    </div>
  );
};

