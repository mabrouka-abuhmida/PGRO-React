import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services/documentService';

export const useDocumentChecklist = (applicantId: string | undefined) => {
  return useQuery({
    queryKey: ['document-checklist', applicantId],
    queryFn: () => documentService.getChecklist(applicantId!),
    enabled: !!applicantId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

export const useDocuments = (applicantId: string | undefined) => {
  return useQuery({
    queryKey: ['documents', applicantId],
    queryFn: () => documentService.getDocuments(applicantId!),
    enabled: !!applicantId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { file: File; applicant_id: string; document_type: 'PROPOSAL' | 'CV' | 'APPLICATION_FORM' | 'TRANSCRIPT' }) =>
      documentService.upload(params),
    onSuccess: (_, variables) => {
      // Invalidate documents and checklist for this applicant
      queryClient.invalidateQueries({ queryKey: ['documents', variables.applicant_id] });
      queryClient.invalidateQueries({ queryKey: ['document-checklist', variables.applicant_id] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ fileId, applicantId: _applicantId }: { fileId: string; applicantId: string }) =>
      documentService.delete(fileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.applicantId] });
      queryClient.invalidateQueries({ queryKey: ['document-checklist', variables.applicantId] });
    },
  });
};

export const useExtractText = () => {
  return useMutation({
    mutationFn: (fileId: string) => documentService.extractText(fileId),
  });
};

