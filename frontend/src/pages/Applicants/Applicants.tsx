/**
 * Applicants - List view with filters
 */
import React, { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Button, SkeletonGrid, ApplicantsList, ApplicantsFilters, ApplicantUploadModal, ManualEntryModal } from '@/components';
import { useApplicants, useDebounce } from '@/hooks';
import { documentService } from '@/services/documentService';
import { getMostRecentByCreatedAt } from '@/utils/sorting';
import './Applicants.css';

export const Applicants: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Batch upload modal state
  const [showModal, setShowModal] = useState(false);
  
  // Manual entry modal state
  const [showManualModal, setShowManualModal] = useState(false);
  
  const [filters, setFilters] = useState({
    intake_year: new Date().getFullYear(),
    status: '',
    degree_type: '',
    show_incomplete_only: false,
  });

  // Fetch applicants using TanStack Query
  const { data: applicantsData, isLoading: loading, refetch: refetchApplicants } = useApplicants({
    intake_year: filters.intake_year,
    status: filters.status || undefined,
    degree_type: filters.degree_type || undefined,
  });

  // Memoize applicants to prevent unnecessary re-renders
  const applicants = useMemo(() => applicantsData?.items || [], [applicantsData?.items]);

  // Debounce search query for client-side filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Optimized: Limit document checklist queries to first 50 applicants
  // This prevents N+1 query pattern when there are many applicants
  // Document checklists are cached, so subsequent views will use cache
  const limitedApplicants = useMemo(() => applicants.slice(0, 50), [applicants]);
  
  const documentQueries = useQueries({
    queries: limitedApplicants.map((applicant) => ({
      queryKey: ['document-checklist', applicant.id],
      queryFn: () => documentService.getChecklist(applicant.id),
      enabled: limitedApplicants.length > 0,
      retry: 1,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnMount: false, // Don't refetch if data is fresh
    })),
  });

  // Create document statuses map from queries
  const documentStatuses = useMemo(() => {
    const statusMap = new Map<string, { is_complete: boolean; missing_count: number }>();
    
    documentQueries.forEach((query, index) => {
      const applicant = limitedApplicants[index];
      if (!applicant) return;
      
      if (query.isLoading) {
        // While loading, don't show status
        return;
      }
      
      if (query.error || !query.data) {
        // If checklist fails, assume incomplete
        statusMap.set(applicant.id, {
          is_complete: false,
          missing_count: 3, // Assume all required docs missing
        });
      } else {
        statusMap.set(applicant.id, {
          is_complete: query.data.is_complete,
          missing_count: query.data.missing_documents.length,
        });
      }
    });
    
    return statusMap;
  }, [documentQueries, limitedApplicants]);

  // Fetch interview records for accepted applicants only
  const acceptedApplicants = useMemo(() => 
    applicants.filter(a => a.status === 'ACCEPTED').slice(0, 50),
    [applicants]
  );

  const interviewQueries = useQueries({
    queries: acceptedApplicants.map((applicant) => ({
      queryKey: ['interview-records', applicant.id],
      queryFn: async () => {
        const { interviewRecordService } = await import('@/services/interviewRecordService');
        return interviewRecordService.list({ applicant_id: applicant.id });
      },
      enabled: acceptedApplicants.length > 0,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
    })),
  });

  // Create interview statuses map from queries
  const interviewStatuses = useMemo(() => {
    const statusMap = new Map<string, 'IN_PROCESS' | 'COMPLETED' | null>();
    
    interviewQueries.forEach((query, index) => {
      const applicant = acceptedApplicants[index];
      if (!applicant) return;
      
      if (query.isLoading || query.error || !query.data) {
        // While loading or on error, no status
        return;
      }
      
      // Get the most recent interview record status
      const records = query.data || [];
      if (records.length > 0) {
        const mostRecent = getMostRecentByCreatedAt(records);
        if (mostRecent) {
          statusMap.set(applicant.id, mostRecent.status);
        }
      }
    });
    
    return statusMap;
  }, [interviewQueries, acceptedApplicants]);

  // Fetch staff reviews for all applicants to get recommendations
  const reviewQueries = useQueries({
    queries: limitedApplicants.map((applicant) => ({
      queryKey: ['staff-reviews', applicant.id],
      queryFn: async () => {
        const { staffReviewService } = await import('@/services/staffReviewService');
        // Fetch all reviews and filter by applicant_id
        const allReviews = await staffReviewService.list(undefined, 1, 100);
        return allReviews.filter((review: any) => review.applicant_id === applicant.id);
      },
      enabled: limitedApplicants.length > 0,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
    })),
  });

  // Create review statuses map from queries
  const reviewStatuses = useMemo(() => {
    const statusMap = new Map<string, 'submitted' | 'draft' | null>();
    
    reviewQueries.forEach((query, index) => {
      const applicant = limitedApplicants[index];
      if (!applicant) return;
      
      if (query.isLoading || query.error || !query.data) {
        // While loading or on error, no status
        return;
      }
      
      // Get the most recent review status
      const reviews = query.data || [];
      if (reviews.length > 0) {
        const mostRecentReview = getMostRecentByCreatedAt(reviews);
        if (mostRecentReview) {
          if (mostRecentReview.is_submitted) {
            statusMap.set(applicant.id, 'submitted');
          } else {
            statusMap.set(applicant.id, 'draft');
          }
        }
      }
    });
    
    return statusMap;
  }, [reviewQueries, limitedApplicants]);


  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleUploadSuccess = async () => {
    await refetchApplicants();
  };

  // Manual entry handlers
  const handleOpenManualModal = () => {
    setShowManualModal(true);
  };

  const handleCloseManualModal = () => {
    setShowManualModal(false);
  };

  const handleManualSuccess = async () => {
    await refetchApplicants();
  };


  // Filter applicants based on search query and incomplete filter
  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
    // Filter by incomplete documents if enabled
    if (filters.show_incomplete_only) {
      const docStatus = documentStatuses.get(applicant.id);
      if (docStatus?.is_complete) {
        return false; // Filter out complete applicants
      }
    }
    
    // Search filter (using debounced query)
    if (!debouncedSearchQuery.trim()) return true;
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    
    // Search in applicant name
    const matchesName = applicant.full_name?.toLowerCase().includes(query);
    
    // Search in email
    const matchesEmail = applicant.email?.toLowerCase().includes(query);
    
    // Search in status
    const statusText = applicant.status?.toLowerCase().replace(/_/g, ' ') || '';
    const matchesStatus = statusText.includes(query);
    
    // Search in degree type
    const matchesDegreeType = applicant.degree_type?.toLowerCase().includes(query);
    
    // Search in primary theme
    const matchesPrimaryTheme = applicant.primary_theme?.toLowerCase().includes(query);
    
    // Search in secondary theme
    const matchesSecondaryTheme = applicant.secondary_theme?.toLowerCase().includes(query);
    
    // Search in topic keywords
    const matchesTopics = applicant.topic_keywords?.some(topic => 
      topic.toLowerCase().includes(query)
    ) || false;
    
    // Search in summary text
    const matchesSummary = applicant.summary_text?.toLowerCase().includes(query);
    
    return matchesName || matchesEmail || matchesStatus || matchesDegreeType || 
           matchesPrimaryTheme || matchesSecondaryTheme || matchesTopics || matchesSummary;
  });
}, [applicants, filters, documentStatuses, debouncedSearchQuery]);

  return (
    <div className="applicants-page">
      <div className="page-header">
        <h1 className="h-hero">Applicants</h1>
        <div className="page-header-actions">
          <Button variant="outline" size="sm" onClick={handleOpenManualModal}>
            Add Applicant
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenModal}>
            Upload PDFs
          </Button>
        </div>
      </div>

      <ApplicantsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <ApplicantsList
          applicants={filteredApplicants}
          documentStatuses={documentStatuses}
          interviewStatuses={interviewStatuses}
          reviewStatuses={reviewStatuses}
          loading={loading}
        />
      )}

      {!loading && filteredApplicants.length === 0 && applicants.length > 0 && (
        <div className="empty-state">
          <p>No applicants found matching your search.</p>
        </div>
      )}

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={showManualModal}
        onClose={handleCloseManualModal}
        onSuccess={handleManualSuccess}
      />

      {/* Batch Upload Modal */}
      <ApplicantUploadModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleUploadSuccess}
      />

    </div>
  );
};

