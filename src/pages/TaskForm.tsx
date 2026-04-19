import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Task, UserProfile } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { Save, X, Loader2, AlertCircle, Calendar, User as UserIcon, FileText } from 'lucide-react';

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<Task>>({
    client_name: '',
    gst_number: '',
    pan_number: '',
    work_type: '',
    assigned_to_id: '',
    team_leader_id: '',
    received_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'pending',
    delay_reason: '',
    remarks: ''
  });

  const isInitialMount = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch settings for work types
      const { data: settings } = await supabase.from('settings').select('*').eq('id', 'general').single();
      if (settings) setWorkTypes(settings.work_types);

      // Fetch users for dropdowns
      const { data: userData } = await supabase.from('users').select('*').order('name');
      if (userData) setUsers(userData);

      if (id) {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single();
        
        if (taskError) throw taskError;
        if (task) setFormData(task);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchData();
      isInitialMount.current = false;
    }
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (id) {
        // Prepare update data
        const updateData: any = { ...formData };
        
        // Remove read-only system fields to avoid DB errors
        delete updateData.id;
        delete updateData.serial_number;
        delete updateData.created_at;
        delete updateData.created_by;

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id);
        
        if (updateError) throw updateError;
      } else {
        // Only owners can create tasks
        if (profile?.role !== 'owner') {
          throw new Error('Only owners can create new tasks.');
        }

        const { error: insertError } = await supabase
          .from('tasks')
          .insert([{ ...formData, created_by: profile?.id }]);
        
        if (insertError) throw insertError;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isOwner = profile?.role === 'owner';
  const isTeamLeader = profile?.role === 'team_leader';
  const isStaff = profile?.role === 'staff';

  // Role-based restrictions:
  // Staff can ONLY edit: status, delay_reason, remarks
  const isFieldReadOnly = (fieldName: string) => {
    if (isOwner) return false;
    if (isTeamLeader) {
      // Leaders can change information, but maybe only owners can appoint?
      // "task can be appointed by the owner" implies assigned_to_id is for owners.
      if (fieldName === 'assigned_to_id' || fieldName === 'team_leader_id') return true;
      return false;
    }
    if (isStaff) {
      // Staff can ONLY update status and remarks/delay_reason
      const allowed = ['status', 'delay_reason', 'remarks'];
      return !allowed.includes(fieldName);
    }
    return true; // Viewers or unknown
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Task' : 'New Task Creation'}
        </h1>
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Information Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-indigo-50 p-2 rounded-lg">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Client Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client Name</label>
              <input
                type="text"
                required
                readOnly={isFieldReadOnly('client_name')}
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                placeholder="Enter client or entity name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Work Type</label>
              <select
                required
                disabled={isFieldReadOnly('work_type')}
                value={formData.work_type}
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-600 transition-all outline-none"
              >
                <option value="">Select Audit/Service Type</option>
                {workTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GST Number (Optional)</label>
              <input
                type="text"
                readOnly={isFieldReadOnly('gst_number')}
                value={formData.gst_number || ''}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white outline-none"
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PAN Number (Optional)</label>
              <input
                type="text"
                readOnly={isFieldReadOnly('pan_number')}
                value={formData.pan_number || ''}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white outline-none"
                placeholder="e.g., ABCDE1234F"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Assignment Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <UserIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Assignment & Dates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign to Staff</label>
              <select
                disabled={isFieldReadOnly('assigned_to_id')}
                value={formData.assigned_to_id || ''}
                onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white transition-all outline-none"
              >
                <option value="">Select Staff Member</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Team Leader</label>
              <select
                disabled={isFieldReadOnly('team_leader_id')}
                value={formData.team_leader_id || ''}
                onChange={(e) => setFormData({ ...formData, team_leader_id: e.target.value })}
                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white transition-all outline-none"
              >
                <option value="">Select Team Leader</option>
                {users.filter(u => u.role === 'team_leader' || u.role === 'owner').map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Received Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  readOnly={isFieldReadOnly('received_date')}
                  value={formData.received_date}
                  onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                  className="w-full bg-gray-50 border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:bg-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  readOnly={isFieldReadOnly('due_date')}
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-gray-50 border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status & Updates Section */}
        <div className="bg-indigo-900 rounded-2xl p-8 shadow-xl border border-indigo-800 text-white">
          <h2 className="text-xl font-bold mb-6">Status & Resolution Updates</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">Current Pipeline Status</label>
              <div className="flex flex-wrap gap-3">
                {['pending', 'in-progress', 'completed'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s as any })}
                    className={clsx(
                      "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                      formData.status === s 
                        ? "bg-white text-indigo-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                        : "bg-indigo-800/50 text-indigo-200 border border-indigo-700 hover:bg-indigo-800"
                    )}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Delay Reasons (Audit Trail)</label>
                <textarea
                  value={formData.delay_reason || ''}
                  onChange={(e) => setFormData({ ...formData, delay_reason: e.target.value })}
                  className="w-full bg-indigo-950/40 border-indigo-800 rounded-xl px-4 py-3 text-sm focus:bg-indigo-950 focus:border-indigo-400 outline-none min-h-[100px] placeholder:text-indigo-800"
                  placeholder="Note any delays mentioned by client or staff..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Internal Remarks</label>
                <textarea
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-indigo-950/40 border-indigo-800 rounded-xl px-4 py-3 text-sm focus:bg-indigo-950 focus:border-indigo-400 outline-none min-h-[100px] placeholder:text-indigo-800"
                  placeholder="Final observations or internal notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-8 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            Cancel Changes
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-10 py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Synchronizing...' : id ? 'Update Record' : 'Commit Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Simple clsx replacement for local use to avoid dependency issues in this complex form
function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
