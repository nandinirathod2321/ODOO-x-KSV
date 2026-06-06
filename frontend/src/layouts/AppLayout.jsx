import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="w-64 bg-neutral-900 text-white flex-shrink-0">
        <div className="p-4 font-bold text-xl">VendorBridge</div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="font-semibold text-neutral-800">Dashboard</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
