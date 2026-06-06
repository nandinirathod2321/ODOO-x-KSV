import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

export default function RoleGuard({ children, allowedRoles }) {
  const role = useAuthStore(state => state.role);
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
}
