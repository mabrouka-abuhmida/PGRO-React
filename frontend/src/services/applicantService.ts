/**
 * Typed API client for Applicant Service
 */
import { apiClient } from './api';
import type { Applicant, ApplicantCreate, ApplicantDegree, IntakeSummary, ApplicantProfile } from '@/types';

export const applicantService = {
  /**
   * List applicants with optional filters
   */
  list: async (params?: {
    intake_year?: number;
    intake_term?: string;
    status?: string;
    degree_type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Applicant[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/applicants', { params });
    return response.data;
  },

  /**
   * Get applicant by ID
   */
  get: async (id: string): Promise<Applicant> => {
    const response = await apiClient.get<Applicant>(`/applicants/${id}`);
    return response.data;
  },

  /**
   * Create new applicant
   */
  create: async (data: ApplicantCreate): Promise<Applicant> => {
    const response = await apiClient.post<Applicant>('/applicants', data);
    return response.data;
  },

  /**
   * Update applicant
   */
  update: async (id: string, data: Partial<Applicant>): Promise<Applicant> => {
    const response = await apiClient.put<Applicant>(`/applicants/${id}`, data);
    return response.data;
  },

  /**
   * Delete applicant
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/applicants/${id}`);
  },

  /**
   * Get dashboard intake summary statistics
   */
  getIntakeSummary: async (): Promise<IntakeSummary[]> => {
    const response = await apiClient.get('/applicants/dashboard/intake-summary');
    return response.data;
  },

  /**
   * Get topic frequency analytics
   */
  getTopicAnalytics: async (): Promise<Array<{ topic: string; count: number }>> => {
    const response = await apiClient.get('/applicants/analytics/topics');
    return response.data;
  },

  /**
   * Get topic distribution by research group
   */
  getTopicsByResearchGroup: async (): Promise<Array<{
    research_group: string;
    topics: Array<{ topic: string; count: number }>;
    total_applications: number;
  }>> => {
    const response = await apiClient.get('/applicants/analytics/topics-by-research-group');
    return response.data;
  },

  /**
   * Get topic distribution by theme
   */
  getTopicsByTheme: async (): Promise<{
    primary_themes: Array<{
      theme: string;
      type: string;
      topics: Array<{ topic: string; count: number }>;
      total_applications: number;
    }>;
    secondary_themes: Array<{
      theme: string;
      type: string;
      topics: Array<{ topic: string; count: number }>;
      total_applications: number;
    }>;
  }> => {
    const response = await apiClient.get('/applicants/analytics/topics-by-theme');
    return response.data;
  },

  /**
   * Get comprehensive application statistics
   */
  getApplicationStatistics: async (): Promise<{
    total_applications: number;
    status_breakdown: Record<string, number>;
    degree_breakdown: Record<string, number>;
    intake_trends: Array<{ year: number; term: string; count: number }>;
    with_embeddings: number;
    with_topics: number;
    research_group_coverage: Array<{ research_group: string; applicant_count: number }>;
  }> => {
    const response = await apiClient.get('/applicants/analytics/statistics');
    return response.data;
  },

  /**
   * Get application distribution by university accelerators
   */
  getAcceleratorAnalytics: async (): Promise<Array<{
    accelerator: string;
    applicant_count: number;
    topics: Array<{ topic: string; count: number }>;
  }>> => {
    const response = await apiClient.get('/applicants/analytics/accelerators');
    return response.data;
  },

  /**
   * Get distribution by research group themes
   */
  getResearchGroupThemeAnalytics: async (): Promise<Array<{
    theme: string;
    staff_count: number;
    allocation_count: number;
    topics: Array<{ topic: string; count: number }>;
  }>> => {
    const response = await apiClient.get('/applicants/analytics/research-group-themes');
    return response.data;
  },

  /**
   * Get correlation matrix between accelerators and research group themes
   */
  getAcceleratorResearchThemeCorrelation: async (): Promise<Array<{
    accelerator: string;
    research_themes: Record<string, number>;
    total_allocations: number;
  }>> => {
    const response = await apiClient.get('/applicants/analytics/accelerator-research-theme-correlation');
    return response.data;
  },

  /**
   * Get comprehensive staff capacity and load analytics
   */
  getStaffCapacityAnalytics: async (): Promise<{
    summary: {
      total_staff: number;
      staff_with_capacity_phd: number;
      staff_at_capacity_phd: number;
      staff_over_capacity_phd: number;
      staff_with_capacity_mres: number;
      staff_at_capacity_mres: number;
      staff_over_capacity_mres: number;
      total_phd_capacity: number;
      total_phd_used: number;
      total_phd_available: number;
      total_mres_capacity: number;
      total_mres_used: number;
      total_mres_available: number;
    };
    staff_details: Array<{
      staff_id: string;
      full_name: string;
      email: string;
      school: string;
      research_group: string;
      current_phd_supervisions: number;
      max_phd_supervisions: number;
      phd_utilization_percent: number;
      current_mres_supervisions: number;
      max_mres_supervisions: number;
      mres_utilization_percent: number;
      capacity_status_phd: string;
      capacity_status_mres: string;
      total_allocations: number;
      confirmed_allocations: number;
    }>;
    by_school: Array<{
      school: string;
      total_staff: number;
      total_phd_capacity: number;
      total_phd_used: number;
      total_mres_capacity: number;
      total_mres_used: number;
    }>;
    by_research_group: Array<{
      research_group: string;
      total_staff: number;
      total_phd_capacity: number;
      total_phd_used: number;
      total_mres_capacity: number;
      total_mres_used: number;
    }>;
  }> => {
    const response = await apiClient.get('/applicants/analytics/staff-capacity');
    return response.data;
  },

  /**
   * Get acceptance and rejection rates analytics
   */
  getAcceptanceRatesAnalytics: async (): Promise<{
    overall: {
      total_applications: number;
      accepted: number;
      rejected: number;
      pending: number;
      acceptance_rate: number;
      rejection_rate: number;
      pending_rate: number;
    };
    by_degree_type: Record<string, {
      total: number;
      accepted: number;
      rejected: number;
      pending: number;
      acceptance_rate: number;
      rejection_rate: number;
    }>;
    by_intake: Array<{
      intake_year: number;
      intake_term: string;
      total: number;
      accepted: number;
      rejected: number;
      pending: number;
      acceptance_rate: number;
      rejection_rate: number;
    }>;
    by_staff: Array<{
      staff_id: string;
      staff_name: string;
      school: string;
      research_group: string;
      total_allocations: number;
      confirmed_allocations: number;
      applicants_accepted: number;
      applicants_rejected: number;
      applicants_pending: number;
      acceptance_rate: number;
      rejection_rate: number;
      pending_rate: number;
    }>;
    trends: Array<{
      period: string;
      accepted: number;
      rejected: number;
      total: number;
      acceptance_rate: number;
    }>;
  }> => {
    const response = await apiClient.get('/applicants/analytics/acceptance-rates');
    return response.data;
  },

  /**
   * Check if participant email can be sent for this applicant
   */
  canEmailParticipant: async (id: string): Promise<{ canEmail: boolean; reason?: string }> => {
    const response = await apiClient.get<{ canEmail: boolean; reason?: string }>(
      `/applicants/${id}/can-email-participant`
    );
    return response.data;
  },

  /**
   * Send participant email to applicant with supervisors CC'd
   */
  emailParticipant: async (id: string): Promise<{ success: boolean; message: string; message_id?: string; sent_at?: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string; message_id?: string; sent_at?: string }>(
      `/applicants/${id}/email-participant`
    );
    return response.data;
  },

  /**
   * Get applicant profile with degrees
   */
  getProfile: async (id: string): Promise<{
    applicant_id: string;
    full_name: string;
    email?: string;
    profile: {
      date_of_birth?: string;
      nationality?: string;
      country_of_residence?: string;
      phone_number?: string;
      address?: string;
      how_heard_about_usw?: string;
    };
    degrees: Array<{
      id: string;
      applicant_id: string;
      degree_type: string;
      subject_area?: string;
      university?: string;
      university_country?: string;
      classification?: string;
      year_completed?: number;
      created_at?: string;
      updated_at?: string;
    }>;
  }> => {
    const response = await apiClient.get(`/applicants/${id}/profile`);
    return response.data;
  },

  /**
   * Update applicant profile
   */
  updateProfile: async (id: string, data: {
    email?: string;
    date_of_birth?: string;
    nationality?: string;
    country_of_residence?: string;
    phone_number?: string;
    address?: string;
    how_heard_about_usw?: string;
  }): Promise<{ success: boolean; message: string; profile: ApplicantProfile }> => {
    const response = await apiClient.put(`/applicants/${id}/profile`, data);
    return response.data;
  },

  /**
   * Create a new degree for an applicant
   */
  createDegree: async (id: string, data: {
    degree_type: string;
    subject_area?: string;
    university?: string;
    university_country?: string;
    classification?: string;
    year_completed?: number;
  }): Promise<ApplicantDegree> => {
    const response = await apiClient.post<ApplicantDegree>(`/applicants/${id}/degrees`, data);
    return response.data;
  },

  /**
   * Update an applicant's degree
   */
  updateDegree: async (applicantId: string, degreeId: string, data: Partial<ApplicantDegree>): Promise<ApplicantDegree> => {
    const response = await apiClient.put<ApplicantDegree>(`/applicants/${applicantId}/degrees/${degreeId}`, data);
    return response.data;
  },

  /**
   * Delete an applicant's degree
   */
  deleteDegree: async (applicantId: string, degreeId: string): Promise<void> => {
    await apiClient.delete(`/applicants/${applicantId}/degrees/${degreeId}`);
  },
};

