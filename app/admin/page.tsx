'use client';

import React from 'react';

export default function AdminDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-[#01334c] mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users Card */}
                <a href="/admin/users" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#01334c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">User Management</h3>
                    <p className="text-sm text-slate-500">Manage admin access and roles.</p>
                </a>

                {/* Templates Card */}
                <a href="/admin/templates" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">Template Manager</h3>
                    <p className="text-sm text-slate-500">Add, edit, and manage templates.</p>
                </a>
            </div>
        </div>
    );
}
