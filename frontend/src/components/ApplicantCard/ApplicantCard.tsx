/**
 * ApplicantCard - Memoized card component for applicant list items
 * Prevents unnecessary re-renders when parent updates
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '@/components';
import { createApplicantSlug } from '@/utils/slug';
import { getStatusBadgeVariant } from '@/utils/badgeVariants';
import type { Applicant } from '@/types';
import './ApplicantCard.css';

interface ApplicantCardProps {
  applicant: Applicant;
  documentStatus?: {
    is_complete: boolean;
    missing_count: number;
  };
  interviewStatus?: 'IN_PROCESS' | 'COMPLETED' | null;
  reviewStatus?: 'submitted' | 'draft' | null;
}

export const ApplicantCard = React.memo<ApplicantCardProps>(({ applicant, documentStatus, interviewStatus, reviewStatus }) => {
  const slug = createApplicantSlug(applicant.full_name, applicant.id);
  const statusVariant = getStatusBadgeVariant(applicant.status || '');

  return (
    <Link to={`/pgro/applicants/${slug}`} state={{ applicantId: applicant.id }}>
      <Card variant="elevated" className="applicant-card">
        <div className="applicant-card-header">
          <h3 className="applicant-name">{applicant.full_name}</h3>
          <Badge variant={statusVariant}>
            {applicant.status?.replace(/_/g, ' ') || 'New'}
          </Badge>
        </div>
        
        <div className="applicant-card-info">
          <p className="applicant-degree">{applicant.degree_type} • {applicant.intake_term} {applicant.intake_year}</p>
          {applicant.email && (
            <p className="applicant-email">{applicant.email}</p>
          )}
        </div>

        {documentStatus && (
          <div className="applicant-document-status">
            {documentStatus.is_complete ? (
              <Badge variant="success">Documents Complete</Badge>
            ) : (
              <Badge variant="purple">
                {documentStatus.missing_count} document{documentStatus.missing_count !== 1 ? 's' : ''} missing
              </Badge>
            )}
          </div>
        )}

        {interviewStatus && (
          <div className="applicant-interview-status">
            <Badge variant={interviewStatus === 'COMPLETED' ? 'success' : 'warning'}>
              Interview: {interviewStatus === 'COMPLETED' ? 'Completed' : 'In Process'}
            </Badge>
          </div>
        )}

        {reviewStatus && (
          <div className="applicant-review-status">
            <Badge variant={reviewStatus === 'submitted' ? 'success' : 'warning'}>
              Review: {reviewStatus === 'submitted' ? 'Submitted' : 'Draft'}
            </Badge>
          </div>
        )}
      </Card>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.applicant.id === nextProps.applicant.id &&
    prevProps.applicant.status === nextProps.applicant.status &&
    prevProps.documentStatus?.is_complete === nextProps.documentStatus?.is_complete &&
    prevProps.documentStatus?.missing_count === nextProps.documentStatus?.missing_count &&
    prevProps.interviewStatus === nextProps.interviewStatus &&
    prevProps.reviewStatus === nextProps.reviewStatus
  );
});

ApplicantCard.displayName = 'ApplicantCard';

