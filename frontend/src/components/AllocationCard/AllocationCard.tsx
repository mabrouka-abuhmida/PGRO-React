/**
 * AllocationCard - Memoized card component for allocation items
 */
import React from 'react';
import { Card, Badge, Button } from '@/components';
import type { Allocation, ApplicantStatus } from '@/types';
import './AllocationCard.css';

interface AllocationCardProps {
  allocation: Allocation;
  onConfirm: (id: string) => void;
  onDelete: (id: string, applicantName: string, staffName: string) => void;
  onSendEmail: (id: string) => void;
  onStatusUpdate: (applicantId: string, status: ApplicantStatus, allocationId: string) => void;
  onEmailParticipant?: (applicantId: string, applicantName: string) => void;
  onViewNotes?: (id: string) => void;
  confirming: Set<string>;
  deleting: Set<string>;
  sendingEmail: Set<string>;
  updatingStatus: Set<string>;
  sendingParticipantEmail?: Set<string>;
  canEmailParticipant?: Map<string, { canEmail: boolean; reason?: string }>;
  getRoleBadgeVariant: (role: string) => 'info' | 'primary' | 'warning' | 'default';
}

export const AllocationCard = React.memo<AllocationCardProps>(({
  allocation,
  onConfirm,
  onDelete,
  onSendEmail,
  onStatusUpdate,
  onEmailParticipant,
  onViewNotes,
  confirming,
  deleting,
  sendingEmail,
  updatingStatus,
  sendingParticipantEmail = new Set(),
  canEmailParticipant = new Map(),
  getRoleBadgeVariant,
}) => {
  return (
    <Card variant="elevated" className="allocation-card">
      <div className="allocation-header">
        <div>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Supervisor:</strong> {allocation.staff_name || 'Unknown Staff'}
            {allocation.staff_school && ` • ${allocation.staff_school}`}
          </p>
        </div>
        <div className="allocation-badges">
          <Badge variant={getRoleBadgeVariant(allocation.role)}>
            {allocation.role.replace('_', ' ')}
          </Badge>
          {allocation.is_confirmed ? (
            <Badge variant="success">Confirmed</Badge>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant="warning">Contacted</Badge>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onConfirm(allocation.id)}
                disabled={confirming.has(allocation.id)}
              >
                {confirming.has(allocation.id) ? 'Confirming...' : 'Confirm'}
              </Button>
            </div>
          )}
          {allocation.match_score && (
            <Badge variant="default">
              {(allocation.match_score * 100).toFixed(0)}% Match
            </Badge>
          )}
        </div>
      </div>
      <div className="allocation-explanation-section">
        <p className="allocation-explanation">
          {allocation.explanation && allocation.explanation !== "Explanation not available" 
            ? allocation.explanation 
            : 'No explanation available'}
        </p>
      </div>
      {allocation.confirmed_at && (
        <p className="allocation-meta">
          Confirmed on {new Date(allocation.confirmed_at).toLocaleDateString()}
        </p>
      )}
      <div className="allocation-email-section">
        {allocation.email_sent_at ? (
          <div className="email-status-success">
            <span>📧 Email sent {new Date(allocation.email_sent_at).toLocaleString()}</span>
            {allocation.time_to_confirmation && allocation.is_confirmed && (
              <span className="time-to-confirmation">
                • Confirmed in {allocation.time_to_confirmation}
              </span>
            )}
          </div>
        ) : allocation.email_error ? (
          <div className="email-status-error" title={allocation.email_error}>
            <span>❌ Send failed (hover for error)</span>
          </div>
        ) : null}
      </div>
      <div className="allocation-status-section">
        <div className="status-label">Update Status:</div>
        <div className="status-checkboxes">
          <label className="status-checkbox status-checkbox-contacted">
            <input
              type="checkbox"
              checked={allocation.applicant_status === 'SUPERVISOR_CONTACTED'}
              onChange={(e) => {
                if (e.target.checked) {
                  onStatusUpdate(allocation.applicant_id, 'SUPERVISOR_CONTACTED', allocation.id);
                } else {
                  onStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
                }
              }}
              disabled={updatingStatus.has(allocation.id)}
            />
            <span>Contacted</span>
          </label>
          <label className="status-checkbox status-checkbox-accepted">
            <input
              type="checkbox"
              checked={allocation.applicant_status === 'ACCEPTED'}
              onChange={(e) => {
                if (e.target.checked) {
                  onStatusUpdate(allocation.applicant_id, 'ACCEPTED', allocation.id);
                } else {
                  onStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
                }
              }}
              disabled={updatingStatus.has(allocation.id)}
            />
            <span>Accepted</span>
          </label>
          <label className="status-checkbox status-checkbox-rejected">
            <input
              type="checkbox"
              checked={allocation.applicant_status === 'REJECTED'}
              onChange={(e) => {
                if (e.target.checked) {
                  onStatusUpdate(allocation.applicant_id, 'REJECTED', allocation.id);
                } else {
                  onStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
                }
              }}
              disabled={updatingStatus.has(allocation.id)}
            />
            <span>Rejected</span>
          </label>
        </div>
      </div>
      
      <div className="allocation-actions">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSendEmail(allocation.id)}
          disabled={sendingEmail.has(allocation.id) || !allocation.staff_email}
          aria-label={!allocation.staff_email ? 'Staff member does not have an email address' : undefined}
        >
          {sendingEmail.has(allocation.id) ? 'Sending...' : '📧 Email Supervisor'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(
            allocation.id,
            allocation.applicant_name || 'Unknown Applicant',
            allocation.staff_name || 'Unknown Staff'
          )}
          disabled={deleting.has(allocation.id)}
          className="btn-delete"
        >
          {deleting.has(allocation.id) ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
      
      {canEmailParticipant.has(allocation.applicant_id) && !canEmailParticipant.get(allocation.applicant_id)?.canEmail && (
        <div className="allocation-email-participant-section">
          <div className="email-status-message" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
              ⓘ {canEmailParticipant.get(allocation.applicant_id)?.reason || 'Cannot send email'}
            </span>
          </div>
        </div>
      )}
      
      <div className="allocation-bottom-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        {onViewNotes && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewNotes(allocation.id)}
          >
            📝 View Notes
          </Button>
        )}
        {canEmailParticipant.has(allocation.applicant_id) && canEmailParticipant.get(allocation.applicant_id)?.canEmail && onEmailParticipant && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEmailParticipant(
              allocation.applicant_id,
              allocation.applicant_name || 'Unknown Applicant'
            )}
            disabled={sendingParticipantEmail.has(allocation.applicant_id)}
            className="btn-email-applicant"
          >
            {sendingParticipantEmail.has(allocation.applicant_id) ? 'Sending...' : '📧 Email Applicant'}
          </Button>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.allocation.id === nextProps.allocation.id &&
    prevProps.allocation.is_confirmed === nextProps.allocation.is_confirmed &&
    prevProps.allocation.applicant_status === nextProps.allocation.applicant_status &&
    prevProps.confirming.has(prevProps.allocation.id) === nextProps.confirming.has(nextProps.allocation.id) &&
    prevProps.deleting.has(prevProps.allocation.id) === nextProps.deleting.has(nextProps.allocation.id) &&
    prevProps.sendingEmail.has(prevProps.allocation.id) === nextProps.sendingEmail.has(nextProps.allocation.id) &&
    prevProps.updatingStatus.has(prevProps.allocation.id) === nextProps.updatingStatus.has(nextProps.allocation.id)
  );
});

AllocationCard.displayName = 'AllocationCard';

