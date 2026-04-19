import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import clsx from 'clsx';

const COLORS = ['#22c55e', '#3b82f6', '#f97316'];

interface TaskRow {
  status: string;
  created_at: string;
  assigned_to: { name: string } | null;
  team_leader: { name: string } | null;
}

export default function Reports() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const isFirstRender = useRef(true);

  const fetchTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to:assigned_to_id(name),
        team_leader:team_leader_id(name)
      `);
      
    if (data && !error) {
      setTasks(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks(isFirstRender.current === false);
    isFirstRender.current = false;
  }, [fetchTasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
    if (dateFilter === 'all') return true;
    
    const taskDate = parseISO(task.created_at);
    const now = new Date();
    
    if (dateFilter === 'week') {
      return isWithinInterval(taskDate, { start: startOfWeek(now), end: endOfWeek(now) });
    }
    
    if (dateFilter === 'month') {
      return isWithinInterval(taskDate, { start: startOfMonth(now), end: endOfMonth(now) });
    }
    
    return true;
  });

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'completed').length;
  const inProgress = filteredTasks.filter(t => t.status === 'in-progress').length;
  const pending = filteredTasks.filter(t => t.status === 'pending').length;

  const pieData = [
    { name: 'Completed', value: completed },
    { name: 'In Progress', value: inProgress },
    { name: 'Pending', value: pending },
  ];

  // Helper to construct performance data
  const buildPerformanceData = (roleKey: 'assigned_to' | 'team_leader') => {
    const map: Record<string, { name: string; completed: number; pending: number }> = {};

    filteredTasks.forEach(t => {
      const u = t[roleKey];
      if (!u) return;

      if (!map[u.name]) {
        map[u.name] = { name: u.name, completed: 0, pending: 0 };
      }

      if (t.status === 'completed') {
        map[u.name].completed += 1;
      } else {
        map[u.name].pending += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.completed - a.completed);
  };

  const staffData = buildPerformanceData('assigned_to');
  const tlData = buildPerformanceData('team_leader');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize task progress and team performance</p>
        </div>
        
        <div className="inline-flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {(['all', 'week', 'month'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors",
                dateFilter === filter 
                  ? "bg-slate-900 text-white" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {filter === 'all' ? 'All Time' : `This ${filter}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Work', value: total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Completed', value: completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Progress', value: inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: pending, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-sm font-medium text-gray-500">{stat.label}</span>
            <span className={clsx("text-4xl font-bold mt-2", stat.color)}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Staff Performance</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Team Leader Performance</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tlData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
