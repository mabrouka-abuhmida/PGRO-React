/**
 * Typed API client for Allocation Note Service
 */
import { apiClient } from './api';
import type { AllocationNote, AllocationNoteCreate, AllocationNoteReply, AllocationNoteUpdate } from '@/types';

export const allocationNoteService = {
  /**
   * Get all notes for an allocation
   */
  list: async (allocationId: string): Promise<AllocationNote[]> => {
    const response = await apiClient.get<AllocationNote[]>(`/allocations/${allocationId}/notes`);
    return response.data;
  },

  /**
   * Create a new note for an allocation
   */
  create: async (allocationId: string, data: AllocationNoteCreate): Promise<AllocationNote> => {
    const response = await apiClient.post<AllocationNote>(`/allocations/${allocationId}/notes`, data);
    return response.data;
  },

  /**
   * Reply to an existing note
   */
  reply: async (
    allocationId: string,
    parentNoteId: string,
    data: AllocationNoteReply
  ): Promise<AllocationNote> => {
    const response = await apiClient.post<AllocationNote>(
      `/allocations/${allocationId}/notes/${parentNoteId}/reply`,
      data
    );
    return response.data;
  },

  /**
   * Update a note
   */
  update: async (
    allocationId: string,
    noteId: string,
    data: AllocationNoteUpdate
  ): Promise<AllocationNote> => {
    const response = await apiClient.put<AllocationNote>(
      `/allocations/${allocationId}/notes/${noteId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a note (soft delete)
   */
  delete: async (allocationId: string, noteId: string, authorUserId: string): Promise<void> => {
    await apiClient.delete(`/allocations/${allocationId}/notes/${noteId}`, {
      data: { author_user_id: authorUserId },
    });
  },
};



