import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Outlet />
    </div>
  );
}
