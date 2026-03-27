/**
 * ProfileModal - Modal component for viewing and editing applicant profile
 */
import React, { useState, useEffect, useCallback } from 'react';
import { applicantService } from '@/services/applicantService';
import { logger } from '@/utils/logger';
import { toastError, toastSuccess, toastConfirm } from '@/utils/toast';
import { useModal } from '@/hooks/useModal';
import { getErrorMessage } from '@/types';
import type { ApplicantDegree } from '@/types';
import './ProfileModal.css';

interface ProfileModalProps {
  applicantId: string;
  applicantName: string;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

interface ProfileData {
  email?: string;
  date_of_birth?: string;
  nationality?: string;
  country_of_residence?: string;
  phone_number?: string;
  address?: string;
  how_heard_about_usw?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  applicantId,
  applicantName,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({});
  const [degrees, setDegrees] = useState<ApplicantDegree[]>([]);
  const [editingDegree, setEditingDegree] = useState<ApplicantDegree | null>(null);
  const [showDegreeForm, setShowDegreeForm] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await applicantService.getProfile(applicantId);
      setProfile({
        email: data.email || '',
        date_of_birth: data.profile?.date_of_birth || '',
        nationality: data.profile?.nationality || '',
        country_of_residence: data.profile?.country_of_residence || '',
        phone_number: data.profile?.phone_number || '',
        address: data.profile?.address || '',
        how_heard_about_usw: data.profile?.how_heard_about_usw || '',
      });
      // Add applicant_id to degrees and ensure required fields are present
      setDegrees((data.degrees || []).map(degree => ({
        ...degree,
        applicant_id: data.applicant_id,
        created_at: degree.created_at || new Date().toISOString(),
        updated_at: degree.updated_at || new Date().toISOString(),
      })));
    } catch (error) {
      logger.error('Error loading profile:', error);
      toastError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    if (isOpen && applicantId) {
      loadProfile();
    }
  }, [isOpen, applicantId, loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await applicantService.updateProfile(applicantId, profile);
      toastSuccess('Profile updated successfully');
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      onClose();
    } catch (error: unknown) {
      logger.error('Error saving profile:', error);
      toastError(`Failed to save profile: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDegree = () => {
    setEditingDegree(null);
    setShowDegreeForm(true);
  };

  const handleEditDegree = (degree: ApplicantDegree) => {
    setEditingDegree(degree);
    setShowDegreeForm(true);
  };

  const handleDeleteDegree = async (degreeId: string) => {
    const confirmed = await toastConfirm('Are you sure you want to delete this degree?');
    if (!confirmed) {
      return;
    }
    try {
      await applicantService.deleteDegree(applicantId, degreeId);
      await loadProfile();
    } catch (error: unknown) {
      logger.error('Error deleting degree:', error);
      toastError('Failed to delete degree');
    }
  };

  const handleSaveDegree = async (degreeData: Partial<ApplicantDegree>) => {
    try {
      if (editingDegree) {
        await applicantService.updateDegree(applicantId, editingDegree.id, degreeData);
      } else {
        await applicantService.createDegree(applicantId, {
          degree_type: degreeData.degree_type || '',
          subject_area: degreeData.subject_area,
          university: degreeData.university,
          university_country: degreeData.university_country,
          classification: degreeData.classification,
          year_completed: degreeData.year_completed,
        });
      }
      setShowDegreeForm(false);
      setEditingDegree(null);
      await loadProfile();
    } catch (error: unknown) {
      logger.error('Error saving degree:', error);
      toastError('Failed to save degree');
    }
  };

  const { handleOverlayClick } = useModal({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2 id="profile-modal-title">Profile: {applicantName}</h2>
          <button className="profile-modal-close" onClick={onClose} aria-label="Close profile modal">×</button>
        </div>

        {loading ? (
          <div className="profile-modal-loading">Loading profile...</div>
        ) : (
          <div className="profile-modal-body">
            {/* Personal Information Section */}
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="profile-form">
                <div className="profile-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="profile-form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={profile.date_of_birth || ''}
                    onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="profile-form-group">
                  <label>Nationality</label>
                  <input
                    type="text"
                    value={profile.nationality || ''}
                    onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                    placeholder="e.g., British, American"
                  />
                </div>
                <div className="profile-form-group">
                  <label>Country of Residence</label>
                  <input
                    type="text"
                    value={profile.country_of_residence || ''}
                    onChange={(e) => setProfile({ ...profile, country_of_residence: e.target.value })}
                    placeholder="e.g., United Kingdom, United States"
                  />
                </div>
                <div className="profile-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone_number || ''}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    placeholder="+44 1234 567890"
                  />
                </div>
                <div className="profile-form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="e.g., 123 Example Street, Example City, Postcode"
                  />
                </div>
                <div className="profile-form-group">
                  <label>How Heard About USW</label>
                  <input
                    type="text"
                    value={profile.how_heard_about_usw || ''}
                    onChange={(e) => setProfile({ ...profile, how_heard_about_usw: e.target.value })}
                    placeholder="e.g., Website, Friend, Conference"
                  />
                </div>
              </div>
            </div>

            {/* Degrees Section */}
            <div className="profile-section">
              <div className="profile-section-header">
                <h3>Educational Qualifications</h3>
                <button className="btn-add-degree" onClick={handleAddDegree}>+ Add Degree</button>
              </div>
              
              {showDegreeForm && (
                <DegreeForm
                  degree={editingDegree}
                  onSave={handleSaveDegree}
                  onCancel={() => {
                    setShowDegreeForm(false);
                    setEditingDegree(null);
                  }}
                />
              )}

              {degrees.length === 0 ? (
                <p className="profile-empty">No degrees recorded</p>
              ) : (
                <div className="degrees-list">
                  {degrees.map((degree) => (
                    <DegreeCard
                      key={degree.id}
                      degree={degree}
                      onEdit={() => handleEditDegree(degree)}
                      onDelete={() => handleDeleteDegree(degree.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="profile-modal-footer">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface DegreeFormProps {
  degree?: ApplicantDegree | null;
  onSave: (data: Partial<ApplicantDegree>) => void;
  onCancel: () => void;
}

const DegreeForm: React.FC<DegreeFormProps> = ({ degree, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ApplicantDegree>>({
    degree_type: degree?.degree_type || '',
    subject_area: degree?.subject_area || '',
    university: degree?.university || '',
    university_country: degree?.university_country || '',
    classification: degree?.classification || '',
    year_completed: degree?.year_completed || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="degree-form" onSubmit={handleSubmit}>
      <div className="degree-form-row">
        <div className="degree-form-group">
          <label>Degree Type *</label>
          <input
            type="text"
            value={formData.degree_type || ''}
            onChange={(e) => setFormData({ ...formData, degree_type: e.target.value })}
            placeholder="e.g., BSc, MSc, PhD"
            required
          />
        </div>
        <div className="degree-form-group">
          <label>Subject Area</label>
          <input
            type="text"
            value={formData.subject_area || ''}
            onChange={(e) => setFormData({ ...formData, subject_area: e.target.value })}
            placeholder="e.g., Computer Science"
          />
        </div>
      </div>
      <div className="degree-form-row">
        <div className="degree-form-group">
          <label>University</label>
          <input
            type="text"
            value={formData.university || ''}
            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            placeholder="e.g., University of South Wales"
          />
        </div>
        <div className="degree-form-group">
          <label>University Country</label>
          <input
            type="text"
            value={formData.university_country || ''}
            onChange={(e) => setFormData({ ...formData, university_country: e.target.value })}
            placeholder="e.g., United Kingdom"
          />
        </div>
      </div>
      <div className="degree-form-row">
        <div className="degree-form-group">
          <label>Classification/Grade</label>
          <input
            type="text"
            value={formData.classification || ''}
            onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
            placeholder="e.g., First Class, 3.8 GPA"
          />
        </div>
        <div className="degree-form-group">
          <label>Year Completed</label>
          <input
            type="number"
            value={formData.year_completed || ''}
            onChange={(e) => setFormData({ ...formData, year_completed: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g., 2020"
            min="1900"
            max="2100"
          />
        </div>
      </div>
      <div className="degree-form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-save">Save Degree</button>
      </div>
    </form>
  );
};

interface DegreeCardProps {
  degree: ApplicantDegree;
  onEdit: () => void;
  onDelete: () => void;
}

const DegreeCard: React.FC<DegreeCardProps> = ({ degree, onEdit, onDelete }) => {
  return (
    <div className="degree-card">
      <div className="degree-card-content">
        <div className="degree-card-header">
          <strong>{degree.degree_type}</strong>
          {degree.subject_area && <span className="degree-subject">{degree.subject_area}</span>}
        </div>
        {degree.university && (
          <div className="degree-detail">
            <span className="degree-label">University:</span> {degree.university}
            {degree.university_country && `, ${degree.university_country}`}
          </div>
        )}
        {(degree.classification || degree.year_completed) && (
          <div className="degree-detail">
            {degree.classification && (
              <span><span className="degree-label">Grade:</span> {degree.classification}</span>
            )}
            {degree.classification && degree.year_completed && ' • '}
            {degree.year_completed && (
              <span><span className="degree-label">Year:</span> {degree.year_completed}</span>
            )}
          </div>
        )}
      </div>
      <div className="degree-card-actions">
        <button className="btn-edit" onClick={onEdit}>Edit</button>
        <button className="btn-delete-small" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

