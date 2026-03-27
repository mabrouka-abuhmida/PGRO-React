/**
 * ApplicantUploadModal - Modal for batch uploading PDF files to create applicants
 */
import React, { useState } from 'react';
import { Button } from '@/components';
import { fileService } from '@/services/fileService';
import { documentService } from '@/services/documentService';
import { logger } from '@/utils/logger';
import { toastError, toastWarning } from '@/utils/toast';
import { getErrorMessage } from '@/types';
import type { DegreeType } from '@/types';
import './ApplicantUploadModal.css';

interface ApplicantUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplicantUploadModal: React.FC<ApplicantUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    file: File;
    document_type: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT';
  }>>([]);
  const [uploadResults, setUploadResults] = useState<Array<{
    filename: string;
    status: 'success' | 'error';
    error?: string;
  }>>([]);
  const [uploadFormData, setUploadFormData] = useState({
    degree_type: 'PHD' as DegreeType,
    intake_term: 'OCT',
    intake_year: new Date().getFullYear(),
    auto_match: false,
  });

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')
      );
      const newFiles = files.map(file => {
        const filename = file.name.toLowerCase();
        let defaultType: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT' = 'PROPOSAL';
        
        if (filename.includes('cv') || filename.includes('resume')) {
          defaultType = 'CV';
        } else if (filename.includes('application') || filename.includes('form')) {
          defaultType = 'APPLICATION_FORM';
        } else if (filename.includes('transcript')) {
          defaultType = 'TRANSCRIPT';
        }
        
        return { file, document_type: defaultType };
      });
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileDocumentTypeChange = (index: number, documentType: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT') => {
    setSelectedFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, document_type: documentType } : item
    ));
  };

  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toastWarning('Please select at least one file');
      return;
    }

    const hasProposal = selectedFiles.some(f => f.document_type === 'PROPOSAL');
    if (!hasProposal) {
      toastWarning('At least one file must be marked as "Research Proposal" to create a new applicant.');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    try {
      const proposalFiles = selectedFiles.filter(f => f.document_type === 'PROPOSAL');
      const otherFiles = selectedFiles.filter(f => f.document_type !== 'PROPOSAL');

      const results: Array<{ filename: string; status: 'success' | 'error'; error?: string; applicant_id?: string }> = [];
      let createdApplicantId: string | null = null;

      if (proposalFiles.length > 0) {
        try {
          const proposalFileList = proposalFiles.map(f => f.file);
          const response = await fileService.batchUpload({
            files: proposalFileList,
            degree_type: uploadFormData.degree_type,
            intake_term: uploadFormData.intake_term,
            intake_year: uploadFormData.intake_year,
            auto_match: uploadFormData.auto_match,
          });

          response.results.forEach(result => {
            results.push(result);
            if (result.status === 'success' && result.applicant_id && !createdApplicantId) {
              createdApplicantId = result.applicant_id;
            }
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload proposal';
          proposalFiles.forEach(f => {
            results.push({
              filename: f.file.name,
              status: 'error',
              error: errorMessage,
            });
          });
        }
      }

      if (otherFiles.length > 0 && createdApplicantId) {
        for (const fileItem of otherFiles) {
          try {
            await documentService.upload({
              file: fileItem.file,
              applicant_id: createdApplicantId,
              document_type: fileItem.document_type,
            });
            results.push({
              filename: fileItem.file.name,
              status: 'success',
            });
          } catch (error: unknown) {
            results.push({
              filename: fileItem.file.name,
              status: 'error',
              error: getErrorMessage(error),
            });
          }
        }
      } else if (otherFiles.length > 0 && !createdApplicantId) {
        otherFiles.forEach(f => {
          results.push({
            filename: f.file.name,
            status: 'error',
            error: 'No applicant created (proposal upload failed)',
          });
        });
      }

      setUploadResults(results);

      const successful = results.filter(r => r.status === 'success').length;
      if (successful > 0) {
        onSuccess();
        setTimeout(() => {
          if (results.every(r => r.status === 'success')) {
            onClose();
          }
        }, 2000);
      }
    } catch (error) {
      logger.error('Error uploading files:', error);
      toastError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload PDFs to Create Applicants</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleBatchUpload}>
          <div className="form-group">
            <label>Select PDF Files</label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="file-list">
              {selectedFiles.map((fileItem, index) => (
                <div key={index} className="file-item">
                  <span>{fileItem.file.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={fileItem.document_type}
                      onChange={(e) => handleFileDocumentTypeChange(index, e.target.value as any)}
                      disabled={uploading}
                    >
                      <option value="PROPOSAL">Research Proposal</option>
                      <option value="CV">CV</option>
                      <option value="APPLICATION_FORM">Application Form</option>
                      <option value="TRANSCRIPT">Transcript</option>
                    </select>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Degree Type</label>
              <select
                value={uploadFormData.degree_type}
                onChange={(e) => setUploadFormData({ ...uploadFormData, degree_type: e.target.value as DegreeType })}
                disabled={uploading}
              >
                <option value="PHD">PhD</option>
                <option value="MRES">MRes</option>
              </select>
            </div>
            <div className="form-group">
              <label>Intake Term</label>
              <select
                value={uploadFormData.intake_term}
                onChange={(e) => setUploadFormData({ ...uploadFormData, intake_term: e.target.value })}
                disabled={uploading}
              >
                <option value="JAN">January</option>
                <option value="OCT">October</option>
              </select>
            </div>
            <div className="form-group">
              <label>Intake Year</label>
              <input
                type="number"
                value={uploadFormData.intake_year}
                onChange={(e) => setUploadFormData({ ...uploadFormData, intake_year: parseInt(e.target.value) })}
                disabled={uploading}
              />
            </div>
          </div>

          {uploadResults.length > 0 && (
            <div className="upload-results">
              <h3>Upload Results</h3>
              {uploadResults.map((result, index) => (
                <div key={index} className={`result-item result-${result.status}`}>
                  <span className="result-filename">{result.filename}</span>
                  <span className="result-status">
                    {result.status === 'success' ? '✓ Success' : `✗ ${result.error || 'Error'}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={uploading || selectedFiles.length === 0}>
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

