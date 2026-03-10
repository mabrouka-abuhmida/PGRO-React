/**
 * Button component - Modern button styles with USW colors
 * Supports split buttons, speech bubbles, icons, and more
 */
import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'split' | 'bubble' | 'double-outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
  // Split button props
  splitLeft?: string;
  splitRight?: string;
  onSplitLeftClick?: () => void;
  onSplitRightClick?: () => void;
  // Icon props
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  // Speech bubble props
  hasTail?: boolean;
  tailPosition?: 'left' | 'right' | 'bottom';
  // Separator props
  hasSeparator?: boolean;
  separatorIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  splitLeft,
  splitRight,
  onSplitLeftClick,
  onSplitRightClick,
  icon,
  iconPosition = 'right',
  hasTail = false,
  tailPosition = 'bottom',
  hasSeparator = false,
  separatorIcon,
}) => {
  // Split button variant
  if (variant === 'split' && splitLeft && splitRight) {
    return (
      <div className={`btn-split btn-split-${size} ${className}`}>
        <button
          type={type}
          className="btn-split-left"
          onClick={onSplitLeftClick}
          disabled={disabled}
          aria-label={ariaLabel || splitLeft}
        >
          {splitLeft}
        </button>
        <button
          type={type}
          className="btn-split-right"
          onClick={onSplitRightClick}
          disabled={disabled}
          aria-label={ariaLabel || splitRight}
        >
          {splitRight}
        </button>
      </div>
    );
  }

  // Speech bubble variant
  if (variant === 'bubble') {
    const bubbleClasses = `btn btn-bubble btn-${variant} btn-${size} ${hasTail ? `btn-tail btn-tail-${tailPosition}` : ''} ${className}`.trim();
    return (
      <button
        type={type}
        className={bubbleClasses}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
      </button>
    );
  }

  // Regular button with optional icon and separator
  const buttonClasses = `btn btn-${variant} btn-${size} ${hasTail ? `btn-tail btn-tail-${tailPosition}` : ''} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
      {children}
      {hasSeparator && separatorIcon && (
        <>
          <span className="btn-separator"></span>
          <span className="btn-separator-icon">{separatorIcon}</span>
        </>
      )}
      {icon && iconPosition === 'right' && !hasSeparator && <span className="btn-icon-right">{icon}</span>}
    </button>
  );
};
