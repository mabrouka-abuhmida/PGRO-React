import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService } from '@/services/matchingService';
import type { MatchRequest } from '@/types';

export const useStoredMatches = (applicantId: string | undefined) => {
  return useQuery({
    queryKey: ['stored-matches', applicantId],
    queryFn: () => matchingService.getStoredMatches(applicantId!),
    enabled: !!applicantId,
  });
};

export const useMatchTimestamp = (applicantId: string | undefined) => {
  return useQuery({
    queryKey: ['match-timestamp', applicantId],
    queryFn: () => matchingService.getMatchTimestamp(applicantId!),
    enabled: !!applicantId,
  });
};

export const useFindMatches = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: MatchRequest) => matchingService.findMatches(request),
    onSuccess: (data, variables) => {
      // Update stored matches cache
      queryClient.setQueryData(['stored-matches', variables.applicant_id], data);
      // Invalidate timestamp to refetch
      queryClient.invalidateQueries({ queryKey: ['match-timestamp', variables.applicant_id] });
    },
  });
};

