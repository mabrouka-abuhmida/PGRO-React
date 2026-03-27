/**
 * ApplicantSummary - Application summary section component
 */
import React from 'react';
import { Card, Badge, TagList } from '@/components';
import type { Applicant } from '@/types';
import './ApplicantSummary.css';

interface ApplicantSummaryProps {
  applicant: Applicant;
}

export const ApplicantSummary: React.FC<ApplicantSummaryProps> = ({ applicant }) => {
  return (
    <Card variant="elevated" className="applicant-info-card">
      <h2 className="h-section" style={{ marginBottom: '1.5rem' }}>APPLICATION SUMMARY</h2>

      <div className="summary-field">
        <strong className="summary-label">Title:</strong>
        <p className="summary-value">{applicant.full_name}</p>
      </div>

      {applicant.summary_text && (
        <div className="summary-field">
          <strong className="summary-label">Description:</strong>
          <p className="summary-value">{applicant.summary_text}</p>
        </div>
      )}

      {applicant.primary_theme && (
        <div className="summary-field">
          <strong className="summary-label">Primary Theme:</strong>
          <p className="summary-value">{applicant.primary_theme}</p>
        </div>
      )}

      {(applicant.secondary_theme || (applicant.topic_keywords && applicant.topic_keywords.length > 0)) && (
        <div className="summary-field">
          <strong className="summary-label">Secondary Theme:</strong>
          <div className="summary-value">
            {applicant.secondary_theme ? (
              <p>{applicant.secondary_theme}</p>
            ) : (
              <TagList tags={applicant.topic_keywords || []} />
            )}
          </div>
        </div>
      )}

      {applicant.method_keywords && applicant.method_keywords.length > 0 && (
        <div className="summary-field">
          <strong className="summary-label">Methods:</strong>
          <div className="summary-value">
            <TagList tags={applicant.method_keywords} />
          </div>
        </div>
      )}

      {applicant.priority_score !== undefined && applicant.priority_score !== null && (
        <div className="summary-field">
          <strong className="summary-label">Priority Score:</strong>
          <div className="summary-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Badge
                variant={
                  applicant.priority_score >= 80 ? 'success' :
                  applicant.priority_score >= 60 ? 'warning' :
                  'error'
                }
              >
                Priority Score: {applicant.priority_score.toFixed(1)}/100
              </Badge>
              {applicant.ai_detection_probability !== undefined && applicant.ai_detection_probability !== null && (
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
              )}
            </div>
          </div>
        </div>
      )}

      {applicant.quality_rationale && (
        <div className="quality-rationale">
          <strong>Rationale:</strong>
          <p className="body" style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>
            {applicant.quality_rationale}
          </p>
        </div>
      )}
    </Card>
  );
};

