/**
 * StaffReview - Detailed review view with side-by-side layout
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStaff } from '@/contexts/StaffContext';
import { Badge, Button } from '@/components';
import {
  useAllocation,
  useApplicant,
  useDocuments,
  useStaffReviewByAllocation,
  useCreateOrUpdateStaffReview,
  useGenerateAIReview,
  useExtractText,
} from '@/hooks';
import type { StaffReviewCreate } from '@/services/staffReviewService';
import { SkeletonCard } from '@/components';
import { StaffReviewForm } from './StaffReviewForm';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types';
import { toastError, toastSuccess, toastWarning, toastConfirm } from '@/utils/toast';
import { sanitizePreText } from '@/utils/sanitize';
import './StaffReview.css';

export const StaffReview: React.FC = () => {
  const { allocationId } = useParams<{ allocationId: string }>();
  const navigate = useNavigate();
  const { currentStaff } = useStaff();
  
  // Fetch allocation
  const { data: allocation, isLoading: loadingAllocation, error: allocationError } = useAllocation(allocationId || undefined);

  // Verify allocation belongs to current staff
  useEffect(() => {
    if (allocation && currentStaff && allocation.staff_id !== currentStaff.id) {
      toastError('Allocation not found or does not belong to you');
      navigate('/staff-portal/allocations');
    }
  }, [allocation, currentStaff, navigate]);

  // Fetch applicant (only if allocation has applicant_id)
  const { data: applicant, isLoading: loadingApplicant } = useApplicant(
    allocation?.applicant_id ? allocation.applicant_id : undefined
  );

  // Fetch documents (only if allocation has applicant_id)
  const { data: documents = [] } = useDocuments(
    allocation?.applicant_id ? allocation.applicant_id : undefined
  );

  // Fetch review
  const { data: review, isLoading: loadingReview, error: reviewError } = useStaffReviewByAllocation(allocationId || undefined);

  // Only show loading if allocation is loading, or if allocation exists and dependent queries are loading
  // Note: review can be null (no review exists yet) - that's valid, so we don't wait for it
  // const loading = loadingAllocation || (allocation && loadingApplicant);

  // Mutations
  const createOrUpdateReviewMutation = useCreateOrUpdateStaffReview();
  const generateAIReviewMutation = useGenerateAIReview();
  const extractTextMutation = useExtractText();

  // UI state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cvText, setCvText] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [showCvModal, setShowCvModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  
  // Initialize form data from review or allocation/applicant
  const formData = useMemo<StaffReviewCreate>(() => {
    if (!allocation || !currentStaff) {
      return {
        allocation_id: '',
        staff_id: '',
        applicant_id: '',
        reviewer_name: '',
        applicant_name_review: '',
        review_date: '',
        research_question_acceptable: null,
        research_framework_acceptable: null,
        writing_structure_acceptable: null,
        contribution_to_field: null,
        recommend_for_supervision: null,
        prepared_to_supervise: null,
        sufficient_ethics: null,
        suggested_supervisors: '',
        overseas_research_risk: null,
        reputational_risk: null,
        risk_matrix_completed: null,
        recommendation: null,
        reasons_summary: '',
        comments_to_applicant: '',
        date_returned_to_graduate_school: '',
      };
    }

    if (review) {
      return {
        allocation_id: review.allocation_id,
        staff_id: review.staff_id,
        applicant_id: review.applicant_id,
        reviewer_name: review.reviewer_name || currentStaff.full_name || '',
        applicant_name_review: review.applicant_name_review || applicant?.full_name || allocation?.applicant_name || '',
        review_date: review.review_date || new Date().toISOString().split('T')[0],
        research_question_acceptable: review.research_question_acceptable ?? null,
        research_framework_acceptable: review.research_framework_acceptable ?? null,
        writing_structure_acceptable: review.writing_structure_acceptable ?? null,
        contribution_to_field: review.contribution_to_field ?? null,
        recommend_for_supervision: review.recommend_for_supervision ?? null,
        prepared_to_supervise: review.prepared_to_supervise ?? null,
        sufficient_ethics: review.sufficient_ethics ?? null,
        suggested_supervisors: review.suggested_supervisors || '',
        overseas_research_risk: review.overseas_research_risk ?? null,
        reputational_risk: review.reputational_risk ?? null,
        risk_matrix_completed: review.risk_matrix_completed ?? null,
        recommendation: review.recommendation || (review.decision === 'NEEDS_INTERVIEW' ? 'INTERVIEW_APPLICANT' : (review.decision === 'REJECT' ? 'REJECT' : null)),
        reasons_summary: review.reasons_summary || review.overall_assessment || '',
        comments_to_applicant: review.comments_to_applicant || '',
        date_returned_to_graduate_school: review.date_returned_to_graduate_school || '',
        decision: review.decision || null,
      };
    }

    // Initialize form with allocation data (applicant may not be loaded yet)
    return {
      allocation_id: allocation.id,
      staff_id: currentStaff.id,
      applicant_id: allocation.applicant_id || '',
      reviewer_name: currentStaff.full_name || '',
      applicant_name_review: applicant?.full_name || allocation?.applicant_name || '',
      review_date: new Date().toISOString().split('T')[0],
      research_question_acceptable: null,
      research_framework_acceptable: null,
      writing_structure_acceptable: null,
      contribution_to_field: null,
      recommend_for_supervision: null,
      prepared_to_supervise: null,
      sufficient_ethics: null,
      suggested_supervisors: '',
      overseas_research_risk: null,
      reputational_risk: null,
      risk_matrix_completed: null,
      recommendation: null,
      reasons_summary: '',
      comments_to_applicant: '',
      date_returned_to_graduate_school: '',
    };
  }, [allocation, applicant, currentStaff, review]);

  // Local form state for editing (separate from review data)
  // Initialize with empty form, will be updated when formData is ready
  const [localFormData, setLocalFormData] = useState<StaffReviewCreate>(() => {
    // Initialize with empty form if allocation/currentStaff aren't ready yet
    // Note: applicant is optional - form can work with just allocation data
    if (!allocation || !currentStaff) {
      return {
        allocation_id: '',
        staff_id: '',
        applicant_id: '',
        reviewer_name: '',
        applicant_name_review: '',
        review_date: '',
        research_question_acceptable: null,
        research_framework_acceptable: null,
        writing_structure_acceptable: null,
        contribution_to_field: null,
        recommend_for_supervision: null,
        prepared_to_supervise: null,
        sufficient_ethics: null,
        suggested_supervisors: '',
        overseas_research_risk: null,
        reputational_risk: null,
        risk_matrix_completed: null,
        recommendation: null,
        reasons_summary: '',
        comments_to_applicant: '',
        date_returned_to_graduate_school: '',
      };
    }
    return formData;
  });

  // Update local form when formData changes (but only if allocation/currentStaff are available)
  // Note: applicant is optional - form can work with just allocation data
  // This ensures form updates when review loads or when other dependencies change
  useEffect(() => {
    if (allocation && currentStaff && formData.allocation_id === allocation.id) {
      // Always update localFormData when formData changes (including when review loads)
      setLocalFormData(formData);
    }
  }, [formData, allocation, currentStaff]);

  // Debug: Log when review loads to help diagnose issues (must be before early returns)
  useEffect(() => {
    if (!loadingReview && allocationId) {
      if (review) {
        logger.info('Review data loaded successfully:', { id: review.id, allocation_id: review.allocation_id, is_submitted: review.is_submitted });
      } else {
        logger.info('No review exists yet for allocation:', allocationId);
      }
    }
  }, [review, loadingReview, allocationId]);

  const handleGenerateAIReview = async () => {
    if (!allocationId) return;
    
    try {
      setGeneratingAI(true);
      await generateAIReviewMutation.mutateAsync(allocationId);
      // Query will automatically refetch due to invalidation
    } catch (error: unknown) {
      logger.error('Error generating AI review:', error);
      toastError(`Failed to generate AI review: ${getErrorMessage(error)}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleInputChange = (field: keyof StaffReviewCreate, value?: boolean | string | null) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!allocationId) return;
    
    try {
      setSaving(true);
      await createOrUpdateReviewMutation.mutateAsync({
        ...localFormData,
        is_submitted: false,
      });
      toastSuccess('Review saved successfully');
      // Query will automatically refetch due to invalidation
    } catch (error: unknown) {
      logger.error('Error saving review:', error);
      toastError(`Failed to save review: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!localFormData.recommendation && !localFormData.decision) {
      toastWarning('Please select a recommendation (Interview applicant, Revise proposal, or Reject)');
      return;
    }
    
    if (!localFormData.reasons_summary || localFormData.reasons_summary.trim() === '') {
      toastWarning('Please provide a summary of reasons for your recommendation');
      return;
    }
    
    if (!allocationId) return;
    
    const confirmed = await toastConfirm('Are you sure you want to submit this review? Once submitted, you cannot edit it.');
    if (!confirmed) {
      return;
    }
    
    try {
      setSubmitting(true);
      await createOrUpdateReviewMutation.mutateAsync({
        ...localFormData,
        // Convert empty string to undefined for optional date field
        date_returned_to_graduate_school: localFormData.date_returned_to_graduate_school?.trim() || undefined,
        is_submitted: true,
      });
      toastSuccess('Review submitted successfully');
      // Query will automatically refetch due to invalidation
      navigate('/staff-portal/allocations');
    } catch (error: unknown) {
      logger.error('Error submitting review:', error);
      const errorMessage = getErrorMessage(error);
      toastError(`Failed to submit review: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Show specific error messages for missing data
  if (!allocationId) {
    return (
      <div className="staff-review">
        <div className="error">Allocation ID is missing</div>
        <button onClick={() => navigate('/staff-portal/allocations')} style={{ marginTop: '1rem' }}>
          Back to Allocations
        </button>
      </div>
    );
  }

  if (loadingAllocation) {
    return (
      <div className="staff-review">
        <SkeletonCard />
      </div>
    );
  }

  if (!currentStaff) {
    return (
      <div className="staff-review">
        <div className="error">Staff information not available. Please refresh the page.</div>
        <button onClick={() => navigate('/staff-portal/allocations')} style={{ marginTop: '1rem' }}>
          Back to Allocations
        </button>
      </div>
    );
  }

  // Check for allocation error first
  if (allocationError) {
    logger.error('Error loading allocation:', allocationError);
    return (
      <div className="staff-review">
        <div className="error">
          Unable to load allocation data: {getErrorMessage(allocationError)}
        </div>
        <button onClick={() => navigate('/staff-portal/allocations')} style={{ marginTop: '1rem' }}>
          Back to Allocations
        </button>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="staff-review">
        <div className="error">Unable to load allocation data. The allocation may not exist or you may not have access to it.</div>
        <button onClick={() => navigate('/staff-portal/allocations')} style={{ marginTop: '1rem' }}>
          Back to Allocations
        </button>
      </div>
    );
  }

  // Show loading for dependent queries only if allocation exists AND has applicant_id
  // Note: Don't wait for review - it can be null (no review exists yet)
  if (allocation && allocation.applicant_id && loadingApplicant) {
    return (
      <div className="staff-review">
        <SkeletonCard />
      </div>
    );
  }
  
  // Log review error but don't block rendering (review might not exist yet)
  if (reviewError) {
    logger.warn('Error loading review (this is OK if no review exists yet):', reviewError);
  }

  // Only require applicant if allocation has applicant_id and query finished loading
  if (allocation?.applicant_id && !applicant && !loadingApplicant) {
    return (
      <div className="staff-review">
        <div className="error">Unable to load applicant data. Please try again later.</div>
        <button onClick={() => navigate('/staff-portal/allocations')} style={{ marginTop: '1rem' }}>
          Back to Allocations
        </button>
      </div>
    );
  }

  const isSubmitted = review?.is_submitted || false;
  const applicationText = applicant?.raw_application_text || applicant?.summary_text || allocation?.applicant_name || 'No application text available';

  // Find CV and Transcript documents
  const cvDocument = documents.find(doc => doc.document_type === 'CV');
  const transcriptDocument = documents.find(doc => doc.document_type === 'TRANSCRIPT');

  const handleViewCv = async () => {
    if (!cvDocument) return;
    
    setShowCvModal(true);
    
    // If we already have the text loaded, don't reload
    if (cvText) return;
    
    // Use extracted_text from database if available (fastest option - no API call needed)
    if (cvDocument.extracted_text) {
      setCvText(cvDocument.extracted_text);
      return;
    }
    
    // If no extracted_text in database, try to extract from document via API
    try {
      const text = await extractTextMutation.mutateAsync(cvDocument.id);
      setCvText(text || 'No text could be extracted from CV');
    } catch (error) {
      logger.error('Error extracting CV text:', error);
      setCvText('Error loading CV text');
    }
  };

  const handleViewTranscript = async () => {
    if (!transcriptDocument) return;
    
    setShowTranscriptModal(true);
    
    // If we already have the text loaded, don't reload
    if (transcriptText) return;
    
    // Use extracted_text from database if available (fastest option - no API call needed)
    if (transcriptDocument.extracted_text) {
      setTranscriptText(transcriptDocument.extracted_text);
      return;
    }
    
    // If no extracted_text in database, try to extract from document via API
    try {
      const text = await extractTextMutation.mutateAsync(transcriptDocument.id);
      setTranscriptText(text || 'No text could be extracted from Transcript');
    } catch (error) {
      logger.error('Error extracting transcript text:', error);
      setTranscriptText('Error loading transcript text');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="staff-review">
      <div className="review-header">
        <div className="review-header-left">
          <div style={{ marginBottom: '1rem' }}>
            <Button variant="text" onClick={() => navigate('/staff-portal/allocations')} className="no-print">
              ← Back to Review Records
            </Button>
          </div>
          <h1 className="page-title">Review Application</h1>
          <div className="applicant-info">
            <h2>{applicant?.full_name || allocation?.applicant_name || 'Unknown Applicant'}</h2>
            <p>{applicant?.degree_type || allocation?.applicant_degree_type || 'N/A'} • {applicant?.intake_term || allocation?.applicant_intake_term || 'N/A'} {applicant?.intake_year || allocation?.applicant_intake_year || 'N/A'}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {cvDocument && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleViewCv}
                >
                  View CV
                </Button>
              )}
              {transcriptDocument && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleViewTranscript}
                >
                  View Transcript
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="review-header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {isSubmitted && (
              <Badge variant="success">Submitted</Badge>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint} className="print-button no-print">
              🖨️ Print
            </Button>
          </div>
          {((applicant?.priority_score !== undefined && applicant.priority_score !== null) || 
            (applicant?.ai_detection_probability !== undefined && applicant.ai_detection_probability !== null) ||
            (allocation?.applicant_priority_score !== undefined && allocation.applicant_priority_score !== null) ||
            (allocation?.applicant_ai_detection_probability !== undefined && allocation.applicant_ai_detection_probability !== null)) && (
            <div className="quality-metrics">
              {((applicant?.priority_score !== undefined && applicant.priority_score !== null) ||
                (allocation?.applicant_priority_score !== undefined && allocation.applicant_priority_score !== null)) && (
                <div className="quality-metric">
                  <div className="metric-header">
                    <strong>Priority Score:</strong>
                    <Badge 
                      variant={
                        (applicant?.priority_score ?? allocation?.applicant_priority_score ?? 0) >= 80 ? 'success' :
                        (applicant?.priority_score ?? allocation?.applicant_priority_score ?? 0) >= 50 ? 'warning' :
                        'error'
                      }
                    >
                      {(applicant?.priority_score ?? allocation?.applicant_priority_score ?? 0).toFixed(1)}/100
                    </Badge>
                  </div>
                </div>
              )}
              {((applicant?.ai_detection_probability !== undefined && applicant.ai_detection_probability !== null) ||
                (allocation?.applicant_ai_detection_probability !== undefined && allocation.applicant_ai_detection_probability !== null)) && (
                <div className="quality-metric">
                  <div className="metric-header">
                    <strong>AI Detection:</strong>
                    <Badge 
                      variant={
                        (applicant?.ai_detection_probability ?? allocation?.applicant_ai_detection_probability ?? 0) >= 70 ? 'error' :
                        (applicant?.ai_detection_probability ?? allocation?.applicant_ai_detection_probability ?? 0) >= 40 ? 'warning' :
                        'success'
                      }
                    >
                      {(applicant?.ai_detection_probability ?? allocation?.applicant_ai_detection_probability ?? 0) >= 70 ? 'Likely AI-Generated' :
                       (applicant?.ai_detection_probability ?? allocation?.applicant_ai_detection_probability ?? 0) >= 40 ? 'Possibly AI-Generated' :
                       'Likely Human-Written'} ({(applicant?.ai_detection_probability ?? allocation?.applicant_ai_detection_probability ?? 0).toFixed(1)}%)
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="review-layout">
        {/* Left side - Application text */}
        <div className="application-panel">
          <div className="panel-header">
            <h3>Application Text</h3>
          </div>
          <div className="application-content">
            <pre className="application-text">{applicationText}</pre>
          </div>
          
          {/* AI Review Section */}
          <div className="ai-review-section">
              <div className="ai-review-header">
                <h4>AI Assistant Review</h4>
                {!review?.ai_critical_review && (
                  <button
                    className="btn-generate-ai"
                    onClick={handleGenerateAIReview}
                    disabled={generatingAI}
                  >
                    {generatingAI ? 'Generating...' : 'Generate AI Review'}
                  </button>
                )}
              </div>
              {review?.ai_critical_review ? (
                <div className="ai-review-content">
                  <div className="ai-review-badge">AI Generated</div>
                  <div className="ai-review-text">
                    {review.ai_critical_review.split('\n').map((paragraph, index) => {
                      const sanitized = sanitizePreText(paragraph.trim());
                      return sanitized ? (
                        <p key={index}>{sanitized}</p>
                      ) : null;
                    })}
                  </div>
                  {review.ai_review_generated_at && (
                    <div className="ai-review-timestamp">
                      Generated: {new Date(review.ai_review_generated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ai-review-placeholder">
                  Click "Generate AI Review" to get an AI-assisted critical analysis of this application.
                </div>
              )}
          </div>
        </div>

        {/* Right side - Review form */}
        <div className="review-form-panel">
          <div className="panel-header">
            <h3>Review Form</h3>
            {isSubmitted && (
              <span className="submitted-badge">Submitted</span>
            )}
          </div>
          
          <StaffReviewForm
            formData={localFormData}
            isSubmitted={isSubmitted}
            applicantName={applicant?.full_name || allocation?.applicant_name || 'Unknown Applicant'}
            reviewerName={currentStaff.full_name}
            onInputChange={handleInputChange}
          />

          {/* Form Actions */}
          {!isSubmitted && (
            <div className="form-actions no-print">
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Notes Button */}
      {allocationId && (
        <div style={{ marginTop: '2rem', padding: '0 1rem', textAlign: 'center' }} className="no-print">
          <Button
            variant="primary"
            onClick={() => navigate(`/staff-portal/allocations/${allocationId}/notes`)}
          >
            📝 View & Manage Notes
          </Button>
        </div>
      )}

      {/* CV Text Modal */}
      {showCvModal && cvDocument && (
        <div className="modal-overlay" onClick={() => setShowCvModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="h-section">CV - {cvDocument.file_name}</h2>
              <button className="modal-close" onClick={() => setShowCvModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {extractTextMutation.isPending && !cvText ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  Loading CV text...
                </div>
              ) : (
                <pre className="application-text" style={{ 
                  background: '#F5F5F5', 
                  padding: '1.5rem', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {cvText || 'No CV text available'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcript Text Modal */}
      {showTranscriptModal && transcriptDocument && (
        <div className="modal-overlay" onClick={() => setShowTranscriptModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="h-section">Transcript - {transcriptDocument.file_name}</h2>
              <button className="modal-close" onClick={() => setShowTranscriptModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {extractTextMutation.isPending && !transcriptText ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  Loading transcript text...
                </div>
              ) : (
                <pre className="application-text" style={{ 
                  background: '#F5F5F5', 
                  padding: '1.5rem', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {transcriptText || 'No transcript text available'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

