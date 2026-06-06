import { Outlet } from 'react-router-dom';

export default function PrintLayout() {
  return (
    <div className="print-layout">
      <Outlet />
    </div>
  );
}
