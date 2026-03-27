import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staffService';
import type { Staff, StaffCreate, StaffUpdate, StaffListResponse } from '@/types';

// Type helpers for React Query cache updates
type StaffQueryData = Staff | undefined;
type StaffListQueryData = StaffListResponse | undefined;

export const useStaffList = (filters?: {
  active?: boolean;
  keyword?: string;
  can_be_dos?: boolean;
  can_supervise_phd?: boolean;
  can_supervise_mres?: boolean;
  has_capacity_phd?: boolean;
  has_capacity_mres?: boolean;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['staff', filters],
    queryFn: () => staffService.list(filters),
    // Keep previous data while fetching new data (for pagination/filtering)
    placeholderData: (previousData) => previousData,
  });
};

export const useStaff = (id: string | undefined) => {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffService.get(id!),
    enabled: !!id,
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: StaffCreate) => staffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUpdate }) =>
      staffService.update(id, data),
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['staff', id] });
      await queryClient.cancelQueries({ queryKey: ['staff'] });
      
      const previousStaff = queryClient.getQueryData(['staff', id]);
      const previousStaffList = queryClient.getQueryData(['staff']);
      
      // Optimistically update
      queryClient.setQueryData(['staff', id], (old: StaffQueryData) => {
        if (!old) return old;
        return { ...old, ...data };
      });
      
      queryClient.setQueryData(['staff'], (old: StaffListQueryData) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: Staff) =>
            item.id === id ? { ...item, ...data } : item
          ),
        };
      });
      
      return { previousStaff, previousStaffList };
    },
    onError: (_err, variables, context) => {
      if (context?.previousStaff) {
        queryClient.setQueryData(['staff', variables.id], context.previousStaff);
      }
      if (context?.previousStaffList) {
        queryClient.setQueryData(['staff'], context.previousStaffList);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['staff', variables.id], data);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['staff', id] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

