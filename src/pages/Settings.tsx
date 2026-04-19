import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';
import { Trash2, UserPlus, Loader2, Plus, AlertCircle, ShieldHalf } from 'lucide-react';
import clsx from 'clsx';

interface PendingInvite {
  email: string;
  name: string;
  role: string;
  created_at: string;
}

// Hardcoded owners as per requirements
const OWNER_EMAILS = ['vijayadhithya.j@gmail.com', 'g3082492@gmail.com'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'staff' | 'work_types'>('staff');

  // Staff State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteName, setNewInviteName] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('staff');
  
  // Work Types State
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [newWorkType, setNewWorkType] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const [uRes, iRes, sRes] = await Promise.all([
      supabase.from('users').select('*').order('name'),
      supabase.from('pending_invites').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('work_types').eq('id', 'general').single()
    ]);
    
    if (uRes.data) setUsers(uRes.data);
    if (iRes.data) setInvites(iRes.data);
    if (sRes.data) setWorkTypes(sRes.data.work_types || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      fetchData();
      isFirstRender.current = false;
    }
  }, [fetchData]);

  // --- Staff Actions ---
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail || !newInviteName) return;
    
    // Safety check: Cannot invite as owner
    if (newInviteRole === 'owner') {
      alert('Ownership is strictly restricted and cannot be appointed.');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('pending_invites').insert([{
      email: newInviteEmail.toLowerCase(),
      name: newInviteName,
      role: newInviteRole
    }]);
    
    if (!error) {
      setNewInviteEmail('');
      setNewInviteName('');
      setNewInviteRole('staff');
      fetchData(false);
    } else {
      alert('Error: ' + error.message);
    }
    setIsSaving(false);
  };

  const handleDeleteInvite = async (email: string) => {
    if (!window.confirm(`Delete invite for ${email}?`)) return;
    await supabase.from('pending_invites').delete().eq('email', email);
    fetchData(false);
  };

  const handleUpdateUserRole = async (id: string, email: string, role: string) => {
    if (OWNER_EMAILS.includes(email) || role === 'owner') {
      alert('Ownership status is permanent and cannot be modified or granted manually.');
      return;
    }
    await supabase.from('users').update({ role }).eq('id', id);
    fetchData(false);
  };

  const handleDeleteUser = async (id: string, email: string, name: string) => {
    if (OWNER_EMAILS.includes(email)) {
      alert('Root owners cannot be deleted from the system.');
      return;
    }
    if (!window.confirm(`Are you sure you want to completely delete ${name}?`)) return;
    await supabase.from('users').delete().eq('id', id);
    fetchData(false);
  };

  // --- Work Type Actions ---
  const handleAddWorkType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkType.trim() || workTypes.includes(newWorkType)) return;
    
    setIsSaving(true);
    const updated = [...workTypes, newWorkType.trim()];
    const { error } = await supabase.from('settings').update({ work_types: updated }).eq('id', 'general');
    
    if (!error) {
      setWorkTypes(updated);
      setNewWorkType('');
    } else {
      alert('Error updating settings.');
    }
    setIsSaving(false);
  };

  const handleDeleteWorkType = async (type: string) => {
    const updated = workTypes.filter(t => t !== type);
    await supabase.from('settings').update({ work_types: updated }).eq('id', 'general');
    setWorkTypes(updated);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Configuration</h1>
        <p className="text-gray-500 mt-1 font-medium">Manage workforce hierarchies and architectural settings.</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
        <TabButton 
          active={activeTab === 'staff'} 
          onClick={() => setActiveTab('staff')} 
          label="Workforce Management" 
        />
        <TabButton 
          active={activeTab === 'work_types'} 
          onClick={() => setActiveTab('work_types')} 
          label="Service Classifications" 
        />
      </div>

      {activeTab === 'staff' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Add New Staff / Invite */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Pre-Authorize Personnel
            </h2>
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Officer Name</label>
                <input
                  type="text"
                  required
                  value={newInviteName}
                  onChange={e => setNewInviteName(e.target.value)}
                  className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  placeholder="e.g. Alexander Hamilton"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Secure Email</label>
                <input
                  type="email"
                  required
                  value={newInviteEmail}
                  onChange={e => setNewInviteEmail(e.target.value)}
                  className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  placeholder="name@firm.com"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Designation</label>
                <select
                  value={newInviteRole}
                  onChange={e => setNewInviteRole(e.target.value)}
                  className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white transition-all outline-none appearance-none"
                >
                  <option value="staff">Staff Member</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="viewer">Viewer (Restricted)</option>
                  {/* Owner option REMOVED as per requirements */}
                </select>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#111827] hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Synchronizing...' : 'Authorize User'}
              </button>
            </form>
          </div>

          {/* Users List Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Users */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShieldHalf className="w-4 h-4 text-indigo-600" />
                  Authorized Personnel
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{users.length} Records</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {users.map(u => {
                  const isRootOwner = OWNER_EMAILS.includes(u.email);
                  return (
                    <li key={u.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{u.name}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {isRootOwner ? (
                          <span className="bg-indigo-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                            Root Owner
                          </span>
                        ) : (
                          <>
                            <select
                              value={u.role}
                              onChange={e => handleUpdateUserRole(u.id, u.email, e.target.value)}
                              className="bg-gray-50 border-transparent rounded-lg py-1.5 px-3 text-[11px] font-bold focus:bg-white transition-all outline-none uppercase tracking-wide cursor-pointer"
                            >
                              <option value="staff">Staff</option>
                              <option value="team_leader">Lead</option>
                              <option value="viewer">View</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email, u.name)}
                              className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Pending Invites */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
              <div className="px-8 py-6 border-b border-gray-50 bg-amber-50/30 flex items-center justify-between">
                <h3 className="font-bold text-amber-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Pending Authorizations
                </h3>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{invites.length} Waiting</span>
              </div>
              {invites.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <p className="text-sm text-gray-400 italic font-medium">No pending security clearences.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {invites.map(invite => (
                    <li key={invite.email} className="px-8 py-5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-amber-900">{invite.name}</span>
                        <span className="text-[11px] text-amber-600/60 font-medium">{invite.email}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                          {invite.role.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleDeleteInvite(invite.email)}
                          className="text-red-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'work_types' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Service Protocols
            </h2>
            <form onSubmit={handleAddWorkType} className="flex gap-4 items-end max-w-2xl">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Service Classification Name</label>
                <input
                  type="text"
                  required
                  value={newWorkType}
                  onChange={e => setNewWorkType(e.target.value)}
                  className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  placeholder="e.g. Statutory Audit 2024"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#111827] hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Processing...' : 'Register Protocol'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workTypes.map(type => (
              <div key={type} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-colors flex items-center justify-between group">
                <span className="text-sm font-bold text-gray-800">{type}</span>
                <button
                  onClick={() => handleDeleteWorkType(type)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
        active ? "bg-white text-indigo-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {label}
    </button>
  );
}
