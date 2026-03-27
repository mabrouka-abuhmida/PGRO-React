/**
 * ManualAllocation - Manual allocation section for applicant detail page
 */
import React from 'react';
import { Card, Button } from '@/components';
import type { Staff } from '@/types';
import './ManualAllocation.css';

interface ManualAllocationProps {
  staffList: Staff[];
  loadingStaff: boolean;
  manualAllocation: {
    staff_id: string;
    role: 'DOS' | 'CO_SUPERVISOR' | 'ADVISOR';
  };
  onAllocationChange: (allocation: { staff_id: string; role: 'DOS' | 'CO_SUPERVISOR' | 'ADVISOR' }) => void;
  onCreateAllocation: () => void;
  creating: boolean;
}

export const ManualAllocation: React.FC<ManualAllocationProps> = ({
  staffList,
  loadingStaff,
  manualAllocation,
  onAllocationChange,
  onCreateAllocation,
  creating,
}) => {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <Card variant="elevated" className="matches-card">
        <h2 className="h-section">Manual Allocation</h2>
        <div style={{ padding: '1rem 0' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Select Staff Member
            </label>
            <select
              value={manualAllocation.staff_id}
              onChange={(e) => onAllocationChange({ ...manualAllocation, staff_id: e.target.value })}
              disabled={loadingStaff || creating}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D9D9D9',
                borderRadius: '4px',
                fontSize: '0.875rem',
                backgroundColor: loadingStaff || creating ? '#f5f5f5' : 'white',
                cursor: loadingStaff || creating ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">-- Select Staff Member --</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name} {staff.email ? `(${staff.email})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Role
            </label>
            <select
              value={manualAllocation.role}
              onChange={(e) => onAllocationChange({ ...manualAllocation, role: e.target.value as 'DOS' | 'CO_SUPERVISOR' | 'ADVISOR' })}
              disabled={creating}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D9D9D9',
                borderRadius: '4px',
                fontSize: '0.875rem',
                backgroundColor: creating ? '#f5f5f5' : 'white',
                cursor: creating ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="DOS">DOS</option>
              <option value="CO_SUPERVISOR">Co-Supervisor 1</option>
              <option value="ADVISOR">Co-Supervisor 2</option>
            </select>
          </div>
          
          <div style={{ width: '100%' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateAllocation}
              disabled={!manualAllocation.staff_id || creating || loadingStaff}
            >
              {creating ? 'Creating...' : 'Create Allocation'}
            </Button>
          </div>
          
          {loadingStaff && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
              Loading staff list...
            </p>
          )}
          
          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', fontStyle: 'italic', lineHeight: '1.4' }}>
            This will create an allocation, send an email to the supervisor, and update the applicant status to "Supervisor Contacted".
          </p>
        </div>
      </Card>
    </div>
  );
};

