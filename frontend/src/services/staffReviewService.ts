/**
 * Typed API client for Staff Review Service
 */
import { apiClient } from './api';

export interface StaffReview {
  id?: string;
  allocation_id: string;
  staff_id: string;
  applicant_id: string;
  
  // Header fields
  reviewer_name?: string;
  applicant_name_review?: string;
  review_date?: string;
  
  // Yes/No questions
  research_question_acceptable?: boolean | null;
  research_framework_acceptable?: boolean | null;
  writing_structure_acceptable?: boolean | null;
  contribution_to_field?: boolean | null;
  recommend_for_supervision?: boolean | null;
  prepared_to_supervise?: boolean | null;
  sufficient_ethics?: boolean | null;
  suggested_supervisors?: string;
  
  // Risk assessment
  overseas_research_risk?: boolean | null;
  reputational_risk?: boolean | null;
  risk_matrix_completed?: boolean | null;
  
  // Recommendation
  recommendation?: 'INTERVIEW_APPLICANT' | 'REVISE_PROPOSAL' | 'REJECT' | null;
  
  // Summary and comments
  reasons_summary?: string;
  comments_to_applicant?: string;
  date_returned_to_graduate_school?: string;
  
  // Legacy fields (for backward compatibility)
  decision?: 'ACCEPT' | 'REJECT' | 'NEEDS_INTERVIEW' | null;
  research_quality_score?: string;
  research_quality_comments?: string;
  methodology_score?: string;
  methodology_comments?: string;
  feasibility_score?: string;
  feasibility_comments?: string;
  originality_score?: string;
  originality_comments?: string;
  alignment_with_supervisor_expertise?: string;
  applicant_background_score?: string;
  applicant_background_comments?: string;
  overall_assessment?: string;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  additional_comments?: string;
  
  // AI review
  ai_critical_review?: string;
  ai_review_generated_at?: string;
  
  // Submission tracking
  is_submitted: boolean;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffReviewCreate {
  allocation_id: string;
  staff_id: string;
  applicant_id: string;
  
  // Header fields
  reviewer_name?: string;
  applicant_name_review?: string;
  review_date?: string;
  
  // Yes/No questions
  research_question_acceptable?: boolean | null;
  research_framework_acceptable?: boolean | null;
  writing_structure_acceptable?: boolean | null;
  contribution_to_field?: boolean | null;
  recommend_for_supervision?: boolean | null;
  prepared_to_supervise?: boolean | null;
  sufficient_ethics?: boolean | null;
  suggested_supervisors?: string;
  
  // Risk assessment
  overseas_research_risk?: boolean | null;
  reputational_risk?: boolean | null;
  risk_matrix_completed?: boolean | null;
  
  // Recommendation
  recommendation?: 'INTERVIEW_APPLICANT' | 'REVISE_PROPOSAL' | 'REJECT' | null;
  
  // Summary and comments
  reasons_summary?: string;
  comments_to_applicant?: string;
  date_returned_to_graduate_school?: string;
  
  // Legacy fields
  decision?: 'ACCEPT' | 'REJECT' | 'NEEDS_INTERVIEW' | null;
  is_submitted?: boolean;
}

export interface StaffReviewListItem {
  id: string;
  allocation_id: string;
  staff_id: string;
  applicant_id: string;
  applicant_name?: string;
  staff_name?: string;
  staff_school?: string;
  role?: string;
  reviewer_name?: string;
  applicant_name_review?: string;
  review_date?: string;
  recommendation?: string;
  is_submitted: boolean;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const staffReviewService = {
  /**
   * List all staff reviews
   */
  list: async (isSubmitted?: boolean, page?: number, page_size?: number): Promise<StaffReviewListItem[]> => {
    const params: Record<string, string | number> = {};
    if (isSubmitted !== undefined) params.is_submitted = isSubmitted.toString();
    if (page !== undefined) params.page = page;
    if (page_size !== undefined) params.page_size = page_size;
    
    const response = await apiClient.get<{ items: StaffReviewListItem[]; total: number; page: number; page_size: number } | StaffReviewListItem[]>('/staff-reviews', { params });
    // Handle paginated response (new format) or array response (old format for backward compatibility)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.items || [];
  },

  /**
   * Get a specific staff review by ID
   */
  get: async (reviewId: string): Promise<StaffReview> => {
    const response = await apiClient.get<StaffReview>(`/staff-reviews/${reviewId}`);
    return response.data;
  },

  /**
   * Get staff review for an allocation
   */
  getByAllocation: async (allocationId: string): Promise<StaffReview | null> => {
    const response = await apiClient.get<StaffReview | null>(`/staff-reviews/allocation/${allocationId}`);
    return response.data;
  },

  /**
   * Create or update staff review
   */
  createOrUpdate: async (data: StaffReviewCreate): Promise<StaffReview> => {
    const response = await apiClient.post<StaffReview>('/staff-reviews', data);
    return response.data;
  },

  /**
   * Generate AI critical review
   */
  generateAIReview: async (allocationId: string): Promise<{ ai_critical_review: string; ai_review_generated_at?: string }> => {
    const response = await apiClient.post<{ ai_critical_review: string; ai_review_generated_at?: string }>(
      `/staff-reviews/${allocationId}/generate-ai-review`
    );
    return response.data;
  },
};

