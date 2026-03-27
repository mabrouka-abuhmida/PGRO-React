/**
 * Redirect component for staff detail routes
 */
import { Navigate, useParams } from 'react-router-dom';

export const RedirectStaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/staff/${id}`} replace />;
};

