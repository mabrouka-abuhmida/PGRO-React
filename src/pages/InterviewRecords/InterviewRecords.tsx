/**
 * InterviewRecords - PGRO view of all interview records
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Card } from '@/components';
import { interviewRecordService, type InterviewRecord } from '@/services/interviewRecordService';
import { createInterviewRecordSlug } from '@/utils/slug';
import { getRecommendationBadgeVariant } from '@/utils/badgeVariants';
import { logger } from '@/utils/logger';
import './InterviewRecords.css';

export const InterviewRecords: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await interviewRecordService.list();
      setRecords(data);
    } catch (error) {
      logger.error('Error loading interview records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = filterStatus 
    ? records.filter(r => r.status === filterStatus)
    : records;

  const getStatusBadgeVariant = (status: string): 'warning' | 'success' => {
    return status === 'COMPLETED' ? 'success' : 'warning';
  };

  const getStatusLabel = (status: string): string => {
    return status === 'COMPLETED' ? 'Interview Done' : 'Interview In Process';
  };

  if (loading) {
    return <div className="loading">Loading interview records...</div>;
  }

  return (
    <div className="interview-records-page">
      <div className="page-header">
        <h1>Interview Records</h1>
        <p>View and track interview records for accepted applicants</p>
      </div>

      <div className="filters">
        <label>
          Status:
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
      </div>

      <div className="records-grid">
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <p>No interview records found</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <Card 
              key={record.id} 
              variant="elevated" 
              className="interview-record-card"
              onClick={() => {
                const slug = createInterviewRecordSlug(record.applicant_name, record.id);
                navigate(`/pgro/interview-records/${slug}`, { 
                  state: { recordId: record.id } 
                });
              }}
            >
              <div className="card-header">
                <h3>{record.applicant_name || 'Unknown Applicant'}</h3>
                <Badge variant={getStatusBadgeVariant(record.status)}>
                  {getStatusLabel(record.status)}
                </Badge>
              </div>
              
              <div className="card-body">
                <p><strong>Interviewer:</strong> {record.staff_name || 'Unknown Staff'}</p>
                {record.staff_school && <p><strong>School:</strong> {record.staff_school}</p>}
                {record.role && <p><strong>Role:</strong> {record.role.replace('_', ' ')}</p>}
                {record.interview_date && (
                  <p><strong>Interview Date:</strong> {new Date(record.interview_date).toLocaleDateString()}</p>
                )}
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
                  <p className="submitted-date">
                    <strong>Submitted:</strong> {new Date(record.submitted_at).toLocaleString()}
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


