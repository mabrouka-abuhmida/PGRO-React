/**
 * ApplicantsFilters - Filter section for applicants page
 */
import React from 'react';
import './ApplicantsFilters.css';

interface ApplicantsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: {
    intake_year: number;
    status: string;
    degree_type: string;
    show_incomplete_only: boolean;
  };
  onFiltersChange: (filters: {
    intake_year: number;
    status: string;
    degree_type: string;
    show_incomplete_only: boolean;
  }) => void;
}

export const ApplicantsFilters: React.FC<ApplicantsFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}) => {
  return (
    <div className="filters-section">
      <div className="filter-group" style={{ flex: '1', maxWidth: '400px' }}>
        <label>Search</label>
        <input
          type="text"
          placeholder="Search by name, email, status, type, theme, or topic..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>
      <div className="filter-group">
        <label>Intake Year</label>
        <input
          type="number"
          value={filters.intake_year}
          onChange={(e) => onFiltersChange({ ...filters, intake_year: parseInt(e.target.value) })}
        />
      </div>
      <div className="filter-group">
        <label>Status</label>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
        >
          <option value="">All</option>
          <option value="NEW">New</option>
          <option value="SUPERVISOR_CONTACTED">Contacted</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Degree Type</label>
        <select
          value={filters.degree_type}
          onChange={(e) => onFiltersChange({ ...filters, degree_type: e.target.value })}
        >
          <option value="">All</option>
          <option value="PHD">PhD</option>
          <option value="MRES">MRes</option>
        </select>
      </div>
      <div className="filter-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="incomplete-checkbox"
            checked={filters.show_incomplete_only}
            onChange={(e) => onFiltersChange({ ...filters, show_incomplete_only: e.target.checked })}
          />
          <span>Show Incomplete Only</span>
        </label>
      </div>
    </div>
  );
};

