/**
 * ApplicantMatches - Matches panel component for applicant detail page
 */
import React from 'react';
import { Card, Badge, Button } from '@/components';
import { getRoleBadgeVariant } from '@/utils/badgeVariants';
import type { MatchResponse } from '@/types';
import './ApplicantMatches.css';

interface ApplicantMatchesProps {
  matches: MatchResponse[];
  loading: boolean;
  onCreateAllocation: (match: MatchResponse) => void;
  creatingAllocations: Set<string>;
  hasEmbedding: boolean;
}

export const ApplicantMatches: React.FC<ApplicantMatchesProps> = ({
  matches,
  loading,
  onCreateAllocation,
  creatingAllocations,
  hasEmbedding,
}) => {
  return (
    <Card variant="elevated" className="matches-panel">
      <div className="matches-header">
        <h2 className="h-section">SUPERVISOR MATCHES</h2>
      </div>

      {!hasEmbedding && (
        <div className="matches-empty">
          <p>Waiting for AI processing. Please refresh the page in a moment.</p>
        </div>
      )}

      {hasEmbedding && matches.length === 0 && !loading && (
        <div className="matches-empty">
          <p>No matches found.</p>
        </div>
      )}

      {loading && (
        <div className="matches-loading">
          <p>Finding matches...</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.staff_id} className="match-item">
              <div className="match-header">
                <h3 className="match-name">{match.full_name}</h3>
                <Badge variant={getRoleBadgeVariant(match.role_suggestion)}>
                  {match.role_suggestion}
                </Badge>
              </div>
              
              <div className="match-score">
                <strong>Match Score: </strong>
                <span className="score-value">{(match.match_score * 100).toFixed(1)}%</span>
              </div>

              {match.explanation && (
                <div className="match-explanation">
                  <strong>Why:</strong>
                  <p>{match.explanation}</p>
                </div>
              )}

              <div style={{ width: '100%', marginTop: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCreateAllocation(match)}
                  disabled={creatingAllocations.has(match.staff_id)}
                >
                  {creatingAllocations.has(match.staff_id) ? 'Creating...' : 'Create Allocation'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

