/**
 * AllocationNotesPage - Dedicated page for viewing/managing allocation notes
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components';
import { AllocationNotes } from '@/components/AllocationNotes/AllocationNotes';
import { useAuth } from '@/contexts/AuthContext';
import './AllocationNotesPage.css';

export const AllocationNotesPage: React.FC = () => {
  const { allocationId } = useParams<{ allocationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!allocationId) {
    return <div>Invalid allocation ID</div>;
  }

  const canCreate = user?.role === 'PGR_LEAD' || user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <div className="allocation-notes-page">
      <div className="notes-page-header">
        <Button variant="text" onClick={() => navigate('/pgro/allocations')}>
          ← Back to Allocations
        </Button>
        <h1>Allocation Notes</h1>
      </div>

      <div className="notes-page-content">
        <AllocationNotes
          allocationId={allocationId}
          canCreate={canCreate}
        />
      </div>
    </div>
  );
};


