import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { LayoutDashboard, FilePlus, BarChart3, Settings as SettingsIcon, LogOut } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const { profile, signOut } = useAuth();
  
  if (!profile) return null;

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-black text-slate-900">CJ</span>
          </div>
          VERIXA
        </h1>
      </div>

      <div className="flex-1 px-4 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        {['owner', 'staff', 'team_leader'].includes(profile.role) && (
          <NavLink
            to="/tasks/new"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <FilePlus className="w-5 h-5" />
            New Task
          </NavLink>
        )}

        {['owner', 'viewer'].includes(profile.role) && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <BarChart3 className="w-5 h-5" />
            Reports
          </NavLink>
        )}

        {profile.role === 'owner' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <SettingsIcon className="w-5 h-5" />
            Settings
          </NavLink>
        )}
      </div>

      <div className="p-4 bg-slate-950/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
            {getInitials(profile.name)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{profile.name}</p>
            <p className="text-xs text-slate-400 capitalize">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
        
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
