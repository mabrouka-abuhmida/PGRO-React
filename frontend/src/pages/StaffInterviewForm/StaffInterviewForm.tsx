/**
 * StaffInterviewForm - Form for staff to complete interview records
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStaff } from '@/contexts/StaffContext';
import { Badge, Button } from '@/components';
import { interviewRecordService, type InterviewRecord } from '@/services/interviewRecordService';
import { documentService } from '@/services/documentService';
import { createInterviewRecordSlug, findRecordIdBySlug } from '@/utils/slug';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types';
import { toastError, toastSuccess, toastConfirm } from '@/utils/toast';
import { validateUUID } from '@/utils/paramValidation';
import { sanitizePreText, sanitizeUrlParam } from '@/utils/sanitize';
import { 
  useInterviewRecord, 
  useCreateOrUpdateInterviewRecord,
  useApplicant,
  useDocuments 
} from '@/hooks';
import './StaffInterviewForm.css';

export const StaffInterviewForm: React.FC = () => {
  const { id: slugOrId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStaff } = useStaff();
  
  // Validate and sanitize URL parameter
  const sanitizedSlugOrId = slugOrId ? sanitizeUrlParam(slugOrId) : null;
  
  // Resolve record ID from slug or UUID
  const [resolvedRecordId, setResolvedRecordId] = useState<string | null>(
    location.state?.recordId || null
  );

  // Resolve ID from slug if needed (only once, prevents flickering)
  useEffect(() => {
    if (sanitizedSlugOrId && !resolvedRecordId) {
      const isUUID = sanitizedSlugOrId.includes('-') && sanitizedSlugOrId.length === 36;
      if (isUUID) {
        try {
          // Validate UUID format
          validateUUID(sanitizedSlugOrId, 'record id');
          setResolvedRecordId(sanitizedSlugOrId);
        } catch (error) {
          logger.error('Invalid UUID format:', error);
          navigate('/staff-portal/interviews');
        }
      } else {
        // It's a slug - resolve it once
        let cancelled = false;
        interviewRecordService.list({ staff_id: currentStaff?.id })
          .then(allRecords => {
            if (!cancelled) {
              const id = findRecordIdBySlug(sanitizedSlugOrId, allRecords);
              if (id) setResolvedRecordId(id);
            }
          })
          .catch(() => {
            // Error will be handled by query
          });
        return () => { cancelled = true; };
      }
    }
  }, [sanitizedSlugOrId, currentStaff?.id]); // Removed resolvedRecordId and location from deps

  // Use React Query hooks instead of manual fetching
  const { data: record, isLoading: loadingRecord } = useInterviewRecord(resolvedRecordId || undefined);
  const { data: applicant } = useApplicant(record?.applicant_id || undefined);
  const { data: documents = [] } = useDocuments(record?.applicant_id || undefined);
  
  const createOrUpdateMutation = useCreateOrUpdateInterviewRecord();

  // Update resolved ID when record loads
  useEffect(() => {
    if (record?.id && record.id !== resolvedRecordId) {
      setResolvedRecordId(record.id);
      // Update URL to use slug if needed
      if (sanitizedSlugOrId !== record.id && record.applicant_name) {
        const slug = createInterviewRecordSlug(record.applicant_name, record.id);
        navigate(`/staff-portal/interviews/${slug}`, { 
          replace: true,
          state: { recordId: record.id } 
        });
      }
    }
  }, [record, resolvedRecordId, sanitizedSlugOrId, navigate]);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cvText, setCvText] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [proposalText, setProposalText] = useState<string | null>(null);
  const [loadingCvText, setLoadingCvText] = useState(false);
  const [loadingTranscriptText, setLoadingTranscriptText] = useState(false);
  const [loadingProposalText, setLoadingProposalText] = useState(false);
  const [showCvModal, setShowCvModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  
  // Initialize form data from record
  const [formData, setFormData] = useState<Partial<InterviewRecord>>({});
  
  useEffect(() => {
    if (record) {
      setFormData(record);
    }
  }, [record]);

  const loading = loadingRecord;

  const handleInputChange = (field: keyof InterviewRecord, value: string | number | boolean | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const cvDocument = documents.find(doc => doc.document_type === 'CV');
  const transcriptDocument = documents.find(doc => doc.document_type === 'TRANSCRIPT');
  const proposalDocument = documents.find(doc => doc.document_type === 'PROPOSAL');

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
    if (!loadingCvText) {
      setLoadingCvText(true);
      try {
        const text = await documentService.extractText(cvDocument.id);
        setCvText(text || 'No text could be extracted from CV');
      } catch (error) {
        logger.error('Error extracting CV text:', error);
        setCvText('Error loading CV text');
      } finally {
        setLoadingCvText(false);
      }
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
    if (!loadingTranscriptText) {
      setLoadingTranscriptText(true);
      try {
        const text = await documentService.extractText(transcriptDocument.id);
        setTranscriptText(text || 'No text could be extracted from Transcript');
      } catch (error) {
        logger.error('Error extracting transcript text:', error);
        setTranscriptText('Error loading transcript text');
      } finally {
        setLoadingTranscriptText(false);
      }
    }
  };

  const handleViewProposal = async () => {
    // Show modal if we have either a proposal document or applicant's raw_application_text
    if (!proposalDocument && !applicant?.raw_application_text) return;
    
    setShowProposalModal(true);
    
    // If we already have the text loaded, don't reload
    if (proposalText) return;
    
    // Use extracted_text from database if available (fastest option - no API call needed)
    if (proposalDocument?.extracted_text) {
      setProposalText(proposalDocument.extracted_text);
      return;
    }
    
    // If no extracted_text in database, try to extract from document via API
    if (proposalDocument && !loadingProposalText) {
      setLoadingProposalText(true);
      try {
        const text = await documentService.extractText(proposalDocument.id);
        setProposalText(text || 'No text could be extracted from Proposal');
      } catch (error) {
        logger.error('Error extracting proposal text:', error);
        // If document extraction fails, try fallback to raw_application_text
        if (applicant?.raw_application_text) {
          setProposalText(applicant.raw_application_text);
        } else {
          setProposalText('Error loading proposal text');
        }
      } finally {
        setLoadingProposalText(false);
      }
    }
    // Fallback to applicant's raw_application_text if no document
    else if (applicant?.raw_application_text) {
      setProposalText(applicant.raw_application_text);
    }
  };

  const handleSave = async () => {
    if (!record || !currentStaff) return;
    
    try {
      setSaving(true);
      await createOrUpdateMutation.mutateAsync({
        allocation_id: record.allocation_id,
        staff_id: currentStaff.id,
        applicant_id: record.applicant_id,
        ...formData,
        is_submitted: false
      });
      toastSuccess('Interview record saved as draft');
      // Query will automatically refetch due to cache update
    } catch (error: unknown) {
      logger.error('Error saving interview record:', error);
      toastError('Failed to save: ' + getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!record || !currentStaff) return;
    
    const confirmed = await toastConfirm('Are you sure you want to submit this interview record? You will not be able to edit it after submission.');
    if (!confirmed) {
      return;
    }
    
    try {
      setSubmitting(true);
      await createOrUpdateMutation.mutateAsync({
        allocation_id: record.allocation_id,
        staff_id: currentStaff.id,
        applicant_id: record.applicant_id,
        ...formData,
        is_submitted: true
      });
      
      // Wait a moment for cache to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toastSuccess('Interview record submitted successfully!');
      
      // Navigate after a short delay to ensure state is updated
      setTimeout(() => {
        navigate('/staff-portal/interviews');
      }, 500);
    } catch (error: unknown) {
      logger.error('Error submitting interview record:', error);
      toastError('Failed to submit: ' + getErrorMessage(error));
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isSubmitted = record?.is_submitted || false;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!record) {
    return <div className="error">Interview record not found</div>;
  }

  return (
    <div className="staff-interview-form-page">
      <div className="interview-header">
        <div className="interview-header-left">
          <div style={{ marginBottom: '1rem' }}>
            <Button variant="text" onClick={() => navigate(-1)} className="no-print">
              ← Back to Interview Records
            </Button>
          </div>
          <h1 className="page-title">Interview Application</h1>
          {applicant ? (
            <div className="applicant-info">
              <h2>{applicant.full_name}</h2>
              <p>{applicant.degree_type} • {applicant.intake_term} {applicant.intake_year}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {/* Show button if proposal document exists OR applicant has raw_application_text */}
              {(proposalDocument || applicant?.raw_application_text) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleViewProposal}
                >
                  Show Proposal Text
                </Button>
              )}
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
          ) : (
            <div className="applicant-info">
              <p style={{ color: '#666', fontStyle: 'italic' }}>Loading applicant information...</p>
            </div>
          )}
        </div>
        <div className="interview-header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {isSubmitted && (
              <Badge variant="success">Submitted</Badge>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint} className="print-button no-print">
              🖨️ Print
            </Button>
          </div>
          {applicant && ((applicant.priority_score !== undefined && applicant.priority_score !== null) || 
            (applicant.ai_detection_probability !== undefined && applicant.ai_detection_probability !== null)) && (
            <div className="quality-metrics">
              {applicant && applicant.priority_score !== undefined && applicant.priority_score !== null && (
                <div className="quality-metric">
                  <div className="metric-header">
                    <strong>Priority Score:</strong>
                    <Badge 
                      variant={
                        applicant.priority_score >= 80 ? 'success' :
                        applicant.priority_score >= 50 ? 'warning' :
                        'error'
                      }
                    >
                      {applicant.priority_score.toFixed(1)}/100
                    </Badge>
                  </div>
                </div>
              )}
              {applicant && applicant.ai_detection_probability !== undefined && applicant.ai_detection_probability !== null && (
                <div className="quality-metric">
                  <div className="metric-header">
                    <strong>AI Detection:</strong>
                    <Badge 
                      variant={
                        applicant.ai_detection_probability >= 70 ? 'error' :
                        applicant.ai_detection_probability >= 40 ? 'warning' :
                        'success'
                      }
                    >
                      {applicant.ai_detection_probability >= 70 ? 'Likely AI-Generated' :
                       applicant.ai_detection_probability >= 40 ? 'Possibly AI-Generated' :
                       'Likely Human-Written'} ({applicant.ai_detection_probability.toFixed(1)}%)
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Invitation Panel - Above the form */}
      {applicant && !isSubmitted && (
        <div className="schedule-panel no-print">
          <div className="schedule-panel-content">
            <div className="schedule-panel-header">
              <h2>📅 Schedule Interview Invitation</h2>
              <p>
                Send interview invitation email with multiple date/time options to the applicant.
                This is for scheduling future interviews, separate from recording the actual interview date in the form below.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/staff-portal/interviews/${record.id}/schedule`)}
            >
              Schedule Interview & Send Email
            </Button>
          </div>
        </div>
      )}

      <div className="form-container">
        <form className="interview-form">
          {/* Header Information */}
          <section className="form-section">
            <h2>Interview Information</h2>
            <div className="form-row">
              <div className="form-field">
                <label>Interviewer Name:</label>
                <input
                  type="text"
                  value={formData.interviewer_name || ''}
                  onChange={(e) => handleInputChange('interviewer_name', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Enter interviewer name"
                />
              </div>
              <div className="form-field">
                <label>Applicant Name:</label>
                <input
                  type="text"
                  value={formData.applicant_name_interview || ''}
                  onChange={(e) => handleInputChange('applicant_name_interview', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Enter applicant name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Interview Date:</label>
                <input
                  type="date"
                  value={formData.interview_date || ''}
                  onChange={(e) => handleInputChange('interview_date', e.target.value)}
                  disabled={isSubmitted}
                />
                <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                  Record the actual date when the interview took place
                </small>
              </div>
              <div className="form-field">
                <label>Location:</label>
                <input
                  type="text"
                  value={formData.interview_location || ''}
                  onChange={(e) => handleInputChange('interview_location', e.target.value)}
                  disabled={isSubmitted}
                  placeholder="e.g., Video call, Campus office"
                />
              </div>
            </div>
          </section>

          {/* Applicant Background */}
          <section className="form-section">
            <h2>Applicant Background</h2>
            <div className="form-field">
              <label>Educational Background:</label>
              <textarea
                value={formData.educational_background || ''}
                onChange={(e) => handleInputChange('educational_background', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Summarize the applicant's educational background"
              />
            </div>
            <div className="form-field">
              <label>Work Experience:</label>
              <textarea
                value={formData.work_experience || ''}
                onChange={(e) => handleInputChange('work_experience', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Summarize relevant work experience"
              />
            </div>
            <div className="form-field">
              <label>Research Experience:</label>
              <textarea
                value={formData.research_experience || ''}
                onChange={(e) => handleInputChange('research_experience', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Summarize research experience"
              />
            </div>
          </section>

          {/* Research Proposal Discussion */}
          <section className="form-section">
            <h2>Research Proposal Discussion</h2>
            <div className="form-field">
              <label>Research Topic Clarity:</label>
              <select
                value={formData.research_topic_clarity || ''}
                onChange={(e) => handleInputChange('research_topic_clarity', e.target.value)}
                disabled={isSubmitted}
              >
                <option value="">Select...</option>
                <option value="Poor">Poor</option>
                <option value="Fair">Fair</option>
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
              </select>
            </div>
            <div className="form-field">
              <label>Research Objectives Understanding:</label>
              <textarea
                value={formData.research_objectives_understanding || ''}
                onChange={(e) => handleInputChange('research_objectives_understanding', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Comment on the applicant's understanding of research objectives"
              />
            </div>
            <div className="form-field">
              <label>Methodology Knowledge:</label>
              <textarea
                value={formData.methodology_knowledge || ''}
                onChange={(e) => handleInputChange('methodology_knowledge', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Assess knowledge of research methodology"
              />
            </div>
            <div className="form-field">
              <label>Literature Awareness:</label>
              <textarea
                value={formData.literature_awareness || ''}
                onChange={(e) => handleInputChange('literature_awareness', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Assess awareness of relevant literature"
              />
            </div>
          </section>

          {/* Motivation and Commitment */}
          <section className="form-section">
            <h2>Motivation and Commitment</h2>
            <div className="form-field">
              <label>Motivation for Research:</label>
              <textarea
                value={formData.motivation_for_research || ''}
                onChange={(e) => handleInputChange('motivation_for_research', e.target.value)}
                disabled={isSubmitted}
                rows={3}
                placeholder="Comment on motivation"
              />
            </div>
            <div className="form-field">
              <label>Understanding of PhD Demands:</label>
              <select
                value={formData.understanding_of_phd_demands === true ? 'yes' : formData.understanding_of_phd_demands === false ? 'no' : ''}
                onChange={(e) => handleInputChange('understanding_of_phd_demands', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null)}
                disabled={isSubmitted}
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-field">
              <label>Time Commitment Feasibility:</label>
              <textarea
                value={formData.time_commitment_feasibility || ''}
                onChange={(e) => handleInputChange('time_commitment_feasibility', e.target.value)}
                disabled={isSubmitted}
                rows={2}
                placeholder="Comment on time commitment"
              />
            </div>
          </section>

          {/* Skills Assessment */}
          <section className="form-section">
            <h2>Skills Assessment</h2>
            <div className="form-field">
              <label>Analytical Skills:</label>
              <textarea
                value={formData.analytical_skills || ''}
                onChange={(e) => handleInputChange('analytical_skills', e.target.value)}
                disabled={isSubmitted}
                rows={2}
              />
            </div>
            <div className="form-field">
              <label>Writing & Communication Skills:</label>
              <textarea
                value={formData.writing_communication_skills || ''}
                onChange={(e) => handleInputChange('writing_communication_skills', e.target.value)}
                disabled={isSubmitted}
                rows={2}
              />
            </div>
            <div className="form-field">
              <label>Critical Thinking:</label>
              <textarea
                value={formData.critical_thinking || ''}
                onChange={(e) => handleInputChange('critical_thinking', e.target.value)}
                disabled={isSubmitted}
                rows={2}
              />
            </div>
            <div className="form-field">
              <label>Technical Skills:</label>
              <textarea
                value={formData.technical_skills || ''}
                onChange={(e) => handleInputChange('technical_skills', e.target.value)}
                disabled={isSubmitted}
                rows={2}
              />
            </div>
          </section>

          {/* Supervision and Support */}
          <section className="form-section">
            <h2>Supervision and Support</h2>
            <div className="form-field">
              <label>Expectations from Supervision:</label>
              <textarea
                value={formData.expectations_from_supervision || ''}
                onChange={(e) => handleInputChange('expectations_from_supervision', e.target.value)}
                disabled={isSubmitted}
                rows={3}
              />
            </div>
            <div className="form-field">
              <label>Working Style Preference:</label>
              <textarea
                value={formData.working_style_preference || ''}
                onChange={(e) => handleInputChange('working_style_preference', e.target.value)}
                disabled={isSubmitted}
                rows={2}
              />
            </div>
            <div className="form-field">
              <label>Support Needs:</label>
              <textarea
                value={formData.support_needs || ''}
                onChange={(e) => handleInputChange('support_needs', e.target.value)}
                disabled={isSubmitted}
                rows={2}
              />
            </div>
          </section>

          {/* Overall Assessment */}
          <section className="form-section">
            <h2>Overall Assessment</h2>
            <div className="form-field">
              <label>Strengths Observed:</label>
              <textarea
                value={formData.strengths_observed || ''}
                onChange={(e) => handleInputChange('strengths_observed', e.target.value)}
                disabled={isSubmitted}
                rows={3}
              />
            </div>
            <div className="form-field">
              <label>Areas of Concern:</label>
              <textarea
                value={formData.areas_of_concern || ''}
                onChange={(e) => handleInputChange('areas_of_concern', e.target.value)}
                disabled={isSubmitted}
                rows={3}
              />
            </div>
            <div className="form-field">
              <label>Overall Impression:</label>
              <textarea
                value={formData.overall_impression || ''}
                onChange={(e) => handleInputChange('overall_impression', e.target.value)}
                disabled={isSubmitted}
                rows={4}
              />
            </div>
            <div className="form-field">
              <label>Recommendation:</label>
              <select
                value={formData.recommendation || ''}
                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                disabled={isSubmitted}
              >
                <option value="">Select...</option>
                <option value="Accept">Accept</option>
                <option value="Conditional Accept">Conditional Accept</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
            <div className="form-field">
              <label>Additional Notes:</label>
              <textarea
                value={formData.additional_notes || ''}
                onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                disabled={isSubmitted}
                rows={3}
              />
            </div>
          </section>

          {/* Form Actions */}
          {!isSubmitted && (
            <div className="form-actions no-print">
              <button
                type="button"
                className="btn-save"
                onClick={handleSave}
                disabled={saving || submitting}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={saving || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Interview'}
              </button>
            </div>
          )}

          {isSubmitted && (
            <div className="submission-notice">
              <p>This interview record has been submitted and cannot be edited.</p>
            </div>
          )}
        </form>
      </div>

      {/* Proposal Text Modal */}
      {showProposalModal && (proposalDocument || applicant?.raw_application_text) && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="h-section">
                Proposal {proposalDocument ? `- ${proposalDocument.file_name}` : 'Text'}
              </h2>
              <button className="modal-close" onClick={() => setShowProposalModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {loadingProposalText ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  Loading proposal text...
                </div>
              ) : (
                <pre className="application-text" style={{ 
                  background: '#F5F5F5', 
                  padding: '1.5rem', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {proposalText || 'No proposal text available'}
                </pre>
              )}
            </div>
          </div>
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
              {loadingCvText ? (
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
              {loadingTranscriptText ? (
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
                  {sanitizePreText(transcriptText) || 'No transcript text available'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


