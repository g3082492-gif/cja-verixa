import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Task } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isInitialMount = useRef(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:users!tasks_assigned_to_id_fkey(name),
          team_leader:users!tasks_team_leader_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchTasks();
      isInitialMount.current = false;
    }
  }, [fetchTasks]);

  const filteredTasks = tasks.filter(task => 
    task.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Task Matrix</h1>
          <p className="text-gray-500 mt-1 font-medium">
            Welcome back, {profile?.name}. 
            {profile?.role === 'owner' 
              ? ' You are viewing the global task board.' 
              : ' Showing tasks assigned to your secure workspace.'}
          </p>
        </div>
        {profile?.role === 'owner' && (
          <Link
            to="/tasks/new"
            className="inline-flex items-center gap-2 bg-[#111827] hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-gray-200"
          >
            <Plus className="w-5 h-5" />
            Establish New Task
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Active Pipeline" 
          value={stats.total} 
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />} 
          color="blue"
        />
        <StatCard 
          label="Pending Audit" 
          value={stats.pending} 
          icon={<Clock className="w-5 h-5 text-amber-600" />} 
          color="amber"
        />
        <StatCard 
          label="In Progress" 
          value={stats.inProgress} 
          icon={<AlertCircle className="w-5 h-5 text-indigo-600" />} 
          color="indigo"
        />
        <StatCard 
          label="Completed" 
          value={stats.completed} 
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} 
          color="emerald"
        />
      </div>

      {/* Main Board */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Client or Task ID..."
                className="w-full pl-11 pr-4 py-3 bg-white border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-2xl text-sm transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              {['all', 'pending', 'in-progress', 'completed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${
                    filter === s ? 'bg-[#111827] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-4">Task Matrix / Client</th>
                <th className="px-6 py-4">Service Details</th>
                <th className="px-6 py-4">Responsibility</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-gray-400 mt-4 font-medium italic">Synchronizing with secure matrix...</p>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-medium italic">No active task matches your current parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="group hover:bg-gray-50/80 transition-all cursor-default">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{task.serial_number}</span>
                        <span className="text-sm font-bold text-gray-900 group-hover:text-black transition-colors">{task.client_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded w-fit mb-1 uppercase bg-opacity-70">{task.work_type}</span>
                        <span className="text-[11px] text-gray-400 font-mono truncate max-w-[150px]">{task.gst_number || 'NO GST RECORDED'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-white shadow-sm ring-2 ring-gray-50">
                          {(task as any).assigned_to?.name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">{(task as any).assigned_to?.name || 'Unassigned'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Lead: {(task as any).team_leader?.name || 'Manual'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1">Ref: {format(new Date(task.received_date), 'dd/MM')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        to={`/tasks/edit/${task.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#111827] transition-all bg-gray-100 p-2 rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        Detail View
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const bgColors: any = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bgColors[color]}`}>
          {icon}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
          <span className="text-2xl font-black text-gray-900 mt-1">{value}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
        <div className={`h-full bg-current ${bgColors[color]} transition-all`} style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'pending': 'bg-amber-100 text-amber-700 ring-amber-500/10',
    'in-progress': 'bg-indigo-100 text-indigo-700 ring-indigo-500/10',
    'completed': 'bg-emerald-100 text-emerald-700 ring-emerald-500/10'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
