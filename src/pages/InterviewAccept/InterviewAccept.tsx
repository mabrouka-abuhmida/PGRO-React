/**
 * InterviewAccept - Page for students to accept an interview option
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { interviewRecordService, type InterviewRecord } from '@/services/interviewRecordService';
import { apiClient } from '@/services/api';
import { logger } from '@/utils/logger';
import {AxiosError} from "axios"
import './InterviewAccept.css';

interface InterviewOption {
  date: string;
  time: string;
}

export const InterviewAccept: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const [searchParams] = useSearchParams();
  const optionIndex = parseInt(searchParams.get('option') || '0', 10);
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<InterviewRecord | null>(null);
  const [interviewOptions, setInterviewOptions] = useState<InterviewOption[]>([]);

  const loadData = useCallback(async () => {
    if (!recordId) return;
    
    try {
      setLoading(true);
      const recordData = await interviewRecordService.get(recordId);
      setRecord(recordData);
      
      // Try to get interview options from the record or from a stored source
      // For now, we'll need to get them from the email or store them
      // This is a limitation - we need to pass options in the URL or store them
      // For this implementation, we'll assume they're passed as URL params
      const optionsParam = searchParams.get('options');
      if (optionsParam) {
        try {
          const decoded = decodeURIComponent(optionsParam);
          const options = JSON.parse(decoded);
          setInterviewOptions(options);
        } catch (e) {
          logger.error('Error parsing options:', e);
        }
      }
    } catch (error: unknown) {
      logger.error('Error loading interview record:', error);
      setError('Failed to load interview record. Please contact the administrator.');
    } finally {
      setLoading(false);
    }
  }, [recordId, searchParams]);

  useEffect(() => {
    if (recordId) {
      loadData();
    }
  }, [recordId, loadData]);

  const handleAccept = async () => {
    if (!recordId || interviewOptions.length === 0) {
      setError('Interview options not available. Please contact the administrator.');
      return;
    }

    if (optionIndex < 0 || optionIndex >= interviewOptions.length) {
      setError('Invalid option selected.');
      return;
    }

    try {
      setAccepting(true);
      setError(null);
      
      // Call the accept endpoint
      const response = await apiClient.post(
        `/interview-records/${recordId}/accept-option`,
        {
          option_index: optionIndex,
          interview_options: interviewOptions
        }
      );
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError('Failed to accept interview option. Please try again.');
      }
    } catch (error: unknown) {
      logger.error('Error accepting interview option:', error);
      if(error instanceof AxiosError) {
        setError(
        error?.response?.data?.detail || 
        error?.message || 
        'Failed to accept interview option. Please contact the administrator.'
      );
      }else {
        setError(
        'Failed to accept interview option. Please contact the administrator.'
      );
      }      
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="interview-accept-page">
        <div className="accept-container">
          <div className="loading-state">
            <p>Loading interview details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="interview-accept-page">
        <div className="accept-container">
          <div className="error-state">
            <h2>Error</h2>
            <p>{error}</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              If this problem persists, please contact your supervisor directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    const selectedOption = interviewOptions[optionIndex];
    return (
      <div className="interview-accept-page">
        <div className="accept-container">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Interview Option Accepted!</h2>
            <p>You have successfully accepted the following interview option:</p>
            <div className="accepted-details">
              <p><strong>Date:</strong> {selectedOption?.date ? new Date(selectedOption.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}</p>
              <p><strong>Time:</strong> {selectedOption?.time || 'N/A'}</p>
            </div>
            <p style={{ marginTop: '1.5rem', color: '#666' }}>
              Your supervisor has been notified. You will receive a confirmation email shortly.
            </p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              If you need to change your selection, please contact your supervisor directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedOption = interviewOptions[optionIndex];
  if (!selectedOption) {
    return (
      <div className="interview-accept-page">
        <div className="accept-container">
          <div className="error-state">
            <h2>Invalid Option</h2>
            <p>The selected interview option is not available.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Please use the link from your email or contact your supervisor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-accept-page">
      <div className="accept-container">
        <div className="accept-content">
          <h1>Accept Interview Option</h1>
          <p>You are about to accept the following interview option:</p>
          
          <div className="option-details">
            <h2>Option {optionIndex + 1}</h2>
            <p><strong>Date:</strong> {selectedOption.date ? new Date(selectedOption.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'N/A'}</p>
            <p><strong>Time:</strong> {selectedOption.time || 'N/A'}</p>
            {record?.interview_location && (
              <p><strong>Location:</strong> {record.interview_location}</p>
            )}
          </div>

          <div className="accept-actions">
            <button 
              className="btn-accept" 
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'Accept This Option'}
            </button>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              By accepting, you confirm that this time works for you. Your supervisor will be notified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

