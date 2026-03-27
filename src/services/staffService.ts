/**
 * Typed API client for Staff Service
 */
import { apiClient } from './api';
import type { Staff, StaffCreate, StaffUpdate, StaffListResponse } from '@/types';

export const staffService = {
  /**
   * List staff with optional filters
   */
  list: async (params?: {
    active?: boolean;
    keyword?: string;
    can_be_dos?: boolean;
    can_supervise_phd?: boolean;
    can_supervise_mres?: boolean;
    has_capacity_phd?: boolean;
    has_capacity_mres?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<StaffListResponse> => {
    const response = await apiClient.get<StaffListResponse>('/staff', { params });
    return response.data;
  },

  /**
   * Get staff by ID
   */
  get: async (id: string): Promise<Staff> => {
    const response = await apiClient.get<Staff>(`/staff/${id}`);
    return response.data;
  },

  /**
   * Create new staff member
   */
  create: async (data: StaffCreate): Promise<Staff> => {
    const response = await apiClient.post<Staff>('/staff', data);
    return response.data;
  },

  /**
   * Update staff member
   */
  update: async (id: string, data: StaffUpdate): Promise<Staff> => {
    const response = await apiClient.put<Staff>(`/staff/${id}`, data);
    return response.data;
  },

  /**
   * Delete (soft delete) staff member
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },
};

