/**
 * Allocations - Allocation board view
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Card, Badge, Button, SkeletonList, AllocationsList, AllocationCard } from '@/components';
import { useAllocations, useUpdateAllocation, useDeleteAllocation, useSendAllocationEmail, useUpdateApplicant, useEmailParticipant, useDebounce } from '@/hooks';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types';
import { toastError, toastSuccess, toastConfirm, toastWarning } from '@/utils/toast';
import type { Allocation, ApplicantStatus } from '@/types';
import './Allocations.css';

export const Allocations: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<Set<string>>(new Set());
  const [sendingEmail, setSendingEmail] = useState<Set<string>>(new Set());
  const [sendingParticipantEmail, setSendingParticipantEmail] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    term: '',
    is_confirmed: undefined as boolean | undefined,
  });

  // Fetch allocations using TanStack Query
  // Use conditional query based on whether term filter is set
  const allocationsQuery = useAllocations(
    filters.term
      ? { year: filters.year, term: filters.term }
      : { year: filters.year, is_confirmed: filters.is_confirmed }
  );

  const { data: allocations = [], isLoading: loading } = allocationsQuery;

  // Debounce search query for client-side filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get unique applicant IDs for email status checks
  const uniqueApplicantIds = useMemo(() => {
    return Array.from(new Set(allocations.map(a => a.applicant_id)));
  }, [allocations]);

  // Fetch email status for all unique applicants in parallel
  const emailStatusQueries = useQueries({
    queries: uniqueApplicantIds.map((applicantId) => ({
      queryKey: ['can-email-participant', applicantId],
      queryFn: async () => {
        const { applicantService } = await import('@/services/applicantService');
        return applicantService.canEmailParticipant(applicantId);
      },
      enabled: uniqueApplicantIds.length > 0,
      staleTime: 10 * 1000, // Cache for 10 seconds
    })),
  });

  // Create email status map from queries
  const canEmailParticipant = useMemo(() => {
    const statusMap = new Map<string, { canEmail: boolean; reason?: string }>();
    
    emailStatusQueries.forEach((query, index) => {
      const applicantId = uniqueApplicantIds[index];
      if (!applicantId) return;
      
      if (query.data) {
        statusMap.set(applicantId, query.data);
      } else if (query.error) {
        statusMap.set(applicantId, { canEmail: false, reason: 'Unable to check email status' });
      }
    });
    
    return statusMap;
  }, [emailStatusQueries, uniqueApplicantIds]);

  // Mutations
  const updateAllocationMutation = useUpdateAllocation();
  const deleteAllocationMutation = useDeleteAllocation();
  const sendEmailMutation = useSendAllocationEmail();
  const updateApplicantMutation = useUpdateApplicant();
  const emailParticipantMutation = useEmailParticipant();

  const handleEmailParticipant = useCallback(async (applicantId: string, applicantName: string) => {
    const confirmed = await toastConfirm(
      `Send congratulatory email to ${applicantName} with confirmed supervisors CC'd?`
    );
    
    if (!confirmed) return;
    
    try {
      setSendingParticipantEmail(prev => new Set(prev).add(applicantId));
      const result = await emailParticipantMutation.mutateAsync(applicantId);
      toastSuccess(result.message || 'Email sent successfully!');
      // Query will automatically refetch due to invalidation in the mutation
    } catch (error: unknown) {
      logger.error('Error sending participant email:', error);
      toastError(`Failed to send email: ${getErrorMessage(error)}`);
    } finally {
      setSendingParticipantEmail(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicantId);
        return newSet;
      });
    }
  }, [emailParticipantMutation]);

  const getRoleBadgeVariant = useCallback((role: string) => {
    switch (role) {
      case 'DOS': return 'info';
      case 'CO_SUPERVISOR': return 'primary';
      case 'ADVISOR': return 'warning';
      default: return 'default';
    }
  }, []);

  const handleStatusUpdate = useCallback(async (applicantId: string, newStatus: ApplicantStatus, allocationId: string) => {
    if (!applicantId) {
      toastError('Applicant ID is missing');
      return;
    }
    try {
      setUpdatingStatus(prev => new Set(prev).add(allocationId));
      
      // Update applicant status
      await updateApplicantMutation.mutateAsync({ id: applicantId, data: { status: newStatus } });
      
      // Invalidate all allocations queries to ensure fresh data (this will trigger refetch)
      queryClient.invalidateQueries({ queryKey: ['allocations'], exact: false });
      
      // Force refetch allocations to get updated status from backend (backend cache is now invalidated)
      await allocationsQuery.refetch();
      
      toastSuccess(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (error: unknown) {
      logger.error('Error updating applicant status:', error);
      toastError(`Failed to update status: ${getErrorMessage(error)}`);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(allocationId);
        return newSet;
      });
    }
  }, [updateApplicantMutation, queryClient, allocationsQuery]);

  const handleConfirmAllocation = useCallback(async (allocationId: string) => {
    try {
      setConfirming(prev => new Set(prev).add(allocationId));
      await updateAllocationMutation.mutateAsync({ id: allocationId, data: { is_confirmed: true } });
      // Query will automatically refetch due to invalidation in the mutation
      toastSuccess('Allocation confirmed successfully. Staff supervision capacity has been updated.');
    } catch (error: unknown) {
      logger.error('Error confirming allocation:', error);
      toastError(`Failed to confirm allocation: ${getErrorMessage(error)}`);
    } finally {
      setConfirming(prev => {
        const newSet = new Set(prev);
        newSet.delete(allocationId);
        return newSet;
      });
    }
  }, [updateAllocationMutation]);

  const handleDelete = useCallback(async (allocationId: string, applicantName: string, staffName: string) => {
    const confirmed = await toastConfirm(
      `Are you sure you want to delete the allocation between "${applicantName}" and "${staffName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeleting(prev => new Set(prev).add(allocationId));
      await deleteAllocationMutation.mutateAsync(allocationId);
      // Query will automatically refetch due to invalidation in the mutation
      toastSuccess('Allocation deleted successfully');
    } catch (error: unknown) {
      logger.error('Error deleting allocation:', error);
      toastError(`Failed to delete allocation: ${getErrorMessage(error)}`);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(allocationId);
        return newSet;
      });
    }
  }, [deleteAllocationMutation]);

  const handleSendEmail = useCallback(async (allocationId: string) => {
    try {
      setSendingEmail(prev => new Set(prev).add(allocationId));
      await sendEmailMutation.mutateAsync(allocationId);
      // Query will automatically refetch due to invalidation in the mutation
      toastSuccess('Email sent successfully to supervisor');
    } catch (error: unknown) {
      logger.error('Error sending email:', error);
      toastError(`Failed to send email: ${getErrorMessage(error)}`);
      // Query will automatically refetch due to invalidation in the mutation
    } finally {
      setSendingEmail(prev => {
        const newSet = new Set(prev);
        newSet.delete(allocationId);
        return newSet;
      });
    }
  }, [sendEmailMutation]);

  const escapeCSV = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes by doubling them, and wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }, []);

  const handleExportCSV = useCallback(() => {
    if (allocations.length === 0) {
      toastWarning('No allocations to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Applicant Name',
      'Applicant Email',
      'Applicant Status',
      'Degree Type',
      'Intake Year',
      'Intake Term',
      'Staff Name',
      'Staff Email',
      'Staff School',
      'Role',
      'Match Score (%)',
      'Allocation Status',
      'Explanation',
      'Created At',
      'Confirmed At'
    ];

    // Helper function to format applicant status
    const formatApplicantStatus = (status?: string): string => {
      if (!status) return '';
      // Convert from enum format (e.g., "SUPERVISOR_CONTACTED") to readable format
      return status
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Convert allocations to CSV rows
    const rows = allocations.map(allocation => [
      escapeCSV(allocation.applicant_name || 'Unknown'),
      escapeCSV(allocation.applicant_email),
      escapeCSV(formatApplicantStatus(allocation.applicant_status)),
      escapeCSV(allocation.applicant_degree_type),
      escapeCSV(allocation.applicant_intake_year),
      escapeCSV(allocation.applicant_intake_term),
      escapeCSV(allocation.staff_name || 'Unknown'),
      escapeCSV(allocation.staff_email),
      escapeCSV(allocation.staff_school),
      escapeCSV(allocation.role),
      allocation.match_score ? (allocation.match_score * 100).toFixed(2) : '',
      escapeCSV(allocation.is_confirmed ? 'Confirmed' : 'Contacted'),
      escapeCSV(allocation.explanation),
      allocation.created_at ? escapeCSV(new Date(allocation.created_at).toLocaleString()) : '',
      allocation.confirmed_at ? escapeCSV(new Date(allocation.confirmed_at).toLocaleString()) : ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `allocations_${filters.year}${filters.term ? '_' + filters.term : ''}_${dateStr}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }, [allocations, filters]);

  // Filter allocations based on search query (using debounced query)
  const filteredAllocations = useMemo(() => {
    return allocations.filter(allocation => {
    if (!debouncedSearchQuery.trim()) return true;
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    
    // Search in applicant name
    const matchesApplicantName = allocation.applicant_name?.toLowerCase().includes(query);
    
    // Search in supervisor/staff name
    const matchesStaffName = allocation.staff_name?.toLowerCase().includes(query);
    
    // Search in status
    const statusText = allocation.applicant_status?.toLowerCase().replace(/_/g, ' ') || '';
    const matchesStatus = statusText.includes(query);
    
    // Search in degree type
    const matchesDegreeType = allocation.applicant_degree_type?.toLowerCase().includes(query);
    
    return matchesApplicantName || matchesStaffName || matchesStatus || matchesDegreeType;
  });
}, [allocations, debouncedSearchQuery]);

  // Group allocations by applicant_id (proposal) when there are multiple allocations for the same proposal
  // Optimized: Single pass instead of multiple passes
  const groupedAllocations = React.useMemo(() => {
    const groups = new Map<string, Allocation[]>();
    const ungrouped: Allocation[] = [];
    
    // Single pass: group allocations and identify which need grouping
    filteredAllocations.forEach(allocation => {
      const applicantId = allocation.applicant_id;
      const existing = groups.get(applicantId);
      
      if (existing) {
        // Already seen this applicant - add to group
        existing.push(allocation);
      } else {
        // First time seeing this applicant - start a new group
        groups.set(applicantId, [allocation]);
      }
    });
    
    // Second pass: separate grouped (count > 1) from ungrouped (count === 1)
    const grouped: Array<{ applicant_id: string; allocations: Allocation[] }> = [];
    
    groups.forEach((allocations, applicant_id) => {
      if (allocations.length > 1) {
        // Multiple allocations for this applicant - group them
        grouped.push({ applicant_id, allocations });
      } else {
        // Single allocation - add to ungrouped
        ungrouped.push(allocations[0]);
      }
    });

    return { grouped, ungrouped };
  }, [filteredAllocations]);

  return (
    <div className="allocations-page">
      <div className="page-header">
        <h1 className="h-hero">Allocations</h1>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || allocations.length === 0}>
          Export CSV
        </Button>
      </div>

      <div className="filters-section">
        <div className="filter-group" style={{ flex: '1', maxWidth: '400px' }}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name, supervisor, status, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div className="filter-group">
          <label>Year</label>
          <input
            type="number"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
          />
        </div>
        <div className="filter-group">
          <label>Term</label>
          <select
            value={filters.term}
            onChange={(e) => setFilters({ ...filters, term: e.target.value })}
          >
            <option value="">All</option>
            <option value="JAN">January</option>
            <option value="OCT">October</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.is_confirmed === undefined ? '' : filters.is_confirmed.toString()}
            onChange={(e) => setFilters({
              ...filters,
              is_confirmed: e.target.value === '' ? undefined : e.target.value === 'true'
            })}
          >
            <option value="">All</option>
            <option value="true">Confirmed</option>
            <option value="false">Contacted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : (
        <div className="allocations-list">
          {/* Render grouped allocations (multiple allocations per proposal) */}
          {groupedAllocations.grouped.map((group) => {
            const firstAllocation = group.allocations[0];
            return (
              <div key={group.applicant_id} className="proposal-group">
                <div className="proposal-group-header">
                  <div>
                    <h2 className="proposal-group-title">
                      {firstAllocation.applicant_name || 'Unknown Applicant'}
                    </h2>
                    {firstAllocation.applicant_degree_type && firstAllocation.applicant_intake_year && (
                      <p className="proposal-group-meta">
                        {firstAllocation.applicant_degree_type === 'PHD' ? '🔵 PHD' : firstAllocation.applicant_degree_type === 'MRES' ? '🟣 MRES' : firstAllocation.applicant_degree_type} • {firstAllocation.applicant_intake_term} {firstAllocation.applicant_intake_year}
                      </p>
                    )}
                    {firstAllocation.applicant_email && (
                      <p className="proposal-group-meta">
                        {firstAllocation.applicant_email}
                      </p>
                    )}
                  </div>
                  <Badge variant={firstAllocation.applicant_status === 'ACCEPTED' ? 'success' : firstAllocation.applicant_status === 'REJECTED' ? 'error' : 'default'}>
                    {firstAllocation.applicant_status?.replace(/_/g, ' ') || 'NEW'}
                  </Badge>
                </div>
                <div className="proposal-group-allocations">
                  {group.allocations.map((allocation) => (
                    <Card key={allocation.id} variant="elevated" className="allocation-card">
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
                                onClick={() => handleConfirmAllocation(allocation.id)}
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
                      {/* Email Status Section */}
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
                                  handleStatusUpdate(allocation.applicant_id, 'SUPERVISOR_CONTACTED', allocation.id);
                                } else {
                                  handleStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
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
                                  handleStatusUpdate(allocation.applicant_id, 'ACCEPTED', allocation.id);
                                } else {
                                  handleStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
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
                                  handleStatusUpdate(allocation.applicant_id, 'REJECTED', allocation.id);
                                } else {
                                  handleStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
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
                          onClick={() => handleSendEmail(allocation.id)}
                          disabled={sendingEmail.has(allocation.id) || !allocation.staff_email}
                          aria-label={!allocation.staff_email ? 'Staff member does not have an email address' : undefined}
                        >
                          {sendingEmail.has(allocation.id) ? 'Sending...' : '📧 Email Supervisor'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(
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
                      
                      {/* Email Participant Status Message */}
                      {canEmailParticipant.has(allocation.applicant_id) && !canEmailParticipant.get(allocation.applicant_id)?.canEmail && (
                        <div className="allocation-email-participant-section">
                          <div className="email-status-message" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                              ⓘ {canEmailParticipant.get(allocation.applicant_id)?.reason || 'Cannot send email'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Allocation Notes and Email Applicant Buttons */}
                      <div className="allocation-bottom-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pgro/allocations/${allocation.id}/notes`)}
                        >
                          📝 View Notes
                        </Button>
                        {canEmailParticipant.has(allocation.applicant_id) && canEmailParticipant.get(allocation.applicant_id)?.canEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEmailParticipant(
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
                  ))}
                </div>
              </div>
            );
          })}

          {/* Render ungrouped allocations (single allocation per proposal) */}
          {groupedAllocations.ungrouped.map((allocation) => (
            <Card key={allocation.id} variant="elevated" className="allocation-card">
              <div className="allocation-header">
                <div>
                  <h3>
                    {allocation.applicant_name || 'Unknown Applicant'}
                  </h3>
                  {allocation.applicant_degree_type && allocation.applicant_intake_year && (
                    <p className="allocation-meta">
                      {allocation.applicant_degree_type === 'PHD' ? '🔵 PHD' : allocation.applicant_degree_type === 'MRES' ? '🟣 MRES' : allocation.applicant_degree_type} • {allocation.applicant_intake_term} {allocation.applicant_intake_year}
                    </p>
                  )}
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
                        onClick={() => handleConfirmAllocation(allocation.id)}
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
              {/* Email Status Section */}
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
                          handleStatusUpdate(allocation.applicant_id, 'SUPERVISOR_CONTACTED', allocation.id);
                        } else {
                          handleStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
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
                          handleStatusUpdate(allocation.applicant_id, 'ACCEPTED', allocation.id);
                        } else {
                          handleStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
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
                          handleStatusUpdate(allocation.applicant_id, 'REJECTED', allocation.id);
                        } else {
                          handleStatusUpdate(allocation.applicant_id, 'NEW', allocation.id);
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
                  onClick={() => handleSendEmail(allocation.id)}
                  disabled={sendingEmail.has(allocation.id) || !allocation.staff_email}
                  aria-label={!allocation.staff_email ? 'Staff member does not have an email address' : undefined}
                >
                  {sendingEmail.has(allocation.id) ? 'Sending...' : ' Email Supervisor'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(
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
              
              {/* Email Participant Status Message */}
              {canEmailParticipant.has(allocation.applicant_id) && !canEmailParticipant.get(allocation.applicant_id)?.canEmail && (
                <div className="allocation-email-participant-section">
                  <div className="email-status-message" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                      ⓘ {canEmailParticipant.get(allocation.applicant_id)?.reason || 'Cannot send email'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Allocation Notes and Email Applicant Buttons */}
              <div className="allocation-bottom-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/pgro/allocations/${allocation.id}/notes`)}
                >
                   View Notes
                </Button>
                {canEmailParticipant.has(allocation.applicant_id) && canEmailParticipant.get(allocation.applicant_id)?.canEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmailParticipant(
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
          ))}
        </div>
      )}

      {!loading && allocations.length === 0 && (
        <div className="empty-state">
          <p>No allocations found matching the filters.</p>
        </div>
      )}

      {!loading && filteredAllocations.length === 0 && allocations.length > 0 && (
        <div className="empty-state">
          <p>No allocations found matching your search.</p>
        </div>
      )}
    </div>
  );
};

