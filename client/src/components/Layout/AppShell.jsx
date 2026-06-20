import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Topbar onToggle={() => setCollapsed(c => !c)} />
      <Sidebar collapsed={collapsed} />
      <main className={`app-shell-content ${collapsed ? 'collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}
