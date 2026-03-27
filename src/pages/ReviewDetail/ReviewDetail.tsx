/**
 * ReviewDetail - View completed review form (PGRO view)
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, SkeletonCard } from '@/components';
import {
  useStaffReview,
  useApplicant,
  useStaffList,
} from '@/hooks';
import { staffReviewService } from '@/services/staffReviewService';
import { findReviewIdBySlug, createReviewRecordSlug } from '@/utils/slug';
import './ReviewDetail.css';

export const ReviewDetail: React.FC = () => {
  const { id: slugOrId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Resolve review ID from slug or UUID
  const [resolvedReviewId, setResolvedReviewId] = useState<string | null>(
    location.state?.reviewId || null
  );

  // Try to resolve review ID if we have slugOrId but no resolved ID
  useEffect(() => {
    if (slugOrId && !resolvedReviewId) {
      const isUUID = slugOrId.includes('-') && slugOrId.length === 36;
      if (isUUID) {
        setResolvedReviewId(slugOrId);
      } else {
        // It's a slug, need to resolve it
        staffReviewService.list()
          .then(allReviews => {
            const id = findReviewIdBySlug(slugOrId, allReviews);
            if (id) {
              setResolvedReviewId(id);
            }
          })
          .catch(() => {
            // Error will be handled by the query
          });
      }
    }
  }, [slugOrId, resolvedReviewId]);

  // Fetch review data
  const { data: review, isLoading: loadingReview, error: reviewError } = useStaffReview(resolvedReviewId || undefined);
  
  // Fetch applicant
  const { data: applicant, isLoading: loadingApplicant } = useApplicant(review?.applicant_id || undefined);
  
  // Fetch staff list
  const { data: staffListData } = useStaffList({ active: true });
  const staffList = staffListData?.items || [];

  const loading = loadingReview || loadingApplicant;
  const error = reviewError ? (reviewError instanceof Error ? reviewError.message : 'Failed to load review record') : null;

  // Update resolved ID when review loads
  useEffect(() => {
    if (review?.id && review.id !== resolvedReviewId) {
      setResolvedReviewId(review.id);
      
      // Update URL to use slug if we used UUID
      if (slugOrId !== review.id && (review.applicant_name_review || review.applicant_id)) {
        let applicantName: string | undefined;
        if (review.applicant_name_review) {
          applicantName = review.applicant_name_review;
        } else if (applicant?.full_name) {
          applicantName = applicant.full_name;
        }
        
        if (applicantName) {
          const slug = createReviewRecordSlug(applicantName, review.id);
          navigate(`/pgro/review-records/${slug}`, { 
            replace: true,
            state: { reviewId: review.id } 
          });
        }
      }
    }
  }, [review, resolvedReviewId, slugOrId, navigate, applicant]);

  if (loading) {
    return <SkeletonCard />;
  }

  if (error || !review) {
    return (
      <div className="error">
        <p>{error || 'Review record not found'}</p>
        <Link to="/pgro/review-records">
          <Button variant="primary">Back to Review Records</Button>
        </Link>
      </div>
    );
  }

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW': return 'default';
      case 'UNDER_REVIEW': return 'warning';
      case 'SUPERVISOR_CONTACTED': return 'warning';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'ON_HOLD': return 'default';
      default: return 'default';
    }
  };

  // Helper function to get AI likelihood label
  const getAILikelihood = () => {
    if (!applicant || applicant.ai_detection_probability === undefined || applicant.ai_detection_probability === null) {
      return null;
    }
    if (applicant.ai_detection_probability >= 70) return 'High';
    if (applicant.ai_detection_probability >= 40) return 'Medium';
    return 'Low';
  };

  // Helper function to get AI likelihood badge color
  const getAILikelihoodBadgeColor = () => {
    if (!applicant || applicant.ai_detection_probability === undefined || applicant.ai_detection_probability === null) {
      return '#FF9800'; // Default orange
    }
    if (applicant.ai_detection_probability >= 70) return '#d32f2f'; // Red for high
    if (applicant.ai_detection_probability >= 40) return '#FF9800'; // Orange for medium
    return '#4CAF50'; // Green for low
  };

  const aiLikelihood = getAILikelihood();
  const aiLikelihoodColor = getAILikelihoodBadgeColor();
  const intakeDisplay = applicant && applicant.intake_term && applicant.intake_year 
    ? `${applicant.intake_term} ${applicant.intake_year} INTAKE`
    : null;

  const handlePrint = () => {
    window.print();
  };

  const getYesNoDisplay = (value: boolean | null | undefined): string => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'N/A';
  };

  const getRecommendationBadgeVariant = (recommendation?: string | null): 'success' | 'warning' | 'error' | 'default' => {
    if (!recommendation) return 'default';
    if (recommendation === 'INTERVIEW_APPLICANT') return 'success';
    if (recommendation === 'REVISE_PROPOSAL') return 'warning';
    if (recommendation === 'REJECT') return 'error';
    return 'default';
  };

  // Helper function to resolve UUIDs to staff names
  const getSuggestedSupervisorsDisplay = (suggestedSupervisors?: string | null): string => {
    if (!suggestedSupervisors) return 'N/A';
    
    // Parse comma-separated UUIDs
    const staffIds = suggestedSupervisors.split(',').map(id => id.trim()).filter(Boolean);
    
    // Resolve each UUID to staff name
    const staffNames = staffIds.map(id => {
      const staff = staffList.find(s => s.id === id);
      if (staff) {
        return staff.full_name + (staff.role_title ? ` - ${staff.role_title}` : '') + (staff.school ? ` (${staff.school})` : '');
      }
      // If staff not found, return the UUID (fallback)
      return id;
    });
    
    return staffNames.length > 0 ? staffNames.join(', ') : suggestedSupervisors;
  };

  return (
    <div className="review-detail-page">
      <div className="page-header">
        <Link to="/pgro/review-records" className="no-print">
          <Button variant="text">← Back to Review Records</Button>
        </Link>
        <div className="header-info">
          <h1>Review Record</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge variant={review.is_submitted ? 'success' : 'warning'}>
              {review.is_submitted ? 'Submitted' : 'Draft'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print-button no-print">
              🖨️ Print
            </Button>
          </div>
        </div>
      </div>

      {/* Header Bar with Proposal Info */}
      {applicant && (
        <div className="proposal-header-bar">
          <div className="proposal-header-left">
            <span className="proposal-identifier">{applicant.full_name}</span>
            {intakeDisplay && <span className="proposal-intake">{intakeDisplay}</span>}
            <span className="proposal-status">
              Status: <Badge variant={getStatusBadgeVariant(applicant.status)}>
                {applicant.status.replace('_', ' ')}
              </Badge>
            </span>
          </div>
          {aiLikelihood && applicant.ai_detection_probability !== null && applicant.ai_detection_probability !== undefined && (
            <div 
              className="ai-likelihood-badge"
              style={{ background: aiLikelihoodColor }}
            >
              AI Likelihood: {aiLikelihood} ({applicant.ai_detection_probability.toFixed(0)}%)
            </div>
          )}
        </div>
      )}

      <div className="review-content">
        {/* Review Information */}
        <section className="form-section">
          <h2>Review Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Reviewer Name:</label>
              <span>{review.reviewer_name || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Applicant Name:</label>
              <span>{review.applicant_name_review || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Review Date:</label>
              <span>{review.review_date ? new Date(review.review_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            {review.recommendation && (
              <div className="info-item">
                <label>Recommendation:</label>
                <Badge variant={getRecommendationBadgeVariant(review.recommendation)}>
                  {review.recommendation.replace('_', ' ')}
                </Badge>
              </div>
            )}
          </div>
        </section>

        {/* Yes/No Questions */}
        <section className="form-section">
          <h2>Review Questions</h2>
          <div className="field">
            <label>1. The quality of the research question is acceptable:</label>
            <p>{getYesNoDisplay(review.research_question_acceptable)}</p>
          </div>
          <div className="field">
            <label>2. The quality of the research framework is acceptable:</label>
            <p>{getYesNoDisplay(review.research_framework_acceptable)}</p>
          </div>
          <div className="field">
            <label>3. The quality of the writing and the structure of the proposal is acceptable:</label>
            <p>{getYesNoDisplay(review.writing_structure_acceptable)}</p>
          </div>
          <div className="field">
            <label>4. The proposal makes a clear contribution to the field:</label>
            <p>{getYesNoDisplay(review.contribution_to_field)}</p>
          </div>
          <div className="field">
            <label>5. Would you recommend this proposal for supervision within the Faculty?</label>
            <p>{getYesNoDisplay(review.recommend_for_supervision)}</p>
          </div>
          <div className="field">
            <label>6. Would you be prepared to supervise this applicant?</label>
            <p>{getYesNoDisplay(review.prepared_to_supervise)}</p>
          </div>
          <div className="field">
            <label>7. Sufficient grasp of ethics:</label>
            <p>{getYesNoDisplay(review.sufficient_ethics)}</p>
          </div>
          {review.suggested_supervisors && (
            <div className="field">
              <label>8. Suggested Supervisors:</label>
              <p>{getSuggestedSupervisorsDisplay(review.suggested_supervisors)}</p>
            </div>
          )}
        </section>

        {/* Risk Assessment */}
        <section className="form-section">
          <h2>Risk Assessment</h2>
          <div className="field">
            <label>9.1 Overseas research risk:</label>
            <p>{getYesNoDisplay(review.overseas_research_risk)}</p>
          </div>
          <div className="field">
            <label>9.2 Reputational risk:</label>
            <p>{getYesNoDisplay(review.reputational_risk)}</p>
          </div>
          <div className="field">
            <label>Has Research Risk Matrix been completed?</label>
            <p>{getYesNoDisplay(review.risk_matrix_completed)}</p>
          </div>
        </section>

        {/* Summary and Comments */}
        {review.reasons_summary && (
          <section className="form-section">
            <h2>Summary of Reasons for Recommendation</h2>
            <div className="field">
              <p>{review.reasons_summary}</p>
            </div>
          </section>
        )}

        {review.comments_to_applicant && (
          <section className="form-section">
            <h2>Comments to Applicant</h2>
            <div className="field">
              <p>{review.comments_to_applicant}</p>
            </div>
          </section>
        )}

        {review.date_returned_to_graduate_school && (
          <section className="form-section">
            <h2>Date Returned to Graduate School</h2>
            <div className="field">
              <p>{new Date(review.date_returned_to_graduate_school).toLocaleDateString()}</p>
            </div>
          </section>
        )}

        {/* Submission Info */}
        {review.submitted_at && (
          <section className="form-section submission-info">
            <p><strong>Submitted:</strong> {new Date(review.submitted_at).toLocaleString()}</p>
          </section>
        )}
      </div>
    </div>
  );
};

