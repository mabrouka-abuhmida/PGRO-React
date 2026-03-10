/**
 * AllocationCard Component Tests
 * 
 * Test file template - requires @testing-library/react and @testing-library/jest-dom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllocationCard } from './AllocationCard';
import type { Allocation } from '@/types';

// Mock the Button and Badge components
jest.mock('@/components', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

const mockAllocation: Allocation = {
  id: '1',
  applicant_id: 'app-1',
  applicant_name: 'John Doe',
  staff_id: 'staff-1',
  staff_name: 'Dr. Smith',
  staff_email: 'smith@example.com',
  staff_school: 'Computer Science',
  role: 'DOS',
  is_confirmed: false,
  applicant_status: 'NEW',
  match_score: 0.85,
  explanation: 'Great match for research interests',
  email_sent_at: null,
  email_error: null,
  confirmed_at: null,
  time_to_confirmation: null,
};

describe('AllocationCard', () => {
  const defaultProps = {
    allocation: mockAllocation,
    onConfirm: jest.fn(),
    onDelete: jest.fn(),
    onSendEmail: jest.fn(),
    onStatusUpdate: jest.fn(),
    confirming: new Set<string>(),
    deleting: new Set<string>(),
    sendingEmail: new Set<string>(),
    updatingStatus: new Set<string>(),
    getRoleBadgeVariant: (role: string) => {
      if (role === 'DOS') return 'info';
      return 'default';
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders allocation information correctly', () => {
    render(<AllocationCard {...defaultProps} />);
    
    expect(screen.getByText(/Dr. Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/i)).toBeInTheDocument();
    expect(screen.getByText(/85% Match/i)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<AllocationCard {...defaultProps} />);
    
    const confirmButton = screen.getByText(/Confirm/i);
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('1');
  });

  it('disables confirm button when confirming', () => {
    const props = {
      ...defaultProps,
      confirming: new Set(['1']),
    };
    
    render(<AllocationCard {...props} />);
    
    const confirmButton = screen.getByText(/Confirming.../i);
    expect(confirmButton).toBeDisabled();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<AllocationCard {...defaultProps} />);
    
    const deleteButton = screen.getByText(/Delete/i);
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1', 'John Doe', 'Dr. Smith');
  });

  it('calls onStatusUpdate when status checkbox is changed', () => {
    render(<AllocationCard {...defaultProps} />);
    
    const contactedCheckbox = screen.getByLabelText(/Contacted/i);
    fireEvent.click(contactedCheckbox);
    
    expect(defaultProps.onStatusUpdate).toHaveBeenCalledWith('app-1', 'SUPERVISOR_CONTACTED', '1');
  });

  it('shows confirmed badge when allocation is confirmed', () => {
    const props = {
      ...defaultProps,
      allocation: { ...mockAllocation, is_confirmed: true, confirmed_at: '2024-01-01T00:00:00Z' },
    };
    
    render(<AllocationCard {...props} />);
    
    expect(screen.getByText(/Confirmed/i)).toBeInTheDocument();
    expect(screen.queryByText(/Confirm/i)).not.toBeInTheDocument();
  });

  it('displays email status when email is sent', () => {
    const props = {
      ...defaultProps,
      allocation: { ...mockAllocation, email_sent_at: '2024-01-01T00:00:00Z' },
    };
    
    render(<AllocationCard {...props} />);
    
    expect(screen.getByText(/Email sent/i)).toBeInTheDocument();
  });
});

