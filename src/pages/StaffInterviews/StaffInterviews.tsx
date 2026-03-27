/**
 * StaffInterviews - Staff view of their assigned interviews
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '@/contexts/StaffContext';
import { Badge } from '@/components';
import { interviewRecordService, type InterviewRecord } from '@/services/interviewRecordService';
import { getRecommendationBadgeVariant } from '@/utils/badgeVariants';
import { logger } from '@/utils/logger';
import { createInterviewRecordSlug } from '@/utils/slug';
import './StaffInterviews.css';

export const StaffInterviews: React.FC = () => {
  const { currentStaff } = useStaff();
  const navigate = useNavigate();
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    if (!currentStaff) return;
    
    try {
      setLoading(true);
      const data = await interviewRecordService.list({
        staff_id: currentStaff.id
      });
      setRecords(data);
    } catch (error) {
      logger.error('Error loading interview records:', error);
    } finally {
      setLoading(false);
    }
  }, [currentStaff]);

  useEffect(() => {
    if (currentStaff) {
      loadRecords();
    }
  }, [currentStaff, loadRecords]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="staff-interviews-page">
      <div className="page-header">
        <h1>My Interviews</h1>
        <p>Complete interview forms for accepted applicants</p>
      </div>

      <div className="records-grid">
        {records.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any interview assignments yet.</p>
          </div>
        ) : (
          records.map((record) => (
            <div 
              key={record.id} 
              className="interview-card"
              onClick={() => {
                const slug = createInterviewRecordSlug(record.applicant_name, record.id);
                navigate(`/staff-portal/interviews/${slug}`, { 
                  state: { recordId: record.id } 
                });
              }}
            >
              <div className="card-header">
                <h3>{record.applicant_name}</h3>
                <Badge variant={record.status === 'COMPLETED' ? 'success' : 'warning'}>
                  {record.status === 'COMPLETED' ? 'Interview Done' : 'Interview In Process'}
                </Badge>
              </div>
              <div className="card-body">
                {record.interview_date && (
                  <p><strong>Scheduled:</strong> {new Date(record.interview_date).toLocaleDateString()}</p>
                )}
                <p><strong>Role:</strong> {record.role?.replace('_', ' ')}</p>
                {record.recommendation && (
                  <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <p style={{ marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
                      <strong>Recommendation:</strong>
                    </p>
                    <Badge variant={
                      record.recommendation.toLowerCase().includes('accept') ? 'success' :
                      record.recommendation.toLowerCase().includes('reject') ? 'error' :
                      record.recommendation.toLowerCase().includes('interview') ? 'warning' :
                      getRecommendationBadgeVariant(record.recommendation)
                    }>
                      {record.recommendation}
                    </Badge>
                  </div>
                )}
                {record.submitted_at && (
                  <p className="submitted-info">
                    Submitted: {new Date(record.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="card-actions">
                <button className="btn-primary">
                  {record.status === 'COMPLETED' ? 'View Interview' : 'Complete Interview'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


