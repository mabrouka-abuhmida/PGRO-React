/**
 * Card component - reusable card container
 */
import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: React.CSSProperties
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  style
}) => {
  const cardClasses = `card card-${variant} ${onClick ? 'card-clickable' : ''} ${className}`.trim();

  return (
    <div style={style} className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

