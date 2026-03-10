import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewRecordService, type InterviewRecordCreate } from '@/services/interviewRecordService';

export const useInterviewRecords = (filters?: {
  applicant_id?: string;
  staff_id?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['interview-records', filters],
    queryFn: () => interviewRecordService.list(filters),
  });
};

export const useInterviewRecord = (id: string | undefined) => {
  return useQuery({
    queryKey: ['interview-record', id],
    queryFn: () => interviewRecordService.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

export const useInterviewRecordByAllocation = (allocationId: string | undefined) => {
  return useQuery({
    queryKey: ['interview-record', 'allocation', allocationId],
    queryFn: () => interviewRecordService.getByAllocation(allocationId!),
    enabled: !!allocationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

export const useCreateOrUpdateInterviewRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InterviewRecordCreate) => interviewRecordService.createOrUpdate(data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch the specific record to get complete updated data
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ['interview-record', data.id] });
        // Also refetch to ensure we have the latest data
        queryClient.refetchQueries({ queryKey: ['interview-record', data.id] });
      }
      // Update cache for allocation-based query if we have the data
      if (data.allocation_id) {
        queryClient.setQueryData(['interview-record', 'allocation', data.allocation_id], { 
          exists: true, 
          id: data.id, 
          status: data.status,
          is_submitted: data.is_submitted 
        });
        // Also invalidate allocation-based query to refetch
        queryClient.invalidateQueries({ queryKey: ['interview-record', 'allocation', data.allocation_id] });
      }
      // Invalidate list queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['interview-records'] });
    },
  });
};

