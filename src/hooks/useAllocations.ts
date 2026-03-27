import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationService } from "@/services/allocationService";
import type { Allocation, AllocationCreate } from "@/types";

// Type helpers for React Query cache updates
type AllocationQueryData = Allocation | undefined;
type AllocationsQueryData = Allocation[] | { items: Allocation[] } | undefined;

export const useAllocations = (filters?: {
  applicant_id?: string;
  staff_id?: string;
  is_confirmed?: boolean;
  year?: number;
  term?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ["allocations", filters],
    queryFn: () => {
      // If term is provided, use getByIntake instead of list
      if (filters?.term && filters?.year) {
        return allocationService.getByIntake(filters.year, filters.term);
      }
      return allocationService.list(filters);
    },
    // Keep previous data while fetching new data (for pagination/filtering)
    placeholderData: (previousData) => previousData,
  });
};

export const useAllocation = (id: string | undefined) => {
  return useQuery({
    queryKey: ["allocation", id],
    queryFn: () => allocationService.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

export const useAllocationsByIntake = (year: number, term: string) => {
  return useQuery({
    queryKey: ["allocations", "intake", year, term],
    queryFn: () => allocationService.getByIntake(year, term),
  });
};

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AllocationCreate) => allocationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useUpdateAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Allocation> }) =>
      allocationService.update(id, data),
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["allocation", id] });
      await queryClient.cancelQueries({ queryKey: ["allocations"] });

      const previousAllocation = queryClient.getQueryData(["allocation", id]);
      const previousAllocations = queryClient.getQueryData(["allocations"]);

      // Optimistically update
      queryClient.setQueryData(
        ["allocation", id],
        (old: AllocationQueryData) => {
          if (!old) return old;
          return { ...old, ...data };
        },
      );

      queryClient.setQueryData(["allocations"], (old: AllocationsQueryData) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item: Allocation) =>
            item.id === id ? { ...item, ...data } : item,
          );
        }
        if (old.items) {
          return {
            ...old,
            items: old.items.map((item: Allocation) =>
              item.id === id ? { ...item, ...data } : item,
            ),
          };
        }
        return old;
      });

      return { previousAllocation, previousAllocations };
    },
    onError: (_err, variables, context) => {
      if (context?.previousAllocation) {
        queryClient.setQueryData(
          ["allocation", variables.id],
          context.previousAllocation,
        );
      }
      if (context?.previousAllocations) {
        queryClient.setQueryData(["allocations"], context.previousAllocations);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["allocation", variables.id], data);
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useDeleteAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => allocationService.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ["allocation", id] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useSendAllocationEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => allocationService.sendEmail(id),
    onSuccess: (_, id) => {
      // Invalidate allocation to get updated email_sent_at
      queryClient.invalidateQueries({ queryKey: ["allocation", id] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};
