/**
 * Badge component - for status indicators and labels
 */
import React from 'react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const badgeClasses = `badge badge-${variant} badge-${size} ${className}`.trim();

  return <span className={badgeClasses}>{children}</span>;
};

