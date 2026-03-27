/**
 * ApplicantsList - Virtualized list component for applicants
 * Uses react-window for performance with large datasets
 */
import React, { useMemo, useCallback } from 'react';
import { Grid, CellComponentProps } from 'react-window';
import { ApplicantCard } from '@/components/ApplicantCard';
import type { Applicant } from '@/types';
import './ApplicantsList.css';

interface ApplicantsListProps {
  applicants: Applicant[];
  documentStatuses: Map<string, { is_complete: boolean; missing_count: number }>;
  interviewStatuses?: Map<string, 'IN_PROCESS' | 'COMPLETED' | null>;
  reviewStatuses?: Map<string, 'submitted' | 'draft' | null>;
  loading?: boolean;
}

interface CellData {
  applicants: Applicant[];
  documentStatuses: Map<string, { is_complete: boolean; missing_count: number }>;
  interviewStatuses?: Map<string, 'IN_PROCESS' | 'COMPLETED' | null>;
  reviewStatuses?: Map<string, 'submitted' | 'draft' | null>;
  columnCount: number;
}

export const ApplicantsList: React.FC<ApplicantsListProps> = ({
  applicants,
  documentStatuses,
  interviewStatuses,
  reviewStatuses,
  loading = false,
}) => {
  // Calculate grid dimensions
  const columnCount = useMemo(() => {
    // Responsive: 1 column on mobile, 2 on tablet, 3+ on desktop
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 1;
      if (width < 1024) return 2;
      return 3;
    }
    return 3;
  }, []);

  const rowCount = Math.ceil(applicants.length / columnCount);
  const itemHeight = 280; // Approximate height of ApplicantCard
  const containerHeight = Math.min(600, rowCount * itemHeight);

  if (loading) {
    return <div className="applicants-loading">Loading applicants...</div>;
  }

  if (applicants.length === 0) {
    return (
      <div className="applicants-empty">
        <p>No applicants found matching the filters.</p>
      </div>
    );
  }

  // For small lists, render without virtualization
  if (applicants.length <= 12) {
    return (
      <div className="applicants-grid">
        {applicants.map((applicant) => (
          <ApplicantCard
            key={applicant.id}
            applicant={applicant}
            documentStatus={documentStatuses.get(applicant.id)}
            interviewStatus={interviewStatuses?.get(applicant.id) || null}
            reviewStatus={reviewStatuses?.get(applicant.id) || null}
          />
        ))}
      </div>
    );
  }

  // For large lists, use virtualization
  const cellComponent = useCallback(({ columnIndex, rowIndex, style, applicants: cellApplicants, documentStatuses: cellDocumentStatuses, interviewStatuses: cellInterviewStatuses, reviewStatuses: cellReviewStatuses, columnCount: cellColumnCount }: CellComponentProps<CellData>) => {
    const index = rowIndex * cellColumnCount + columnIndex;
    const applicant = cellApplicants[index];

    if (!applicant) {
      return <div style={style} />;
    }

    return (
      <div style={{ ...style, padding: '0.75rem' }}>
        <ApplicantCard
          applicant={applicant}
          documentStatus={cellDocumentStatuses.get(applicant.id)}
          interviewStatus={cellInterviewStatuses?.get(applicant.id) || null}
          reviewStatus={cellReviewStatuses?.get(applicant.id) || null}
        />
      </div>
    );
  }, []);

  return (
    <div className="applicants-virtualized-container">
      <Grid
        columnCount={columnCount}
        columnWidth={300}
        rowCount={rowCount}
        rowHeight={itemHeight}
        cellComponent={cellComponent}
        cellProps={{
          applicants,
          documentStatuses,
          interviewStatuses,
          reviewStatuses,
          columnCount,
        }}
        style={{
          height: containerHeight,
          width: '100%',
        }}
      />
    </div>
  );
};

