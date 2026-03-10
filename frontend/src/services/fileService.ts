/**
 * File upload service for batch PDF processing
 */
import { apiClient } from './api';
import { validateFile } from '@/utils/fileValidation';

export interface BatchUploadResponse {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    filename: string;
    applicant_id?: string;
    status: 'success' | 'error';
    error?: string;
  }>;
}

export interface BatchUploadParams {
  files: File[];
  degree_type: 'PHD' | 'MRES';
  intake_term: string;
  intake_year: number;
  auto_match?: boolean;
}

export const fileService = {
  /**
   * Batch upload PDF applications
   */
  batchUpload: async (params: BatchUploadParams): Promise<BatchUploadResponse> => {
    // Validate all files before upload
    const validationErrors: string[] = [];
    const validatedFiles: File[] = [];

    for (const file of params.files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        validationErrors.push(`${file.name}: ${validation.error || 'Validation failed'}`);
      } else {
        // Use sanitized filename if needed
        const sanitizedFile = validation.sanitizedFileName !== file.name
          ? new File([file], validation.sanitizedFileName, { type: file.type })
          : file;
        validatedFiles.push(sanitizedFile);
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`File validation failed:\n${validationErrors.join('\n')}`);
    }

    if (validatedFiles.length === 0) {
      throw new Error('No valid files to upload');
    }

    const formData = new FormData();
    
    // Add validated files
    validatedFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add metadata
    formData.append('degree_type', params.degree_type);
    formData.append('intake_term', params.intake_term);
    formData.append('intake_year', params.intake_year.toString());
    formData.append('auto_match', params.auto_match ? 'true' : 'false');
    
    // Increase timeout for batch upload (120 seconds to match backend)
    const response = await apiClient.post<BatchUploadResponse>('/applicants/batch-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 120 seconds (2 minutes) for batch operations
    });
    
    return response.data;
  },
};

