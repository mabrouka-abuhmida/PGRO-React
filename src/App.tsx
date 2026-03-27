/**
 * Main App component with routing
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { StaffLayout } from '@/layouts/StaffLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StaffProvider } from '@/contexts/StaffContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute, LoadingFallback, ErrorBoundary } from '@/components';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';

// Lazy load pages for code splitting
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Applicants = lazy(() => import('@/pages/Applicants').then(m => ({ default: m.Applicants })));
const ApplicantDetail = lazy(() => import('@/pages/ApplicantDetail').then(m => ({ default: m.ApplicantDetail })));
const Allocations = lazy(() => import('@/pages/Allocations').then(m => ({ default: m.Allocations })));
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })));
const StaffAllocations = lazy(() => import('@/pages/StaffAllocations').then(m => ({ default: m.StaffAllocations })));
const StaffProfile = lazy(() => import('@/pages/StaffProfile').then(m => ({ default: m.StaffProfile })));
const StaffReview = lazy(() => import('@/pages/StaffReview').then(m => ({ default: m.StaffReview })));
const AdminStaff = lazy(() => import('@/pages/AdminStaff').then(m => ({ default: m.AdminStaff })));
const AdminStaffDetail = lazy(() => import('@/pages/AdminStaffDetail').then(m => ({ default: m.AdminStaffDetail })));
const RedirectStaffDetail = lazy(() => import('@/pages/RedirectStaff').then(m => ({ default: m.RedirectStaffDetail })));
const AllocationNotesPage = lazy(() => import('@/pages/AllocationNotes/AllocationNotesPage').then(m => ({ default: m.AllocationNotesPage })));
const InterviewRecords = lazy(() => import('@/pages/InterviewRecords').then(m => ({ default: m.InterviewRecords })));
const InterviewDetail = lazy(() => import('@/pages/InterviewDetail').then(m => ({ default: m.InterviewDetail })));
const ReviewRecords = lazy(() => import('@/pages/ReviewRecords').then(m => ({ default: m.ReviewRecords })));
const ReviewDetail = lazy(() => import('@/pages/ReviewDetail').then(m => ({ default: m.ReviewDetail })));
const StaffInterviews = lazy(() => import('@/pages/StaffInterviews').then(m => ({ default: m.StaffInterviews })));
const StaffInterviewForm = lazy(() => import('@/pages/StaffInterviewForm').then(m => ({ default: m.StaffInterviewForm })));
const InterviewScheduler = lazy(() => import('@/pages/StaffInterviewForm/InterviewScheduler').then(m => ({ default: m.InterviewScheduler })));
const InterviewAccept = lazy(() => import('@/pages/InterviewAccept/InterviewAccept').then(m => ({ default: m.InterviewAccept })));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
        {/* Landing page - root route */}
        <Route path="/" element={<Landing />} />
        
        {/* Public interview acceptance route - no auth required */}
        <Route path="/interview-accept/:recordId" element={<InterviewAccept />} />
        
        {/* PGRO routes */}
        <Route path="/pgro" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="applicants/:id" element={<ApplicantDetail />} />
          <Route path="allocations" element={<Allocations />} />
          <Route path="allocations/:allocationId/notes" element={<AllocationNotesPage />} />
          <Route path="review-records" element={<ReviewRecords />} />
          <Route path="review-records/:id" element={<ReviewDetail />} />
          <Route path="interview-records" element={<InterviewRecords />} />
          <Route path="interview-records/:id" element={<InterviewDetail />} />
          <Route
            path="analytics"
            element={
              <ProtectedRoute requiredRole="SMT" redirectTo="/pgro/dashboard">
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Legacy PGRO routes - redirect to /pgro paths */}
        <Route path="/applicants" element={<MainLayout />}>
          <Route index element={<Applicants />} />
        </Route>
        <Route path="/applicants/:id" element={<MainLayout />}>
          <Route index element={<ApplicantDetail />} />
        </Route>
        <Route path="/allocations" element={<MainLayout />}>
          <Route index element={<Allocations />} />
        </Route>
        <Route path="/interview-records" element={<MainLayout />}>
          <Route index element={<InterviewRecords />} />
        </Route>
        <Route path="/interview-records/:id" element={<MainLayout />}>
          <Route index element={<InterviewDetail />} />
        </Route>
        <Route path="/analytics" element={<MainLayout />}>
          <Route
            index
            element={
              <ProtectedRoute requiredRole="SMT" redirectTo="/">
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Legacy staff routes - redirect to admin */}
        <Route path="/staff" element={<Navigate to="/admin/staff" replace />} />
        <Route path="/staff/:id" element={<RedirectStaffDetail />} />
        <Route path="/pgro/staff" element={<Navigate to="/admin/staff" replace />} />
        <Route path="/pgro/staff/:id" element={<RedirectStaffDetail />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<StaffProvider><AdminLayout /></StaffProvider>}>
          <Route index element={<Navigate to="/admin/staff" replace />} />
          <Route path="staff/:id" element={<AdminStaffDetail />} />
          <Route path="staff" element={<AdminStaff />} />
        </Route>
        
        {/* Staff routes - separate from PGRO staff list */}
        <Route path="/staff-portal" element={<StaffProvider><StaffLayout /></StaffProvider>}>
          <Route path="allocations" element={<StaffAllocations />} />
          <Route path="allocations/:allocationId/notes" element={<AllocationNotesPage />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="review/:allocationId" element={<StaffReview />} />
          <Route path="interviews" element={<StaffInterviews />} />
          <Route path="interviews/:id" element={<StaffInterviewForm />} />
          <Route path="interviews/:recordId/schedule" element={<InterviewScheduler />} />
        </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

