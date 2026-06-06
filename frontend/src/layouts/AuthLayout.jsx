import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-card w-full max-w-md p-8">
        <Outlet />
      </div>
    </div>
  );
}
