import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffReviewService, type StaffReviewCreate } from '@/services/staffReviewService';

export const useStaffReviews = (isSubmitted?: boolean, page?: number, page_size?: number) => {
  return useQuery({
    queryKey: ['staff-reviews', isSubmitted, page, page_size],
    queryFn: () => staffReviewService.list(isSubmitted, page, page_size),
  });
};

export const useStaffReview = (id: string | undefined) => {
  return useQuery({
    queryKey: ['staff-review', id],
    queryFn: () => staffReviewService.get(id!),
    enabled: !!id,
  });
};

export const useStaffReviewByAllocation = (allocationId: string | undefined) => {
  return useQuery({
    queryKey: ['staff-review', 'allocation', allocationId],
    queryFn: async () => {
      try {
        return await staffReviewService.getByAllocation(allocationId!);
      } catch (error: any) {
        // If 404, return null (review doesn't exist yet - this is valid)
        if (error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!allocationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
    // Don't retry on 404 - review doesn't exist yet, which is valid
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useCreateOrUpdateStaffReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: StaffReviewCreate) => staffReviewService.createOrUpdate(data),
    onSuccess: (data) => {
      // Update cache for the specific review
      if (data.id) {
        queryClient.setQueryData(['staff-review', data.id], data);
      }
      // Update cache for allocation-based query
      queryClient.setQueryData(['staff-review', 'allocation', data.allocation_id], data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['staff-reviews'] });
    },
  });
};

export const useGenerateAIReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (allocationId: string) => staffReviewService.generateAIReview(allocationId),
    onSuccess: (_, allocationId) => {
      // Invalidate the review to refetch with AI review
      queryClient.invalidateQueries({ queryKey: ['staff-review', 'allocation', allocationId] });
    },
  });
};

