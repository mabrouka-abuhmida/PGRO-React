/**
 * StaffDetail - Staff profile edit/view page
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, TagList } from '@/components';
import { staffService } from '@/services/staffService';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types';
import { toastError, toastSuccess, toastConfirm } from '@/utils/toast';
import type { Staff, StaffUpdate } from '@/types';
import './StaffDetail.css';

export const StaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<StaffUpdate>({});
  const [deleting, setDeleting] = useState(false);

  const loadStaff = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await staffService.get(id);
      setStaff(data);
      setFormData({
        full_name: data.full_name,
        email: data.email,
        role_title: data.role_title,
        school: data.school,
        research_group: data.research_group,
        can_be_dos: data.can_be_dos,
        can_supervise_phd: data.can_supervise_phd,
        can_supervise_mres: data.can_supervise_mres,
        max_phd_supervisions: data.max_phd_supervisions,
        max_mres_supervisions: data.max_mres_supervisions,
        research_interests_text: data.research_interests_text,
        methods_text: data.methods_text,
        keywords: data.keywords,
      });
    } catch (error) {
      logger.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadStaff();
    }
  }, [id, loadStaff]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await staffService.update(id, formData);
      await loadStaff();
      setEditing(false);
    } catch (error) {
      logger.error('Error updating staff:', error);
    }
  };

  const handleDelete = async () => {
    if (!id || !staff) return;
    
    const confirmed = await toastConfirm(
      `Are you sure you want to permanently delete "${staff.full_name}"?\n\n` +
      `This will DELETE:\n` +
      `- The staff member record\n` +
      `- All allocations for this staff member\n` +
      `- All match recommendations for this staff member\n` +
      `- All supervision load events for this staff member\n\n` +
      `This action CANNOT be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeleting(true);
      await staffService.delete(id);
      toastSuccess('Staff member and all related data deleted successfully');
      navigate('/staff');
    } catch (error: unknown) {
      logger.error('Error deleting staff:', error);
      toastError(`Failed to delete staff member: ${getErrorMessage(error)}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading staff member...</div>;
  }

  if (!staff) {
    return <div className="error">Staff member not found</div>;
  }

  return (
    <div className="staff-detail">
      <div className="detail-header">
        <Link to="/staff">
          <Button variant="text">← Back to Staff</Button>
        </Link>
        <div className="header-actions">
          {!editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDelete} 
                disabled={deleting}
                className="btn-delete"
              >
                {deleting ? 'Deleting...' : 'Delete Staff'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); loadStaff(); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Card variant="elevated" className="staff-info-card">
        <div className="card-header">
          <h1 className="staff-title">{staff.full_name}</h1>
          <div className="header-badges">
            {staff.can_be_dos && <Badge variant="info">DoS Eligible</Badge>}
            {staff.active ? <Badge variant="success">Active</Badge> : <Badge variant="error">Inactive</Badge>}
          </div>
        </div>

        {editing ? (
          <div className="edit-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role Title</label>
              <input
                type="text"
                value={formData.role_title || ''}
                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>School</label>
              <input
                type="text"
                value={formData.school || ''}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Research Group</label>
              <input
                type="text"
                value={formData.research_group || ''}
                onChange={(e) => setFormData({ ...formData, research_group: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Research Interests</label>
              <textarea
                rows={4}
                value={formData.research_interests_text || ''}
                onChange={(e) => setFormData({ ...formData, research_interests_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Methods</label>
              <textarea
                rows={4}
                value={formData.methods_text || ''}
                onChange={(e) => setFormData({ ...formData, methods_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Max PhD Supervisions</label>
              <input
                type="number"
                min="0"
                value={formData.max_phd_supervisions || 0}
                onChange={(e) => setFormData({ ...formData, max_phd_supervisions: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Max MRes Supervisions</label>
              <input
                type="number"
                min="0"
                value={formData.max_mres_supervisions || 0}
                onChange={(e) => setFormData({ ...formData, max_mres_supervisions: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.can_be_dos || false}
                  onChange={(e) => setFormData({ ...formData, can_be_dos: e.target.checked })}
                />
                Can be Director of Studies
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.can_supervise_phd ?? false}
                  onChange={(e) => setFormData({ ...formData, can_supervise_phd: e.target.checked })}
                />
                Can Supervise PhD
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.can_supervise_mres ?? false}
                  onChange={(e) => setFormData({ ...formData, can_supervise_mres: e.target.checked })}
                />
                Can Supervise MRes
              </label>
            </div>
          </div>
        ) : (
          <div className="info-sections">
            <div className="info-section">
              <h2 className="h-section">Contact Information</h2>
              <div className="info-grid">
                <div><strong>Email:</strong> {staff.email}</div>
                {staff.role_title && <div><strong>Role:</strong> {staff.role_title}</div>}
                {staff.school && <div><strong>School:</strong> {staff.school}</div>}
                {staff.research_group && <div><strong>Research Group:</strong> {staff.research_group}</div>}
              </div>
            </div>

            <div className="info-section">
              <h2 className="h-section">Supervision Capacity</h2>
              <div className="capacity-grid">
                <div className="capacity-card">
                  <strong>PhD</strong>
                  <p>{staff.current_phd_supervisions} / {staff.max_phd_supervisions}</p>
                </div>
                <div className="capacity-card">
                  <strong>MRes</strong>
                  <p>{staff.current_mres_supervisions} / {staff.max_mres_supervisions}</p>
                </div>
              </div>
            </div>

            {staff.research_interests_text && (
              <div className="info-section">
                <h2 className="h-section">Research Interests</h2>
                <p className="body">{staff.research_interests_text}</p>
              </div>
            )}

            {staff.methods_text && (
              <div className="info-section">
                <h2 className="h-section">Methods</h2>
                <p className="body">{staff.methods_text}</p>
              </div>
            )}

            {staff.keywords && staff.keywords.length > 0 && (
              <div className="info-section">
                <h2 className="h-section">Keywords</h2>
                <TagList tags={staff.keywords} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

