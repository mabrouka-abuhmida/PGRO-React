/**
 * Typed API client for Allocation Service
 */
import { apiClient } from './api';
import type { Allocation, AllocationCreate } from '@/types';

export const allocationService = {
  /**
   * List allocations with optional filters
   */
  list: async (params?: {
    applicant_id?: string;
    staff_id?: string;
    is_confirmed?: boolean;
    year?: number;
    term?: string;
    page?: number;
    page_size?: number;
  }): Promise<Allocation[]> => {
    const response = await apiClient.get<{ items: Allocation[]; total: number; page: number; page_size: number } | Allocation[]>('/allocations', { params });
    // Handle paginated response (new format) or array response (old format for backward compatibility)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.items || [];
  },

  /**
   * Get a single allocation by ID
   */
  get: async (id: string): Promise<Allocation> => {
    const response = await apiClient.get<Allocation>(`/allocations/${id}`);
    return response.data;
  },

  /**
   * Get allocations for a specific intake
   */
  getByIntake: async (year: number, term: string): Promise<Allocation[]> => {
    const response = await apiClient.get<Allocation[]>('/allocations/intake', {
      params: { year, term },
    });
    return response.data;
  },

  /**
   * Create new allocation
   */
  create: async (data: AllocationCreate): Promise<Allocation> => {
    const response = await apiClient.post<Allocation>('/allocations', data);
    return response.data;
  },

  /**
   * Update allocation
   */
  update: async (id: string, data: Partial<Allocation>): Promise<Allocation> => {
    const response = await apiClient.put<Allocation>(`/allocations/${id}`, data);
    return response.data;
  },

  /**
   * Delete allocation
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/allocations/${id}`);
  },

  /**
   * Send email to supervisor with application details
   */
  sendEmail: async (id: string): Promise<{ success: boolean; message?: string; email_sent_at?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string; email_sent_at?: string }>(
      `/allocations/${id}/send-email`
    );
    return response.data;
  },
};

