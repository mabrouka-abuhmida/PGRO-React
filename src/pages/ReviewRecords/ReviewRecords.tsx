/**
 * ReviewRecords - PGRO view of all review records
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Card } from '@/components';
import { staffReviewService, type StaffReviewListItem } from '@/services/staffReviewService';
import { createReviewRecordSlug } from '@/utils/slug';
import { logger } from '@/utils/logger';
import './ReviewRecords.css';

export const ReviewRecords: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<StaffReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubmitted, setFilterSubmitted] = useState<string>('');

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const isSubmitted = filterSubmitted === 'true' ? true : filterSubmitted === 'false' ? false : undefined;
      const data = await staffReviewService.list(isSubmitted);
      setReviews(data);
    } catch (error) {
      logger.error('Error loading review records:', error);
    } finally {
      setLoading(false);
    }
  }, [filterSubmitted]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getRecommendationBadgeVariant = (recommendation?: string): 'success' | 'warning' | 'error' | 'default' => {
    if (!recommendation) return 'default';
    if (recommendation === 'INTERVIEW_APPLICANT') return 'success';
    if (recommendation === 'REVISE_PROPOSAL') return 'warning';
    if (recommendation === 'REJECT') return 'error';
    return 'default';
  };

  const getRecommendationLabel = (recommendation?: string): string => {
    if (!recommendation) return 'No Recommendation';
    return recommendation.replace('_', ' ');
  };

  if (loading) {
    return <div className="loading">Loading review records...</div>;
  }

  return (
    <div className="review-records-page">
      <div className="page-header">
        <h1>Review Records</h1>
        <p>View and track staff review records for allocated applicants</p>
      </div>

      <div className="filters">
        <label>
          Status:
          <select value={filterSubmitted} onChange={(e) => setFilterSubmitted(e.target.value)}>
            <option value="">All</option>
            <option value="true">Submitted</option>
            <option value="false">Draft</option>
          </select>
        </label>
      </div>

      <div className="records-grid">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <p>No review records found</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card 
              key={review.id} 
              variant="elevated" 
              className="review-record-card"
              onClick={() => {
                const slug = createReviewRecordSlug(
                  review.applicant_name || review.applicant_name_review, 
                  review.id
                );
                navigate(`/pgro/review-records/${slug}`, { 
                  state: { reviewId: review.id } 
                });
              }}
            >
              <div className="card-header">
                <h3>{review.applicant_name || review.applicant_name_review || 'Unknown Applicant'}</h3>
                <Badge variant={review.is_submitted ? 'success' : 'warning'}>
                  {review.is_submitted ? 'Submitted' : 'Draft'}
                </Badge>
              </div>
              
              <div className="card-body">
                <p><strong>Reviewer:</strong> {review.staff_name || review.reviewer_name || 'Unknown Staff'}</p>
                {review.staff_school && <p><strong>School:</strong> {review.staff_school}</p>}
                {review.role && <p><strong>Role:</strong> {review.role.replace('_', ' ')}</p>}
                {review.review_date && (
                  <p><strong>Review Date:</strong> {new Date(review.review_date).toLocaleDateString()}</p>
                )}
                {review.recommendation && (
                  <p>
                    <strong>Recommendation:</strong>{' '}
                    <Badge variant={getRecommendationBadgeVariant(review.recommendation)}>
                      {getRecommendationLabel(review.recommendation)}
                    </Badge>
                  </p>
                )}
                {review.submitted_at && (
                  <p className="submitted-date">
                    <strong>Submitted:</strong> {new Date(review.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

