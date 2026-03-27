/**
 * InterviewDetail - View completed interview form (PGRO view)
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, SkeletonCard } from '@/components';
import {
  useInterviewRecord,
  useApplicant,
} from '@/hooks';
import { interviewRecordService } from '@/services/interviewRecordService';
import { findRecordIdBySlug, createInterviewRecordSlug } from '@/utils/slug';
import './InterviewDetail.css';

export const InterviewDetail: React.FC = () => {
  const { id: slugOrId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Resolve interview record ID from slug or UUID
  const [resolvedRecordId, setResolvedRecordId] = useState<string | null>(
    location.state?.recordId || null
  );

  // Try to resolve record ID if we have slugOrId but no resolved ID
  useEffect(() => {
    if (slugOrId && !resolvedRecordId) {
      const isUUID = slugOrId.includes('-') && slugOrId.length === 36;
      if (isUUID) {
        setResolvedRecordId(slugOrId);
      } else {
        // It's a slug, need to resolve it
        interviewRecordService.list()
          .then(allRecords => {
            const id = findRecordIdBySlug(slugOrId, allRecords);
            if (id) {
              setResolvedRecordId(id);
            }
          })
          .catch(() => {
            // Error will be handled by the query
          });
      }
    }
  }, [slugOrId, resolvedRecordId]);

  // Fetch interview record
  const { data: record, isLoading: loadingRecord, error: recordError } = useInterviewRecord(resolvedRecordId || undefined);
  
  // Fetch applicant
  const { data: applicant, isLoading: loadingApplicant } = useApplicant(record?.applicant_id || undefined);

  const loading = loadingRecord || loadingApplicant;
  const error = recordError ? (recordError instanceof Error ? recordError.message : 'Failed to load interview record') : null;

  // Update resolved ID when record loads
  useEffect(() => {
    if (record?.id && record.id !== resolvedRecordId) {
      setResolvedRecordId(record.id);
      
      // Update URL to use slug if we used UUID
      if (slugOrId !== record.id && record.applicant_name) {
        const slug = createInterviewRecordSlug(record.applicant_name, record.id);
        navigate(`/pgro/interview-records/${slug}`, { 
          replace: true,
          state: { recordId: record.id } 
        });
      }
    }
  }, [record, resolvedRecordId, slugOrId, navigate]);

  if (loading) {
    return <SkeletonCard />;
  }

  if (error || !record) {
    return (
      <div className="error">
        <p>{error || 'Interview record not found'}</p>
        <Link to="/pgro/interview-records">
          <Button variant="primary">Back to Interview Records</Button>
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

  return (
    <div className="interview-detail-page">
      <div className="page-header">
        <Link to="/pgro/interview-records" className="no-print">
          <Button variant="text">← Back to Interview Records</Button>
        </Link>
        <div className="header-info">
          <h1>Interview Record</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge variant={record.status === 'COMPLETED' ? 'success' : 'warning'}>
              {record.status === 'COMPLETED' ? 'Interview Done' : 'Interview In Process'}
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
          {aiLikelihood && applicant.ai_detection_probability !== null && (
            <div 
              className="ai-likelihood-badge"
              style={{ background: aiLikelihoodColor }}
            >
              AI Likelihood: {aiLikelihood} ({applicant.ai_detection_probability ? applicant.ai_detection_probability.toFixed(0) : "N/A"}%)
            </div>
          )}
        </div>
      )}

      <div className="interview-content">
        {/* Header Information */}
        <section className="form-section">
          <h2>Interview Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Applicant Name:</label>
              <span>{record.applicant_name_interview || record.applicant_name || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Interviewer Name:</label>
              <span>{record.interviewer_name || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Interview Date:</label>
              <span>{record.interview_date ? new Date(record.interview_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Location:</label>
              <span>{record.interview_location || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Applicant Background */}
        {(record.educational_background || record.work_experience || record.research_experience) && (
          <section className="form-section">
            <h2>Applicant Background</h2>
            {record.educational_background && (
              <div className="field">
                <label>Educational Background:</label>
                <p>{record.educational_background}</p>
              </div>
            )}
            {record.work_experience && (
              <div className="field">
                <label>Work Experience:</label>
                <p>{record.work_experience}</p>
              </div>
            )}
            {record.research_experience && (
              <div className="field">
                <label>Research Experience:</label>
                <p>{record.research_experience}</p>
              </div>
            )}
          </section>
        )}

        {/* Research Proposal Discussion */}
        {(record.research_topic_clarity || record.research_objectives_understanding || 
          record.methodology_knowledge || record.literature_awareness) && (
          <section className="form-section">
            <h2>Research Proposal Discussion</h2>
            {record.research_topic_clarity && (
              <div className="field">
                <label>Research Topic Clarity:</label>
                <p>{record.research_topic_clarity}</p>
              </div>
            )}
            {record.research_objectives_understanding && (
              <div className="field">
                <label>Research Objectives Understanding:</label>
                <p>{record.research_objectives_understanding}</p>
              </div>
            )}
            {record.methodology_knowledge && (
              <div className="field">
                <label>Methodology Knowledge:</label>
                <p>{record.methodology_knowledge}</p>
              </div>
            )}
            {record.literature_awareness && (
              <div className="field">
                <label>Literature Awareness:</label>
                <p>{record.literature_awareness}</p>
              </div>
            )}
          </section>
        )}

        {/* Motivation and Commitment */}
        {(record.motivation_for_research || record.understanding_of_phd_demands !== undefined || 
          record.time_commitment_feasibility) && (
          <section className="form-section">
            <h2>Motivation and Commitment</h2>
            {record.motivation_for_research && (
              <div className="field">
                <label>Motivation for Research:</label>
                <p>{record.motivation_for_research}</p>
              </div>
            )}
            {record.understanding_of_phd_demands !== undefined && (
              <div className="field">
                <label>Understanding of PhD Demands:</label>
                <p>{record.understanding_of_phd_demands ? 'Yes' : 'No'}</p>
              </div>
            )}
            {record.time_commitment_feasibility && (
              <div className="field">
                <label>Time Commitment Feasibility:</label>
                <p>{record.time_commitment_feasibility}</p>
              </div>
            )}
          </section>
        )}

        {/* Skills Assessment */}
        {(record.analytical_skills || record.writing_communication_skills || 
          record.critical_thinking || record.technical_skills) && (
          <section className="form-section">
            <h2>Skills Assessment</h2>
            {record.analytical_skills && (
              <div className="field">
                <label>Analytical Skills:</label>
                <p>{record.analytical_skills}</p>
              </div>
            )}
            {record.writing_communication_skills && (
              <div className="field">
                <label>Writing & Communication Skills:</label>
                <p>{record.writing_communication_skills}</p>
              </div>
            )}
            {record.critical_thinking && (
              <div className="field">
                <label>Critical Thinking:</label>
                <p>{record.critical_thinking}</p>
              </div>
            )}
            {record.technical_skills && (
              <div className="field">
                <label>Technical Skills:</label>
                <p>{record.technical_skills}</p>
              </div>
            )}
          </section>
        )}

        {/* Supervision and Support */}
        {(record.expectations_from_supervision || record.working_style_preference || 
          record.support_needs) && (
          <section className="form-section">
            <h2>Supervision and Support</h2>
            {record.expectations_from_supervision && (
              <div className="field">
                <label>Expectations from Supervision:</label>
                <p>{record.expectations_from_supervision}</p>
              </div>
            )}
            {record.working_style_preference && (
              <div className="field">
                <label>Working Style Preference:</label>
                <p>{record.working_style_preference}</p>
              </div>
            )}
            {record.support_needs && (
              <div className="field">
                <label>Support Needs:</label>
                <p>{record.support_needs}</p>
              </div>
            )}
          </section>
        )}

        {/* Overall Assessment */}
        <section className="form-section">
          <h2>Overall Assessment</h2>
          {record.strengths_observed && (
            <div className="field">
              <label>Strengths Observed:</label>
              <p>{record.strengths_observed}</p>
            </div>
          )}
          {record.areas_of_concern && (
            <div className="field">
              <label>Areas of Concern:</label>
              <p>{record.areas_of_concern}</p>
            </div>
          )}
          {record.overall_impression && (
            <div className="field">
              <label>Overall Impression:</label>
              <p>{record.overall_impression}</p>
            </div>
          )}
          {record.recommendation && (
            <div className="field">
              <label>Recommendation:</label>
              <Badge variant={
                record.recommendation.toLowerCase().includes('accept') ? 'success' :
                record.recommendation.toLowerCase().includes('reject') ? 'error' : 'warning'
              }>
                {record.recommendation}
              </Badge>
            </div>
          )}
          {record.additional_notes && (
            <div className="field">
              <label>Additional Notes:</label>
              <p>{record.additional_notes}</p>
            </div>
          )}
        </section>

        {/* Submission Info */}
        {record.submitted_at && (
          <section className="form-section submission-info">
            <p><strong>Submitted:</strong> {new Date(record.submitted_at).toLocaleString()}</p>
          </section>
        )}
      </div>
    </div>
  );
};


