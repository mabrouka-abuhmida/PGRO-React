import { apiClient } from './api';

export interface InterviewRecord {
  id: string;
  allocation_id: string;
  applicant_id: string;
  staff_id: string;
  status: 'IN_PROCESS' | 'COMPLETED';
  applicant_name?: string;
  staff_name?: string;
  staff_school?: string;
  role?: string;
  
  // Form fields
  interviewer_name?: string;
  applicant_name_interview?: string;
  interview_date?: string;
  interview_location?: string;
  educational_background?: string;
  work_experience?: string;
  research_experience?: string;
  research_topic_clarity?: string;
  research_objectives_understanding?: string;
  methodology_knowledge?: string;
  literature_awareness?: string;
  motivation_for_research?: string;
  understanding_of_phd_demands?: boolean;
  time_commitment_feasibility?: string;
  analytical_skills?: string;
  writing_communication_skills?: string;
  critical_thinking?: string;
  technical_skills?: string;
  expectations_from_supervision?: string;
  working_style_preference?: string;
  support_needs?: string;
  strengths_observed?: string;
  areas_of_concern?: string;
  overall_impression?: string;
  recommendation?: string;
  additional_notes?: string;
  
  is_submitted: boolean;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InterviewRecordCreate {
  allocation_id: string;
  staff_id: string;
  applicant_id: string;
  interview_date?: string;
  interview_location?: string;
  interviewer_name?: string;
  interview_notes?: string;
  cv_summary?: string;
  transcript_summary?: string;
  proposal_summary?: string;
  recommendation?: string;
  is_submitted?: boolean;
  [key: string]: string | boolean | undefined;
}

class InterviewRecordService {
  async list(params?: {
    applicant_id?: string;
    staff_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<InterviewRecord[]> {
    const queryParams = new URLSearchParams();
    if (params?.applicant_id) queryParams.append('applicant_id', params.applicant_id);
    if (params?.staff_id) queryParams.append('staff_id', params.staff_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const response = await apiClient.get<{ items: InterviewRecord[]; total: number; page: number; page_size: number } | InterviewRecord[]>(`/interview-records?${queryParams.toString()}`);
    // Handle paginated response (new format) or array response (old format for backward compatibility)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.items || [];
  }

  async get(id: string): Promise<InterviewRecord> {
    const response = await apiClient.get(`/interview-records/${id}`);
    return response.data;
  }

  async getByAllocation(allocationId: string): Promise<{ exists: boolean; id?: string; status?: string; is_submitted?: boolean }> {
    const response = await apiClient.get(`/interview-records/allocation/${allocationId}`);
    return response.data;
  }

  async createOrUpdate(data: InterviewRecordCreate): Promise<InterviewRecord> {
    const response = await apiClient.post('/interview-records', data);
    return response.data;
  }

  async sendInterviewEmail(
    recordId: string, 
    emailData: {
      interview_date: string;
      interview_location?: string;
      interviewer_name?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(
      `/interview-records/${recordId}/send-email`,
      emailData
    );
    return response.data;
  }

  async sendInterviewEmailWithOptions(
    recordId: string, 
    emailData: {
      interview_options: Array<{ date: string; time: string }>;
      interview_location?: string;
      interviewer_name?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(
      `/interview-records/${recordId}/send-email`,
      emailData
    );
    return response.data;
  }
}

export const interviewRecordService = new InterviewRecordService();


