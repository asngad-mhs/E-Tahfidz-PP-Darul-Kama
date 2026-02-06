import React from 'react';
import { User } from '../types';
import { Button } from './Button';

interface DashboardProps {
    user: User | null;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="bg-emerald-900 text-white w-full md:w-64 hidden md:flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-emerald-800 text-center">
                    <h1 className="font-arab text-xl font-bold">Darul Kamal</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-emerald-800 rounded-lg font-medium transition hover:bg-emerald-700">
                        <i className="fas fa-home mr-3"></i> Dashboard
                    </button>
                    {/* Placeholder for future menu items */}
                    <button className="w-full text-left px-4 py-3 rounded-lg font-medium transition hover:bg-emerald-800 opacity-50 cursor-not-allowed">
                        <i className="fas fa-book-quran mr-3"></i> Hafalan (Segera)
                    </button>
                </nav>
            </aside>

            {/* Mobile Header (Visible only on small screens) */}
            <header className="md:hidden bg-emerald-900 text-white p-4 flex justify-between items-center shadow-md">
                 <h1 className="font-arab text-lg font-bold">Darul Kamal</h1>
                 <button className="text-white hover:text-emerald-200">
                    <i className="fas fa-bars text-xl"></i>
                 </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                    <Button 
                        variant="danger" 
                        onClick={onLogout} 
                        className="py-2 px-4 text-sm"
                        icon="fas fa-sign-out-alt"
                    >
                        Keluar
                    </Button>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 text-emerald-800 border-b pb-2">
                        <i className="fas fa-user-circle mr-2"></i> Selamat Datang
                    </h3>
                    <div className="prose text-gray-600">
                        <p className="text-lg">
                            Assalamu'alaikum, <span className="font-bold text-gray-900">{user?.nama || 'Santri'}</span>.
                        </p>
                        <p className="mt-2 text-sm bg-blue-50 text-blue-800 p-3 rounded inline-block">
                            <i className="fas fa-check-circle mr-1"></i> Sesi Cloudflare aktif. Sistem siap digunakan.
                        </p>
                    </div>
                </div>

                {/* Stats Cards Example */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                        <div className="text-gray-500 text-sm font-medium uppercase">Total Hafalan</div>
                        <div className="text-3xl font-bold text-emerald-700 mt-2">0 Juz</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                        <div className="text-gray-500 text-sm font-medium uppercase">Kehadiran</div>
                        <div className="text-3xl font-bold text-blue-700 mt-2">100%</div>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                        <div className="text-gray-500 text-sm font-medium uppercase">Status</div>
                        <div className="text-3xl font-bold text-green-600 mt-2">Aktif</div>
                    </div>
                </div>
            </main>
        </div>
    );
};