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
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
}) => {
  const cardClasses = `card card-${variant} ${onClick ? 'card-clickable' : ''} ${className}`.trim();

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

