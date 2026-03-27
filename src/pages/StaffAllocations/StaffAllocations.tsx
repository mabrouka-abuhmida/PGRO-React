/**
 * StaffAllocations - My Allocations page for staff
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '@/contexts/StaffContext';
import { Badge } from '@/components';
import { allocationService } from '@/services/allocationService';
import { logger } from '@/utils/logger';
import type { Allocation } from '@/types';
import './StaffAllocations.css';

export const StaffAllocations: React.FC = () => {
  const { currentStaff } = useStaff();
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllocations = useCallback(async () => {
    if (!currentStaff) return;
    
    try {
      setLoading(true);
      // Get all allocations for this staff member (both confirmed and unconfirmed)
      const data = await allocationService.list({
        staff_id: currentStaff.id,
      });
      setAllocations(data);
    } catch (error) {
      logger.error('Error loading allocations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentStaff]);

  useEffect(() => {
    if (currentStaff) {
      loadAllocations();
    }
  }, [currentStaff, loadAllocations]);

  const getStatusBadgeVariant = (status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'UNDER_REVIEW': return 'warning';
      case 'SUPERVISOR_CONTACTED': return 'warning';
      case 'ON_HOLD': return 'default';
      default: return 'default';
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' => {
    switch (role) {
      case 'DOS': return 'info';
      case 'CO_SUPERVISOR': return 'primary';
      case 'ADVISOR': return 'warning';
      default: return 'default';
    }
  };

  const handleReview = (allocationId: string) => {
    navigate(`/staff-portal/review/${allocationId}`);
  };

  if (loading) {
    return (
      <div className="staff-allocations">
        <div className="loading">Loading allocations...</div>
      </div>
    );
  }

  if (!currentStaff) {
    return (
      <div className="staff-allocations">
        <div className="error">Staff information not available</div>
      </div>
    );
  }

  return (
    <div className="staff-allocations">
      <div className="page-header">
        <h1 className="h-hero">My Allocations</h1>
        <p className="page-subtitle">
          Review applications allocated to you as supervisor
        </p>
      </div>

      {allocations.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any allocations yet.</p>
        </div>
      ) : (
        <div className="allocations-grid">
          {allocations.map((allocation) => (
            <div key={allocation.id} className="allocation-card">
              <div className="card-header">
                <h3 className="applicant-name">{allocation.applicant_name || 'Unknown Applicant'}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge variant={getStatusBadgeVariant(allocation.applicant_status)}>
                    {allocation.applicant_status?.replace(/_/g, ' ') || 'NEW'}
                  </Badge>
                  {!allocation.is_confirmed && (
                    <Badge variant="default">Pending Confirmation</Badge>
                  )}
                </div>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Programme:</span>
                  <span className="info-value">{allocation.applicant_degree_type || 'N/A'}</span>
                </div>
                
                {allocation.applicant_intake_year && (
                  <div className="info-row">
                    <span className="info-label">Intake:</span>
                    <span className="info-value">
                      {allocation.applicant_intake_term} {allocation.applicant_intake_year}
                    </span>
                  </div>
                )}
                
                <div className="info-row">
                  <span className="info-label">Role:</span>
                  <Badge variant={getRoleBadgeVariant(allocation.role)}>
                    {allocation.role.replace('_', ' ')}
                  </Badge>
                </div>
                
                {allocation.match_score !== undefined && (
                  <div className="info-row">
                    <span className="info-label">Match Score:</span>
                    <span className="info-value">{(allocation.match_score * 100).toFixed(1)}%</span>
                  </div>
                )}
                
                {allocation.applicant_priority_score !== undefined && allocation.applicant_priority_score !== null && (
                  <div className="info-row">
                    <span className="info-label">Priority Score:</span>
                    <span className="info-value">{allocation.applicant_priority_score.toFixed(1)}</span>
                  </div>
                )}
                
                {allocation.applicant_ai_detection_probability !== undefined && allocation.applicant_ai_detection_probability !== null && (
                  <div className="info-row">
                    <span className="info-label">AI Detection:</span>
                    <span className="info-value">{allocation.applicant_ai_detection_probability.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <button
                  className="btn-review"
                  onClick={() => handleReview(allocation.id)}
                >
                  Review Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

