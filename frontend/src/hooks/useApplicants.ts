import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicantService } from '@/services/applicantService';
import type { Applicant, ApplicantCreate, ApplicantDegree } from '@/types';

// Type helpers for React Query cache updates
type ApplicantQueryData = Applicant | undefined;
type ApplicantsQueryData = { items: Applicant[]; total?: number; page?: number; page_size?: number } | undefined;

export const useApplicants = (filters?: {
  intake_year?: number;
  intake_term?: string;
  status?: string;
  degree_type?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['applicants', filters],
    queryFn: () => applicantService.list(filters),
    // Keep previous data while fetching new data (for pagination)
    placeholderData: (previousData) => previousData,
  });
};

export const useApplicant = (id: string | undefined) => {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantService.get(id!),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

export const useCreateApplicant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ApplicantCreate) => applicantService.create(data),
    // Optimistic update: add to list immediately
    onMutate: async (newApplicant) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['applicants'] });
      
      // Snapshot previous value
      const previousApplicants = queryClient.getQueryData(['applicants']);
      
      // Optimistically update
      queryClient.setQueryData(['applicants'], (old: ApplicantsQueryData) => {
        if (!old) return old;
        return {
          ...old,
          items: [newApplicant as ApplicantCreate, ...(old.items || [])],
        };
      });
      
      return { previousApplicants };
    },
    onError: (err, newApplicant, context) => {
      // Rollback on error
      if (context?.previousApplicants) {
        queryClient.setQueryData(['applicants'], context.previousApplicants);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
};

export const useUpdateApplicant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Applicant> }) =>
      applicantService.update(id, data),
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['applicant', id] });
      await queryClient.cancelQueries({ queryKey: ['applicants'] });
      
      // Snapshot previous values
      const previousApplicant = queryClient.getQueryData(['applicant', id]);
      const previousApplicants = queryClient.getQueryData(['applicants']);
      
      // Optimistically update applicant detail
      queryClient.setQueryData(['applicant', id], (old: ApplicantQueryData) => {
        if (!old) return old;
        return { ...old, ...data };
      });
      
      // Optimistically update applicants list
      queryClient.setQueryData(['applicants'], (old: ApplicantsQueryData) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: Applicant) =>
            item.id === id ? { ...item, ...data } : item
          ),
        };
      });
      
      return { previousApplicant, previousApplicants };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousApplicant) {
        queryClient.setQueryData(['applicant', variables.id], context.previousApplicant);
      }
      if (context?.previousApplicants) {
        queryClient.setQueryData(['applicants'], context.previousApplicants);
      }
    },
    onSuccess: (data, variables) => {
      // Update with server response
      queryClient.setQueryData(['applicant', variables.id], data);
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      // Also invalidate allocations to refresh status badges - invalidate all variations
      queryClient.invalidateQueries({ queryKey: ['allocations'], exact: false });
    },
  });
};

export const useDeleteApplicant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => applicantService.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['applicant', id] });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
};

export const useIntakeSummary = () => {
  return useQuery({
    queryKey: ['intake-summary'],
    queryFn: () => applicantService.getIntakeSummary(),
    staleTime: 60 * 1000, // Intake summary can be stale for 1 minute
  });
};

export const useTopicAnalytics = () => {
  return useQuery({
    queryKey: ['topic-analytics'],
    queryFn: () => applicantService.getTopicAnalytics(),
    staleTime: 2 * 60 * 1000, // Analytics can be stale for 2 minutes
  });
};

export const useTopicsByResearchGroup = () => {
  return useQuery({
    queryKey: ['topics-by-research-group'],
    queryFn: () => applicantService.getTopicsByResearchGroup(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useTopicsByTheme = () => {
  return useQuery({
    queryKey: ['topics-by-theme'],
    queryFn: () => applicantService.getTopicsByTheme(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useApplicationStatistics = () => {
  return useQuery({
    queryKey: ['application-statistics'],
    queryFn: () => applicantService.getApplicationStatistics(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAcceleratorAnalytics = () => {
  return useQuery({
    queryKey: ['accelerator-analytics'],
    queryFn: () => applicantService.getAcceleratorAnalytics(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useResearchGroupThemeAnalytics = () => {
  return useQuery({
    queryKey: ['research-group-theme-analytics'],
    queryFn: () => applicantService.getResearchGroupThemeAnalytics(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAcceleratorResearchThemeCorrelation = () => {
  return useQuery({
    queryKey: ['accelerator-research-theme-correlation'],
    queryFn: () => applicantService.getAcceleratorResearchThemeCorrelation(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useStaffCapacityAnalytics = () => {
  return useQuery({
    queryKey: ['staff-capacity-analytics'],
    queryFn: () => applicantService.getStaffCapacityAnalytics(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAcceptanceRatesAnalytics = () => {
  return useQuery({
    queryKey: ['acceptance-rates-analytics'],
    queryFn: () => applicantService.getAcceptanceRatesAnalytics(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCanEmailParticipant = (id: string | undefined) => {
  return useQuery({
    queryKey: ['can-email-participant', id],
    queryFn: () => applicantService.canEmailParticipant(id!),
    enabled: !!id,
    staleTime: 10 * 1000, // Check can be stale for 10 seconds
  });
};

export const useEmailParticipant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => applicantService.emailParticipant(id),
    onSuccess: (_, id) => {
      // Invalidate the can-email check
      queryClient.invalidateQueries({ queryKey: ['can-email-participant', id] });
      // Invalidate applicant data as it may have updated
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
    },
  });
};

export const useApplicantProfile = (id: string | undefined) => {
  return useQuery({
    queryKey: ['applicant-profile', id],
    queryFn: () => applicantService.getProfile(id!),
    enabled: !!id,
  });
};

export const useUpdateApplicantProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: {
        email?: string;
        date_of_birth?: string;
        nationality?: string;
        country_of_residence?: string;
        phone_number?: string;
      }
    }) => applicantService.updateProfile(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['applicant', variables.id] });
    },
  });
};

export const useCreateApplicantDegree = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: {
        degree_type: string;
        subject_area?: string;
        university?: string;
        university_country?: string;
        classification?: string;
        year_completed?: number;
      }
    }) => applicantService.createDegree(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile', variables.id] });
    },
  });
};

export const useUpdateApplicantDegree = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicantId, degreeId, data }: { 
      applicantId: string; 
      degreeId: string;
      data: Partial<ApplicantDegree>;
    }) => applicantService.updateDegree(applicantId, degreeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile', variables.applicantId] });
    },
  });
};

export const useDeleteApplicantDegree = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicantId, degreeId }: { applicantId: string; degreeId: string }) =>
      applicantService.deleteDegree(applicantId, degreeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile', variables.applicantId] });
    },
  });
};

