/**
 * StaffReviewForm - Review form component matching the Word template
 */
import React from 'react';
import type { StaffReviewCreate } from '@/services/staffReviewService';
import './StaffReview.css';
import { staffService } from '@/services/staffService';
import { logger } from '@/utils/logger';
import type { Staff } from '@/types';

interface StaffReviewFormProps {
  formData: StaffReviewCreate;
  isSubmitted: boolean;
  applicantName: string;
  reviewerName: string;
  onInputChange: (field: keyof StaffReviewCreate, value: string | boolean | null | undefined) => void;
}

export const StaffReviewForm: React.FC<StaffReviewFormProps> = ({
  formData,
  isSubmitted,
  applicantName,
  reviewerName,
  onInputChange,
}) => {
  const [staffList, setStaffList] = React.useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = React.useState(false);

  // Load staff list when component mounts
  React.useEffect(() => {
    if (formData.prepared_to_supervise === false) {
      loadStaffList();
    }
  }, [formData.prepared_to_supervise]);

  const loadStaffList = async () => {
    try {
      setLoadingStaff(true);
      const response = await staffService.list({ active: true });
      setStaffList(response.items || []);
    } catch (error) {
      logger.error('Error loading staff list:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleYesNoChange = (field: keyof StaffReviewCreate, value: boolean | null) => {
    onInputChange(field, value);
  };

  // Parse selected staff from comma-separated string
  const selectedStaffIds = formData.suggested_supervisors 
    ? formData.suggested_supervisors.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  return (
    <div className="review-form">
      {/* Header Section */}
      <div className="form-section form-header-section">
        <h4 className="form-section-title">Review Form for MPhil/PhD/Professional Doctorates/Masters by Research</h4>
        <p className="form-note">Faculty Research Degrees Committee (FRDC)</p>
        <p className="form-note" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
          Please note this review should be completed jointly after the reviewers have discussed the proposal
        </p>
      </div>

      {/* Reviewer and Applicant Info */}
      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name of Reviewer</label>
            <input
              type="text"
              className="form-input"
              value={formData.reviewer_name || reviewerName || ''}
              onChange={(e) => onInputChange('reviewer_name', e.target.value)}
              disabled={isSubmitted}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Applicant's Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.applicant_name_review || applicantName || ''}
              onChange={(e) => onInputChange('applicant_name_review', e.target.value)}
              disabled={isSubmitted}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.review_date || ''}
              onChange={(e) => onInputChange('review_date', e.target.value)}
              disabled={isSubmitted}
            />
          </div>
        </div>
      </div>

      {/* Yes/No Questions Section */}
      <div className="form-section">
        <h4 className="form-section-title">Please mark your options:</h4>
        
        <div className="yes-no-questions">
          <YesNoQuestion
            label="1. The quality of the research question is acceptable"
            value={formData.research_question_acceptable}
            onChange={(value) => handleYesNoChange('research_question_acceptable', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="2. The quality of the research framework is acceptable"
            value={formData.research_framework_acceptable}
            onChange={(value) => handleYesNoChange('research_framework_acceptable', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="3. The quality of the writing and the structure of the proposal is acceptable"
            value={formData.writing_structure_acceptable}
            onChange={(value) => handleYesNoChange('writing_structure_acceptable', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="4. The proposal makes a clear contribution to the field and is likely to contribute to future research"
            value={formData.contribution_to_field}
            onChange={(value) => handleYesNoChange('contribution_to_field', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="5. Would you recommend this proposal for supervision within the Faculty?"
            value={formData.recommend_for_supervision}
            onChange={(value) => handleYesNoChange('recommend_for_supervision', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="6. Would you be prepared to supervise this applicant?"
            value={formData.prepared_to_supervise}
            onChange={(value) => handleYesNoChange('prepared_to_supervise', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="7. Is there a sufficient grasp of ethics within the proposal?"
            value={formData.sufficient_ethics}
            onChange={(value) => handleYesNoChange('sufficient_ethics', value)}
            disabled={isSubmitted}
          />
        </div>

        {/* Question 8 - Conditional on Question 6 */}
        {formData.prepared_to_supervise === false && (
          <div className="form-section conditional-question">
            <label className="form-label">
              8. If you said No to 6, could you please suggest some who might be interested?
            </label>
            {loadingStaff ? (
              <div style={{ padding: '1rem', color: '#666' }}>Loading staff list...</div>
            ) : (
              <div className="staff-select-container">
                <select
                  className="form-select"
                  multiple
                  size={5}
                  value={selectedStaffIds}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    onInputChange('suggested_supervisors', selectedOptions.join(', '));
                  }}
                  disabled={isSubmitted}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #D9D9D9',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name}
                      {staff.role_title ? ` - ${staff.role_title}` : ''}
                      {staff.school ? ` (${staff.school})` : ''}
                    </option>
                  ))}
                </select>
                {selectedStaffIds.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    Selected: {selectedStaffIds.length} staff member{selectedStaffIds.length !== 1 ? 's' : ''}
                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                      {selectedStaffIds.map(id => {
                        const staff = staffList.find(s => s.id === id);
                        return staff?.full_name;
                      }).filter(Boolean).join(', ')}
                    </div>
                  </div>
                )}
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple staff members
                </p>
              </div>
            )}
          </div>
        )}

        {/* Question 9 - Risk Assessment */}
        <div className="form-section risk-assessment-section">
          <h5 className="form-subsection-title">
            9. Risk - Please make a judgement on whether the proposed research falls into one of the categories below and if it does, please complete the Research Risk Matrix. All projects that meet either of the following require Preliminary Approval.
          </h5>
          
          <YesNoQuestion
            label="9.1 Involve the conduct of research, or data collection in overseas locations."
            value={formData.overseas_research_risk}
            onChange={(value) => handleYesNoChange('overseas_research_risk', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="9.2 Potentially involve risk to the reputation of USW. This may include (for example) exploring the prevalence of malpractice, staff/student drug use, staff abuse of power, staff/student illegal activity OR where the occurrence of an adverse event could cause reputational damage."
            value={formData.reputational_risk}
            onChange={(value) => handleYesNoChange('reputational_risk', value)}
            disabled={isSubmitted}
          />
          
          <YesNoQuestion
            label="Has the Research Risk Matrix been completed?"
            value={formData.risk_matrix_completed}
            onChange={(value) => handleYesNoChange('risk_matrix_completed', value)}
            disabled={isSubmitted}
          />
        </div>
      </div>

      {/* Recommendation Section */}
      <div className="form-section">
        <h4 className="form-section-title">Recommendation of the reviewers</h4>
        <div className="recommendation-buttons">
          <button
            type="button"
            className={`recommendation-btn ${formData.recommendation === 'INTERVIEW_APPLICANT' ? 'active' : ''}`}
            onClick={() => onInputChange('recommendation', 'INTERVIEW_APPLICANT')}
            disabled={isSubmitted}
          >
            Interview applicant
          </button>
          <button
            type="button"
            className={`recommendation-btn ${formData.recommendation === 'REVISE_PROPOSAL' ? 'active' : ''}`}
            onClick={() => onInputChange('recommendation', 'REVISE_PROPOSAL')}
            disabled={isSubmitted}
          >
            Revise proposal
          </button>
          <button
            type="button"
            className={`recommendation-btn ${formData.recommendation === 'REJECT' ? 'active' : ''}`}
            onClick={() => onInputChange('recommendation', 'REJECT')}
            disabled={isSubmitted}
          >
            Reject
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="form-section">
        <label className="form-label">
          Please summarise your reasons for recommending acceptance or rejection of this proposal: *
        </label>
        <textarea
          className="form-textarea"
          rows={6}
          placeholder="Provide a summary of your reasons..."
          value={formData.reasons_summary || ''}
          onChange={(e) => onInputChange('reasons_summary', e.target.value)}
          disabled={isSubmitted}
          required
        />
      </div>

      {/* Comments to Applicant */}
      <div className="form-section">
        <label className="form-label">Comments to Applicant (if any)</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Any comments you wish to share with the applicant..."
          value={formData.comments_to_applicant || ''}
          onChange={(e) => onInputChange('comments_to_applicant', e.target.value)}
          disabled={isSubmitted}
        />
      </div>

      {/* Date Returned */}
      <div className="form-section">
        <label className="form-label">Date returned to Graduate School (Optional)</label>
        <input
          type="date"
          className="form-input"
          value={formData.date_returned_to_graduate_school || ''}
          onChange={(e) => onInputChange('date_returned_to_graduate_school', e.target.value)}
          disabled={isSubmitted}
        />
      </div>
    </div>
  );
};

interface YesNoQuestionProps {
  label: string;
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
}

const YesNoQuestion: React.FC<YesNoQuestionProps> = ({ label, value, onChange, disabled }) => {
  return (
    <div className="yes-no-question">
      <label className="yes-no-label">{label}</label>
      <div className="yes-no-buttons">
        <button
          type="button"
          className={`yes-no-btn ${value === true ? 'active' : ''}`}
          onClick={() => onChange(value === true ? null : true)}
          disabled={disabled}
        >
          Yes
        </button>
        <button
          type="button"
          className={`yes-no-btn ${value === false ? 'active' : ''}`}
          onClick={() => onChange(value === false ? null : false)}
          disabled={disabled}
        >
          No
        </button>
      </div>
    </div>
  );
};

