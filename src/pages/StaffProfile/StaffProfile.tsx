/**
 * StaffProfile - Staff profile edit/view page (identical to PGRO StaffDetail)
 */
import React, { useEffect, useState } from 'react';
import { useStaff } from '@/contexts/StaffContext';
import { Card, Badge, Button, TagList } from '@/components';
import { staffService } from '@/services/staffService';
import { logger } from '@/utils/logger';
import type { Staff, StaffUpdate } from '@/types';
import './StaffProfile.css';

export const StaffProfile: React.FC = () => {
  const { currentStaff, refreshStaff } = useStaff();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<StaffUpdate>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentStaff) {
      setStaff(currentStaff);
      setFormData({
        full_name: currentStaff.full_name,
        email: currentStaff.email,
        role_title: currentStaff.role_title,
        school: currentStaff.school,
        research_group: currentStaff.research_group,
        can_be_dos: currentStaff.can_be_dos,
        can_supervise_phd: currentStaff.can_supervise_phd,
        can_supervise_mres: currentStaff.can_supervise_mres,
        max_phd_supervisions: currentStaff.max_phd_supervisions,
        max_mres_supervisions: currentStaff.max_mres_supervisions,
        research_interests_text: currentStaff.research_interests_text,
        methods_text: currentStaff.methods_text,
        keywords: currentStaff.keywords,
      });
      setLoading(false);
    }
  }, [currentStaff]);

  const handleSave = async () => {
    if (!staff) return;
    try {
      setSaving(true);
      await staffService.update(staff.id, formData);
      await refreshStaff();
      setEditing(false);
    } catch (error) {
      logger.error('Error updating staff:', error);
    } finally {
      setSaving(false);
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
        <div className="header-actions">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); if (currentStaff) { setFormData({ full_name: currentStaff.full_name, email: currentStaff.email, role_title: currentStaff.role_title, school: currentStaff.school, research_group: currentStaff.research_group, can_be_dos: currentStaff.can_be_dos, can_supervise_phd: currentStaff.can_supervise_phd, can_supervise_mres: currentStaff.can_supervise_mres, max_phd_supervisions: currentStaff.max_phd_supervisions, max_mres_supervisions: currentStaff.max_mres_supervisions, research_interests_text: currentStaff.research_interests_text, methods_text: currentStaff.methods_text, keywords: currentStaff.keywords }); } }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
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
