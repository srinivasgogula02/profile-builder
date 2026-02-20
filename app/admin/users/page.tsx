'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Shield, ShieldAlert, ShieldCheck, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        // We fetch profiles directly. 
        // Note: auth.users is not accessible from client SDK. We rely on 'profiles' table which should mirror users.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleAdmin = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_admin: !currentStatus })
            .eq('user_id', userId);

        if (error) {
            alert('Failed to update admin status');
            console.error(error);
        } else {
            // Optimistic update
            setUsers(users.map(u => u.user_id === userId ? { ...u, is_admin: !currentStatus } : u));
        }
    };

    const filteredUsers = users.filter(u =>
        JSON.stringify(u).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#01334c] flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8" />
                        User Management
                    </h1>
                    <p className="text-slate-500">Manage admin access and user roles</p>
                </div>
                <Link href="/admin" className="text-sm text-slate-500 hover:text-[#01334c]">
                    Back to Dashboard
                </Link>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#01334c]/20 outline-none"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Profile Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            {user.user_id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-[#01334c]">
                                                {user.profile_data?.fullName || 'Unnamed'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {user.profile_data?.professionalTitle}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_admin ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleAdmin(user.user_id, user.is_admin)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${user.is_admin
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                            </button>
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
