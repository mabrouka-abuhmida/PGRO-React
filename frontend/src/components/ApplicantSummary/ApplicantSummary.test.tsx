/**
 * ApplicantSummary Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApplicantSummary } from './ApplicantSummary';
import type { Applicant } from '@/types';

// Mock components
jest.mock('@/components', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
  TagList: ({ tags }: { tags: string[] }) => (
    <div data-testid="tag-list">
      {tags.map((tag, i) => <span key={i}>{tag}</span>)}
    </div>
  ),
}));

const mockApplicant: Applicant = {
  id: '1',
  full_name: 'John Doe',
  email: 'john@example.com',
  status: 'NEW',
  degree_type: 'PHD',
  intake_year: 2024,
  intake_term: 'OCT',
  summary_text: 'Test summary',
  primary_theme: 'Machine Learning',
  secondary_theme: 'Deep Learning',
  topic_keywords: ['AI', 'ML'],
  method_keywords: ['Neural Networks'],
  priority_score: 85,
  ai_detection_probability: 30,
  quality_rationale: 'Strong application',
  raw_application_text: 'Test application text',
  embedding: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ApplicantSummary', () => {
  it('renders applicant name', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders summary text when available', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });

  it('renders primary theme', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByText(/Machine Learning/i)).toBeInTheDocument();
  });

  it('renders topic keywords as TagList', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByTestId('tag-list')).toBeInTheDocument();
  });

  it('renders priority score badge', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByText(/85.0\/100/i)).toBeInTheDocument();
  });

  it('renders AI detection probability badge', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByText(/30.0%/i)).toBeInTheDocument();
  });

  it('renders quality rationale when available', () => {
    render(<ApplicantSummary applicant={mockApplicant} />);
    expect(screen.getByText('Strong application')).toBeInTheDocument();
  });
});

