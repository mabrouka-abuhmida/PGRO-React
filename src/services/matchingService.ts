/**
 * Typed API client for Matching Service
 */
import { apiClient } from './api';
import type { MatchRequest, MatchResponse } from '@/types';

export const matchingService = {
  /**
   * Find matching supervisors for an applicant (generates new matches)
   */
  findMatches: async (request: MatchRequest): Promise<MatchResponse[]> => {
    const response = await apiClient.post<MatchResponse[]>('/matching/match', request);
    return response.data;
  },

  /**
   * Get stored match recommendations for an applicant
   */
  getStoredMatches: async (applicantId: string): Promise<MatchResponse[]> => {
    const response = await apiClient.get<MatchResponse[]>(`/matching/matches/${applicantId}`);
    return response.data;
  },

  /**
   * Get timestamp of when matches were last generated
   */
  getMatchTimestamp: async (applicantId: string): Promise<{ generated_at: string | null }> => {
    const response = await apiClient.get<{ generated_at: string | null }>(`/matching/matches/${applicantId}/timestamp`);
    return response.data;
  },
};

