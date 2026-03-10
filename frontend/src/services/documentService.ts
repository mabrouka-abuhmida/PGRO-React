/**
 * Document service for managing applicant documents
 */
import { apiClient } from './api';
import { validateFile, sanitizeFileName } from '@/utils/fileValidation';

export interface Document {
  id: string;
  file_name: string;
  document_type: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT';
  mime_type: string;
  file_size_bytes?: number;
  created_at: string;
  extracted_text?: string;
  has_extracted_text?: boolean;
  extracted_text_updated_at?: string;
}

export interface DocumentChecklist {
  has_proposal: boolean;
  has_cv: boolean;
  has_application_form: boolean;
  has_transcript: boolean;
  is_complete: boolean;
  missing_documents: string[];
  total_documents: number;
}

export interface UploadDocumentParams {
  file: File;
  applicant_id: string;
  document_type: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT';
}

export const documentService = {
  /**
   * Upload a document for an applicant
   */
  upload: async (params: UploadDocumentParams): Promise<Document> => {
    // Validate file before upload
    const validation = validateFile(params.file);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    const formData = new FormData();
    // Create a new File object with sanitized name if needed
    const sanitizedFile = validation.sanitizedFileName !== params.file.name
      ? new File([params.file], validation.sanitizedFileName, { type: params.file.type })
      : params.file;
    
    formData.append('file', sanitizedFile);
    formData.append('applicant_id', params.applicant_id);
    formData.append('document_type', params.document_type);

    const response = await apiClient.post<Document>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Get all documents for an applicant
   */
  getDocuments: async (applicantId: string): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>(`/applicants/${applicantId}/documents`);
    return response.data;
  },

  /**
   * Get document checklist status
   */
  getChecklist: async (applicantId: string): Promise<DocumentChecklist> => {
    const response = await apiClient.get<DocumentChecklist>(
      `/applicants/${applicantId}/documents/checklist`
    );
    return response.data;
  },

  /**
   * Download a document
   */
  download: async (fileId: string, fileName: string): Promise<void> => {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Sanitize filename before using in download attribute
    const sanitizedFileName = sanitizeFileName(fileName);

    // Create blob and download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', sanitizedFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Always revoke URL to prevent memory leaks
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete a document
   */
  delete: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`);
  },

  /**
   * Extract text from a document
   */
  extractText: async (fileId: string): Promise<string> => {
    const response = await apiClient.get<{ text: string; success: boolean; error?: string }>(`/files/${fileId}/extract-text`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to extract text');
    }
    return response.data.text || '';
  },
};

