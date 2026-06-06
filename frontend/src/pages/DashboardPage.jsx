import useAuthStore from '../store/authStore.js';

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome back, {user?.name}</h1>
      <p className="text-neutral-600">This is your Dashboard.</p>
    </div>
  );
}
