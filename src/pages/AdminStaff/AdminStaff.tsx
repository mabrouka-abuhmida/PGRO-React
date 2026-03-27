/**
 * AdminStaff - Staff list & capacity view (Admin area)
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, SkeletonGrid } from '@/components';
import { useStaffList, useCreateStaff, useDebounce } from '@/hooks';
import { logger } from '@/utils/logger';
import { toastError } from '@/utils/toast';
import type { Staff, StaffCreate } from '@/types';
import './AdminStaff.css';

export const AdminStaff: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [staffFormData, setStaffFormData] = useState<StaffCreate>({
    full_name: '',
    email: '',
    role_title: '',
    school: '',
    research_group: '',
    can_be_dos: false,
    can_supervise_phd: true,
    can_supervise_mres: true,
    max_phd_supervisions: 5,
    max_mres_supervisions: 5,
    research_interests_text: '',
    methods_text: '',
    excluded_topics_text: '',
    active: true,
  });
  const [filters, setFilters] = useState({
    can_be_dos: undefined as boolean | undefined,
    keyword: '',
  });

  // Debounce keyword search for API calls
  const debouncedKeyword = useDebounce(filters.keyword, 300);

  // Fetch staff list using TanStack Query
  const { data: staffData, isLoading: loading } = useStaffList({
    can_be_dos: filters.can_be_dos,
    keyword: debouncedKeyword || undefined,
    page: 1,
    page_size: 100,
  });

  const staff = staffData?.items || [];

  // Create staff mutation
  const createStaffMutation = useCreateStaff();

  const handleOpenModal = () => {
    setShowModal(true);
    setStaffFormData({
      full_name: '',
      email: '',
      role_title: '',
      school: '',
      research_group: '',
      can_be_dos: false,
      can_supervise_phd: true,
      can_supervise_mres: true,
      max_phd_supervisions: 5,
      max_mres_supervisions: 5,
      research_interests_text: '',
      methods_text: '',
      excluded_topics_text: '',
      active: true,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Clean up empty strings to undefined for optional fields
      const submitData: StaffCreate = {
        full_name: staffFormData.full_name,
        email: staffFormData.email,
        role_title: staffFormData.role_title || undefined,
        school: staffFormData.school || undefined,
        research_group: staffFormData.research_group || undefined,
        can_be_dos: staffFormData.can_be_dos,
        can_supervise_phd: staffFormData.can_supervise_phd,
        can_supervise_mres: staffFormData.can_supervise_mres,
        max_phd_supervisions: staffFormData.max_phd_supervisions,
        max_mres_supervisions: staffFormData.max_mres_supervisions,
        research_interests_text: staffFormData.research_interests_text || undefined,
        methods_text: staffFormData.methods_text || undefined,
        excluded_topics_text: staffFormData.excluded_topics_text || undefined,
        active: staffFormData.active,
      };
      await createStaffMutation.mutateAsync(submitData);
      setShowModal(false);
      // Query will automatically refetch due to invalidation in the mutation
    } catch (error) {
      logger.error('Error creating staff member:', error);
      toastError('Failed to create staff member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCapacityStatus = (member: Staff) => {
    const phdAvailable = member.current_phd_supervisions < member.max_phd_supervisions;
    const mresAvailable = member.current_mres_supervisions < member.max_mres_supervisions;
    if (phdAvailable && mresAvailable) return { status: 'available', text: 'Available' };
    if (!phdAvailable && !mresAvailable) return { status: 'full', text: 'Full' };
    return { status: 'partial', text: 'Partial' };
  };

  return (
    <div className="admin-staff-page">
      <div className="page-header">
        <h1 className="h-hero">Staff Management</h1>
        <Button variant="primary" size="sm" onClick={handleOpenModal}>
          Add Staff Member
        </Button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Can be DoS</label>
          <select
            value={filters.can_be_dos === undefined ? '' : filters.can_be_dos.toString()}
            onChange={(e) => setFilters({
              ...filters,
              can_be_dos: e.target.value === '' ? undefined : e.target.value === 'true'
            })}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="staff-grid">
          {staff.map((member) => {
            const capacity = getCapacityStatus(member);
            return (
              <Link key={member.id} to={`/admin/staff/${member.id}`}>
                <Card variant="elevated" className="staff-card">
                  <div className="staff-card-header">
                    <h3 className="staff-name">{member.full_name}</h3>
                    {member.can_be_dos && <Badge variant="info">DoS</Badge>}
                  </div>
                  <div className="capacity-info">
                    <div className="capacity-item">
                      <span>🔵</span>
                      <span>PhD: {member.current_phd_supervisions}/{member.max_phd_supervisions}</span>
                    </div>
                    <div className="capacity-item">
                      <span>🟣</span>
                      <span>MRes: {member.current_mres_supervisions}/{member.max_mres_supervisions}</span>
                    </div>
                    <Badge
                      variant={
                        capacity.status === 'available' ? 'success' :
                        capacity.status === 'full' ? 'error' : 'warning'
                      }
                    >
                      {capacity.text}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && staff.length === 0 && (
        <div className="empty-state">
          <p>No staff members found matching the filters.</p>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="h-section">Add New Staff Member</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    required
                    value={staffFormData.full_name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, full_name: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role_title">Role Title</label>
                  <input
                    type="text"
                    id="role_title"
                    value={staffFormData.role_title}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role_title: e.target.value })}
                    placeholder="e.g., Professor, Lecturer"
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="school">School</label>
                  <input
                    type="text"
                    id="school"
                    value={staffFormData.school}
                    onChange={(e) => setStaffFormData({ ...staffFormData, school: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="research_group">Research Group</label>
                  <input
                    type="text"
                    id="research_group"
                    value={staffFormData.research_group}
                    onChange={(e) => setStaffFormData({ ...staffFormData, research_group: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="max_phd_supervisions">Max PhD Supervisions</label>
                  <input
                    type="number"
                    id="max_phd_supervisions"
                    min="0"
                    value={staffFormData.max_phd_supervisions}
                    onChange={(e) => setStaffFormData({ ...staffFormData, max_phd_supervisions: parseInt(e.target.value) || 0 })}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="max_mres_supervisions">Max MRes Supervisions</label>
                  <input
                    type="number"
                    id="max_mres_supervisions"
                    min="0"
                    value={staffFormData.max_mres_supervisions}
                    onChange={(e) => setStaffFormData({ ...staffFormData, max_mres_supervisions: parseInt(e.target.value) || 0 })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={staffFormData.can_be_dos}
                    onChange={(e) => setStaffFormData({ ...staffFormData, can_be_dos: e.target.checked })}
                    disabled={submitting}
                  />
                  {' '}Can be Director of Studies (DoS)
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={staffFormData.can_supervise_phd}
                      onChange={(e) => setStaffFormData({ ...staffFormData, can_supervise_phd: e.target.checked })}
                      disabled={submitting}
                    />
                    {' '}Can supervise PhD
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={staffFormData.can_supervise_mres}
                      onChange={(e) => setStaffFormData({ ...staffFormData, can_supervise_mres: e.target.checked })}
                      disabled={submitting}
                    />
                    {' '}Can supervise MRes
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={staffFormData.active}
                      onChange={(e) => setStaffFormData({ ...staffFormData, active: e.target.checked })}
                      disabled={submitting}
                    />
                    {' '}Active
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="research_interests_text">Research Interests</label>
                <textarea
                  id="research_interests_text"
                  rows={4}
                  value={staffFormData.research_interests_text}
                  onChange={(e) => setStaffFormData({ ...staffFormData, research_interests_text: e.target.value })}
                  placeholder="Describe research interests, areas of expertise..."
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="methods_text">Research Methods</label>
                <textarea
                  id="methods_text"
                  rows={3}
                  value={staffFormData.methods_text}
                  onChange={(e) => setStaffFormData({ ...staffFormData, methods_text: e.target.value })}
                  placeholder="Describe preferred research methods, methodologies..."
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="excluded_topics_text">Excluded Topics</label>
                <textarea
                  id="excluded_topics_text"
                  rows={2}
                  value={staffFormData.excluded_topics_text}
                  onChange={(e) => setStaffFormData({ ...staffFormData, excluded_topics_text: e.target.value })}
                  placeholder="Topics or areas this staff member does not supervise..."
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

