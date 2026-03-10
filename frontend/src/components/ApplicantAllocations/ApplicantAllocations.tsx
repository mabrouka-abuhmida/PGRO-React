/**
 * ApplicantAllocations - Allocations section for applicant detail page
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '@/components';
import { createInterviewRecordSlug, createReviewRecordSlug } from '@/utils/slug';
import type { Allocation } from '@/types';
import type { StaffReview } from '@/services/staffReviewService';
import './ApplicantAllocations.css';

interface ApplicantAllocationsProps {
  allocations: Allocation[];
  staffReviews: Map<string, StaffReview | null>;
  interviewRecords: Map<string, { id: string; applicant_name?: string } | null>;
  applicantName?: string;
}

export const ApplicantAllocations: React.FC<ApplicantAllocationsProps> = ({
  allocations,
  staffReviews,
  interviewRecords,
  applicantName,
}) => {
  if (allocations.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <Card variant="elevated" className="staff-reviews-card">
        <h2 className="h-section">Staff Reviews</h2>
        {allocations.map((allocation) => {
          const review = staffReviews.get(allocation.id);
          return (
            <div key={allocation.id} className="staff-review-item" style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #D9D9D9' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                    {allocation.staff_name || 'Unknown Staff'}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {review?.id && (
                      <Link 
                        to={`/pgro/review-records/${createReviewRecordSlug(applicantName, review.id)}`}
                        state={{ reviewId: review.id }}
                        style={{
                          color: '#2196F3',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#E3F2FD';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        View Review →
                      </Link>
                    )}
                    {interviewRecords.get(allocation.id)?.id && (
                      <Link 
                        to={`/pgro/interview-records/${createInterviewRecordSlug(applicantName, interviewRecords.get(allocation.id)!.id)}`}
                        state={{ recordId: interviewRecords.get(allocation.id)!.id }}
                        style={{
                          color: '#2196F3',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#E3F2FD';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        View Interview →
                      </Link>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant="info">{allocation.role}</Badge>
                  {review?.recommendation && (
                    <Badge variant={
                      review.recommendation === 'REJECT' ? 'error' :
                      review.recommendation === 'INTERVIEW_APPLICANT' ? 'warning' :
                      'default'
                    }>
                      {review.recommendation === 'INTERVIEW_APPLICANT' ? 'Interview Applicant' :
                       review.recommendation === 'REVISE_PROPOSAL' ? 'Revise Proposal' :
                       review.recommendation === 'REJECT' ? 'Reject' :
                       review.recommendation}
                    </Badge>
                  )}
                  {!review?.recommendation && review?.decision && (
                    <Badge variant={
                      review.decision === 'ACCEPT' ? 'success' :
                      review.decision === 'REJECT' ? 'error' :
                      'warning'
                    }>
                      {review.decision === 'ACCEPT' ? 'Accepted' :
                       review.decision === 'REJECT' ? 'Rejected' :
                       'Needs Interview'}
                    </Badge>
                  )}
                  {review?.is_submitted && (
                    <Badge variant="default">Submitted</Badge>
                  )}
                </div>
              </div>
              
              {review ? (
                <div className="review-content">
                  {review.recommendation && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Recommendation:
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                        {review.recommendation === 'INTERVIEW_APPLICANT' ? 'Interview Applicant' :
                         review.recommendation === 'REVISE_PROPOSAL' ? 'Revise Proposal' :
                         review.recommendation === 'REJECT' ? 'Reject' :
                         review.recommendation}
                      </p>
                    </div>
                  )}
                  
                  {review.reasons_summary && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Summary of Reasons:
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{review.reasons_summary}</p>
                    </div>
                  )}
                  
                  {review.comments_to_applicant && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Comments to Applicant:
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{review.comments_to_applicant}</p>
                    </div>
                  )}
                  
                  {review.overall_assessment && !review.reasons_summary && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Overall Assessment:
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{review.overall_assessment}</p>
                    </div>
                  )}
                  
                  {review.strengths && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Strengths:
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{review.strengths}</p>
                    </div>
                  )}
                  
                  {review.weaknesses && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        Weaknesses:
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{review.weaknesses}</p>
                    </div>
                  )}
                  
                  {review.submitted_at && (
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: '1rem 0 0 0', fontStyle: 'italic' }}>
                      Submitted: {new Date(review.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No review submitted yet</p>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
};

