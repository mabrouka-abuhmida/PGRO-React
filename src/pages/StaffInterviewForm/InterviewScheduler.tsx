/**
 * InterviewScheduler - Page for scheduling interview with multiple date/time options
 * This is separate from the interview form's date field which records the actual interview date
 */
/**
 * InterviewScheduler - Page for scheduling interview with multiple date/time options
 * This is separate from the interview form's date field which records the actual interview date
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components';
import { interviewRecordService } from '@/services/interviewRecordService';
import { applicantService } from '@/services/applicantService';
import { useStaff } from '@/contexts/StaffContext';
import type { Applicant } from '@/types';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types';
import { toastError, toastSuccess, toastWarning, toastConfirm } from '@/utils/toast';
import './InterviewScheduler.css';

interface InterviewOption {
  date: string;
  time: string;
}

export const InterviewScheduler: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { currentStaff } = useStaff();
  
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [interviewOptions, setInterviewOptions] = useState<InterviewOption[]>([
    { date: '', time: '10:00' },
    { date: '', time: '14:00' },
    { date: '', time: '16:00' }
  ]);
  const [location, setLocation] = useState<string>('');
  const [interviewerName, setInterviewerName] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!recordId) return;
    
    try {
      setLoading(true);
      const recordData = await interviewRecordService.get(recordId);
      
      const applicantData = await applicantService.get(recordData.applicant_id);
      setApplicant(applicantData);
      
      // Pre-fill location and interviewer name from record if available
      setLocation(recordData.interview_location || '');
      setInterviewerName(recordData.interviewer_name || currentStaff?.full_name || '');
    } catch (error) {
      logger.error('Error loading data:', error);
      toastError('Error loading interview data');
    } finally {
      setLoading(false);
    }
  }, [recordId, currentStaff]);

  useEffect(() => {
    if (recordId) {
      loadData();
    }
  }, [recordId, loadData]);

  const handleDateChange = (index: number, date: string) => {
    const updated = [...interviewOptions];
    updated[index].date = date;
    setInterviewOptions(updated);
  };

  const handleTimeChange = (index: number, time: string) => {
    const updated = [...interviewOptions];
    updated[index].time = time;
    setInterviewOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    const updated = interviewOptions.filter((_, i) => i !== index);
    // Always keep at least one option
    if (updated.length === 0) {
      updated.push({ date: '', time: '10:00' });
    }
    setInterviewOptions(updated);
  };

  const handleAddOption = () => {
    if (interviewOptions.length < 3) {
      setInterviewOptions([...interviewOptions, { date: '', time: '10:00' }]);
    }
  };

  const handleSendEmail = async () => {
    if (!applicant) {
      toastError('Applicant information not available');
      return;
    }

    if (!applicant.email) {
      toastWarning('Applicant does not have an email address');
      return;
    }

    if (!recordId) {
      toastError('Interview record ID not found');
      return;
    }

    // Filter out empty dates
    const validOptions = interviewOptions.filter(opt => opt.date);
    
    if (validOptions.length === 0) {
      toastWarning('Please select at least one interview date');
      return;
    }

    const confirmed = await toastConfirm(`Send interview invitation email with ${validOptions.length} date option(s) to ${applicant.email}?`);
    if (!confirmed) {
      return;
    }

    try {
      setSendingEmail(true);
      await interviewRecordService.sendInterviewEmailWithOptions(recordId, {
        interview_options: validOptions.map(opt => ({
          date: opt.date,
          time: opt.time
        })),
        interview_location: location || 'TBD',
        interviewer_name: interviewerName
      });
      
      toastSuccess('Interview invitation email sent successfully!');
      navigate(-1); // Go back to interview form
    } catch (error: unknown) {
      logger.error('Error sending email:', error);
      toastError('Failed to send email: ' + getErrorMessage(error));
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="interview-scheduler-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="interview-scheduler-page">
        <div className="error">Applicant not found</div>
      </div>
    );
  }

  if (!applicant.email) {
    return (
      <div className="interview-scheduler-page">
        <div className="scheduler-header">
          <Button variant="text" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <h1>Schedule Interview</h1>
        </div>
        <div className="no-email-message">
          <p style={{ fontSize: '1.2rem', color: '#BE1E2D', fontWeight: 600 }}>
            ⚠️ Applicant doesn't have an email address
          </p>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Please add an email address for {applicant.full_name} before sending an interview invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-scheduler-page">
      <div className="scheduler-header">
        <Button variant="text" onClick={() => navigate(-1)}>
          ← Back to Interview Form
        </Button>
        <h1>Schedule Interview & Send Email</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          Select up to 3 interview date and time options for {applicant.full_name}
        </p>
      </div>

      <div className="scheduler-content">
        <div className="applicant-info-box">
          <p><strong>Applicant:</strong> {applicant.full_name}</p>
          <p><strong>Email:</strong> {applicant.email}</p>
        </div>

        <div className="scheduler-form">
          <div className="form-section">
            <label className="form-label">Interviewer Name:</label>
            <input
              type="text"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="Enter interviewer name"
              className="form-input"
            />
          </div>

          <div className="form-section">
            <label className="form-label">Location:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Video call, Campus office, Room 123"
              className="form-input"
            />
          </div>

          <div className="form-section">
            <label className="form-label">Interview Date & Time Options:</label>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              Select up to 3 date and time options. The applicant will receive all options in the email.
            </p>
            
            {interviewOptions.map((option, index) => (
              <div key={index} className="date-time-option">
                <div className="option-header">
                  <span className="option-number">Option {index + 1}</span>
                  {interviewOptions.length > 1 && (
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      style={{ color: '#BE1E2D' }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="date-time-inputs">
                  <div className="input-group">
                    <label>Date:</label>
                    <input
                      type="date"
                      value={option.date}
                      onChange={(e) => handleDateChange(index, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="form-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Time:</label>
                    <input
                      type="time"
                      value={option.time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            ))}

            {interviewOptions.length < 3 && (
              <Button
                variant="outline"
                onClick={handleAddOption}
                style={{ marginTop: '1rem' }}
              >
                + Add Another Date Option
              </Button>
            )}
          </div>

          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendEmail}
              disabled={sendingEmail || interviewOptions.filter(opt => opt.date).length === 0}
            >
              {sendingEmail ? 'Sending Email...' : '📧 Send Interview Invitation Email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

