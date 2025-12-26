import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  Settings as SettingsIcon,
  LogOut,
  BarChart3,
  Calendar as CalendarIcon,
  UserCircle,
  SquareUser
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const [collapsed, setCollapsed] = useState(true);
  const { signOut, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: SquareUser },
    { id: 'stock', label: 'Stock', icon: Car },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      // Silently handle logout errors
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-card flex flex-col transition-all duration-300 z-[100] overflow-hidden ${collapsed ? 'w-[70px]' : 'w-[240px]'}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="p-4 flex items-center justify-between min-h-[80px] border-b border-gray-700">
        {!collapsed ? (
          <div className="flex items-center gap-3 animate-fade-in">
            <img src="/coreagents-logo-sidebar.png" alt="CoreAgents" className="h-10 w-10 object-contain shrink-0" />
            <h2 className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">CoreAgents</h2>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <img src="/coreagents-logo-sidebar.png" alt="CoreAgents" className="h-10 w-10 object-contain" />
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex items-center gap-3 py-3.5 px-4 rounded-lg text-[0.9375rem] font-medium transition-all duration-200 relative overflow-hidden w-full cursor-pointer text-left group
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-elevated hover:text-foreground hover:translate-x-1'
                }
                ${collapsed ? 'justify-center p-3.5 hover:translate-x-0' : ''}
              `}
              aria-label={item.label}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-700 flex flex-col gap-2">
        <div className={`flex items-center gap-3 p-2 rounded-md transition-all duration-200 cursor-pointer hover:bg-elevated ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shrink-0">
            <UserCircle size={20} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-foreground">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="text-xs text-muted">Gerente</div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.9375rem] font-medium transition-all duration-200 text-muted hover:bg-red-500/10 hover:text-red-400 w-full ${collapsed ? 'justify-center' : ''}`}
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
