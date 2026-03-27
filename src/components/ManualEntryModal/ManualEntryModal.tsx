/**
 * ManualEntryModal - Modal for manually creating applicants
 */
import React, { useState } from 'react';
import { Button } from '@/components';
import { useCreateApplicant } from '@/hooks';
import { logger } from '@/utils/logger';
import { toastError, toastWarning, toastConfirm } from '@/utils/toast';
import type { DegreeType, ApplicantCreate, ApplicantProfile } from '@/types';
import './ManualEntryModal.css';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DegreeFormData {
  degree_type: string;
  subject_area: string;
  university: string;
  university_country: string;
  classification: string;
  year_completed: number | '';
}

interface ManualFormData {
  full_name: string;
  email: string;
  degree_type: DegreeType;
  intake_term: string;
  intake_year: number;
  raw_application_text: string;
  profile: {
    date_of_birth: string;
    nationality: string;
    country_of_residence: string;
    phone_number: string;
  };
  degrees: Array<{
    degree_type: string;
    subject_area: string;
    university: string;
    university_country: string;
    classification: string;
    year_completed: number | '';
  }>;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createApplicantMutation = useCreateApplicant();
  
  const [submitting, setSubmitting] = useState(false);
  const [manualFormData, setManualFormData] = useState<ManualFormData>({
    full_name: '',
    email: '',
    degree_type: 'PHD',
    intake_term: 'OCT',
    intake_year: new Date().getFullYear(),
    raw_application_text: '',
    profile: {
      date_of_birth: '',
      nationality: '',
      country_of_residence: '',
      phone_number: '',
    },
    degrees: [],
  });
  const [showDegreeForm, setShowDegreeForm] = useState(false);
  const [editingDegreeIndex, setEditingDegreeIndex] = useState<number | null>(null);
  const [degreeFormData, setDegreeFormData] = useState<DegreeFormData>({
    degree_type: '',
    subject_area: '',
    university: '',
    university_country: '',
    classification: '',
    year_completed: '',
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setManualFormData({
      full_name: '',
      email: '',
      degree_type: 'PHD',
      intake_term: 'OCT',
      intake_year: new Date().getFullYear(),
      raw_application_text: '',
      profile: {
        date_of_birth: '',
        nationality: '',
        country_of_residence: '',
        phone_number: '',
      },
      degrees: [],
    });
    setShowDegreeForm(false);
    setEditingDegreeIndex(null);
    setDegreeFormData({
      degree_type: '',
      subject_area: '',
      university: '',
      university_country: '',
      classification: '',
      year_completed: '',
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Build profile data (only include if at least one field is filled)
      const profileData: Partial<ApplicantProfile> = {};
      if (manualFormData.profile.date_of_birth) profileData.date_of_birth = manualFormData.profile.date_of_birth;
      if (manualFormData.profile.nationality) profileData.nationality = manualFormData.profile.nationality;
      if (manualFormData.profile.country_of_residence) profileData.country_of_residence = manualFormData.profile.country_of_residence;
      if (manualFormData.profile.phone_number) profileData.phone_number = manualFormData.profile.phone_number;
      
      // Build degrees data (only include degrees with degree_type)
      const degreesData = manualFormData.degrees
        .filter(d => d.degree_type)
        .map(d => ({
          degree_type: d.degree_type,
          subject_area: d.subject_area || undefined,
          university: d.university || undefined,
          university_country: d.university_country || undefined,
          classification: d.classification || undefined,
          year_completed: d.year_completed || undefined,
        }));
      
      const applicantData: ApplicantCreate = {
        full_name: manualFormData.full_name,
        email: manualFormData.email || undefined,
        degree_type: manualFormData.degree_type,
        intake_term: manualFormData.intake_term,
        intake_year: manualFormData.intake_year,
        raw_application_text: manualFormData.raw_application_text,
        profile: Object.keys(profileData).length > 0 ? profileData : undefined,
        degrees: degreesData.length > 0 ? degreesData : undefined,
      };
      
      await createApplicantMutation.mutateAsync(applicantData);
      handleClose();
      onSuccess();
    } catch (error) {
      logger.error('Error creating applicant:', error);
      toastError('Failed to create applicant. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDegree = () => {
    setEditingDegreeIndex(null);
    setDegreeFormData({
      degree_type: '',
      subject_area: '',
      university: '',
      university_country: '',
      classification: '',
      year_completed: '',
    });
    setShowDegreeForm(true);
  };

  const handleEditDegree = (index: number) => {
    setEditingDegreeIndex(index);
    setDegreeFormData(manualFormData.degrees[index]);
    setShowDegreeForm(true);
  };

  const handleDeleteDegree = async (index: number) => {
    const confirmed = await toastConfirm('Are you sure you want to remove this degree?');
    if (confirmed) {
      setManualFormData({
        ...manualFormData,
        degrees: manualFormData.degrees.filter((_, i) => i !== index),
      });
    }
  };

  const handleSaveDegree = () => {
    if (!degreeFormData.degree_type) {
      toastWarning('Degree type is required');
      return;
    }
    
    if (editingDegreeIndex !== null) {
      // Update existing degree
      const newDegrees = [...manualFormData.degrees];
      newDegrees[editingDegreeIndex] = degreeFormData;
      setManualFormData({ ...manualFormData, degrees: newDegrees });
    } else {
      // Add new degree
      setManualFormData({
        ...manualFormData,
        degrees: [...manualFormData.degrees, degreeFormData],
      });
    }
    
    setShowDegreeForm(false);
    setEditingDegreeIndex(null);
    setDegreeFormData({
      degree_type: '',
      subject_area: '',
      university: '',
      university_country: '',
      classification: '',
      year_completed: '',
    });
  };

  const handleCancelDegree = () => {
    setShowDegreeForm(false);
    setEditingDegreeIndex(null);
    setDegreeFormData({
      degree_type: '',
      subject_area: '',
      university: '',
      university_country: '',
      classification: '',
      year_completed: '',
    });
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 className="h-section">Add New Applicant</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              type="text"
              id="full_name"
              required
              value={manualFormData.full_name}
              onChange={(e) => setManualFormData({ ...manualFormData, full_name: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={manualFormData.email}
              onChange={(e) => setManualFormData({ ...manualFormData, email: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="manual_degree_type">Degree Type *</label>
              <select
                id="manual_degree_type"
                required
                value={manualFormData.degree_type}
                onChange={(e) => setManualFormData({ ...manualFormData, degree_type: e.target.value as DegreeType })}
                disabled={submitting}
              >
                <option value="PHD">PhD</option>
                <option value="MRES">MRes</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="manual_intake_term">Intake Term</label>
              <select
                id="manual_intake_term"
                value={manualFormData.intake_term}
                onChange={(e) => setManualFormData({ ...manualFormData, intake_term: e.target.value })}
                disabled={submitting}
              >
                <option value="JAN">January</option>
                <option value="OCT">October</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="manual_intake_year">Intake Year</label>
              <input
                type="number"
                id="manual_intake_year"
                value={manualFormData.intake_year}
                onChange={(e) => setManualFormData({ ...manualFormData, intake_year: parseInt(e.target.value) })}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="raw_application_text">Application Text *</label>
            <textarea
              id="raw_application_text"
              required
              rows={8}
              value={manualFormData.raw_application_text}
              onChange={(e) => setManualFormData({ ...manualFormData, raw_application_text: e.target.value })}
              placeholder="Paste or type the applicant's application text here..."
              disabled={submitting}
            />
          </div>

          {/* Profile Section */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '16px', fontWeight: 600 }}>Personal Information (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  value={manualFormData.profile.date_of_birth}
                  onChange={(e) => setManualFormData({
                    ...manualFormData,
                    profile: { ...manualFormData.profile, date_of_birth: e.target.value }
                  })}
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="tel"
                  id="phone_number"
                  value={manualFormData.profile.phone_number}
                  onChange={(e) => setManualFormData({
                    ...manualFormData,
                    profile: { ...manualFormData.profile, phone_number: e.target.value }
                  })}
                  placeholder="+44 1234 567890"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nationality">Nationality</label>
                <input
                  type="text"
                  id="nationality"
                  value={manualFormData.profile.nationality}
                  onChange={(e) => setManualFormData({
                    ...manualFormData,
                    profile: { ...manualFormData.profile, nationality: e.target.value }
                  })}
                  placeholder="e.g., British, American"
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country_of_residence">Country of Residence</label>
                <input
                  type="text"
                  id="country_of_residence"
                  value={manualFormData.profile.country_of_residence}
                  onChange={(e) => setManualFormData({
                    ...manualFormData,
                    profile: { ...manualFormData.profile, country_of_residence: e.target.value }
                  })}
                  placeholder="e.g., United Kingdom, United States"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Degrees Section */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Educational Qualifications (Optional)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDegree}
                disabled={submitting || showDegreeForm}
              >
                + Add Degree
              </Button>
            </div>

            {showDegreeForm && (
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Degree Type *</label>
                    <input
                      type="text"
                      value={degreeFormData.degree_type}
                      onChange={(e) => setDegreeFormData({ ...degreeFormData, degree_type: e.target.value })}
                      placeholder="e.g., BSc, MSc, PhD"
                      disabled={submitting}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject Area</label>
                    <input
                      type="text"
                      value={degreeFormData.subject_area}
                      onChange={(e) => setDegreeFormData({ ...degreeFormData, subject_area: e.target.value })}
                      placeholder="e.g., Computer Science"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>University</label>
                    <input
                      type="text"
                      value={degreeFormData.university}
                      onChange={(e) => setDegreeFormData({ ...degreeFormData, university: e.target.value })}
                      placeholder="e.g., University of South Wales"
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>University Country</label>
                    <input
                      type="text"
                      value={degreeFormData.university_country}
                      onChange={(e) => setDegreeFormData({ ...degreeFormData, university_country: e.target.value })}
                      placeholder="e.g., United Kingdom"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Classification/Grade</label>
                    <input
                      type="text"
                      value={degreeFormData.classification}
                      onChange={(e) => setDegreeFormData({ ...degreeFormData, classification: e.target.value })}
                      placeholder="e.g., First Class, 3.8 GPA"
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Year Completed</label>
                    <input
                      type="number"
                      value={degreeFormData.year_completed}
                      onChange={(e) => setDegreeFormData({ ...degreeFormData, year_completed: e.target.value ? parseInt(e.target.value) : '' })}
                      placeholder="e.g., 2020"
                      min="1900"
                      max="2100"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <Button type="button" variant="outline" size="sm" onClick={handleCancelDegree} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" size="sm" onClick={handleSaveDegree} disabled={submitting}>
                    Save Degree
                  </Button>
                </div>
              </div>
            )}

            {manualFormData.degrees.length === 0 && !showDegreeForm && (
              <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '16px', textAlign: 'center' }}>
                No degrees added yet
              </p>
            )}

            {manualFormData.degrees.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {manualFormData.degrees.map((degree, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f9fafb' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <strong>{degree.degree_type}</strong>
                        {degree.subject_area && <span style={{ color: '#6b7280', fontSize: '14px' }}>{degree.subject_area}</span>}
                      </div>
                      {degree.university && (
                        <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                          <span style={{ fontWeight: 500 }}>University:</span> {degree.university}
                          {degree.university_country && `, ${degree.university_country}`}
                        </div>
                      )}
                      {(degree.classification || degree.year_completed) && (
                        <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                          {degree.classification && <span><span style={{ fontWeight: 500 }}>Grade:</span> {degree.classification}</span>}
                          {degree.classification && degree.year_completed && ' • '}
                          {degree.year_completed && <span><span style={{ fontWeight: 500 }}>Year:</span> {degree.year_completed}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleEditDegree(index)}
                        disabled={submitting || showDegreeForm}
                        style={{ fontSize: '13px', padding: '6px 12px' }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDeleteDegree(index)}
                        disabled={submitting || showDegreeForm}
                        style={{ fontSize: '13px', padding: '6px 12px', color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Applicant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

