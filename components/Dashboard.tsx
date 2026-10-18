import React, { useState } from 'react';
import { User, Santri, SetoranRecord } from '../types';
import { INITIAL_SANTRI, INITIAL_SETORAN, GOOGLE_SCRIPT_SAMPLE_CODE } from '../mockData';
import { Button } from './Button';

interface DashboardProps {
    user: User | null;
    onLogout: () => void;
    apiUrl?: string;
    setApiUrl?: (url: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, apiUrl = '', setApiUrl }) => {
    const isAdmin = user?.role === 'admin';
    const isUstadz = user?.role === 'ustadz';
    const isSantri = user?.role === 'santri';

    const [activeTab, setActiveTab] = useState<'dashboard' | 'santri' | 'setoran' | 'hafalan' | 'pengaturan'>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data state (persisted in local state for seamless demonstration)
    const [santriList, setSantriList] = useState<Santri[]>(INITIAL_SANTRI);
    const [setoranList, setSetoranList] = useState<SetoranRecord[]>(INITIAL_SETORAN);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState<'Semua' | 'Ziyadah' | "Muroja'ah">('Semua');

    // Modal Input Setoran Baru
    const [isAddSetoranOpen, setIsAddSetoranOpen] = useState(false);
    const [selectedSantriId, setSelectedSantriId] = useState(INITIAL_SANTRI[0]?.id || '');
    const [formJenis, setFormJenis] = useState<'Ziyadah' | "Muroja'ah">('Ziyadah');
    const [formSurat, setFormSurat] = useState('');
    const [formAyatAwal, setFormAyatAwal] = useState('1');
    const [formAyatAkhir, setFormAyatAkhir] = useState('10');
    const [formJuz, setFormJuz] = useState('1');
    const [formNilai, setFormNilai] = useState<'A (Mumtaz)' | 'B (Jayyid Jiddan)' | 'C (Jayyid)' | 'D (Maqbul)'>('A (Mumtaz)');
    const [formCatatan, setFormCatatan] = useState('');

    // Backend URL settings inside dashboard
    const [inputUrl, setInputUrl] = useState(apiUrl);
    const [urlSavedMessage, setUrlSavedMessage] = useState('');

    // Handle adding new setoran
    const handleSaveSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        const targetSantri = santriList.find(s => s.id === selectedSantriId) || santriList[0];
        const newRecord: SetoranRecord = {
            id: `set-${Date.now()}`,
            santriId: targetSantri.id,
            santriNama: targetSantri.nama,
            tanggal: new Date().toISOString().split('T')[0],
            jenis: formJenis,
            surat: formSurat || "Al-Fatihah",
            ayatAwal: parseInt(formAyatAwal) || 1,
            ayatAkhir: parseInt(formAyatAkhir) || 10,
            juz: parseInt(formJuz) || 1,
            nilai: formNilai,
            musyrif: user?.nama || 'Ustadz Pembina',
            catatan: formCatatan || 'Lancar, teruskan muroja\'ah'
        };

        setSetoranList([newRecord, ...setoranList]);

        // Update target santri's last surah
        setSantriList(santriList.map(s => {
            if (s.id === targetSantri.id) {
                return {
                    ...s,
                    suratTerakhir: `${formSurat || 'Al-Fatihah'} : ${formAyatAwal}-${formAyatAkhir}`
                };
            }
            return s;
        }));

        setIsAddSetoranOpen(false);
        // Reset form
        setFormSurat('');
        setFormCatatan('');
    };

    const handleSaveBackendUrl = () => {
        if (setApiUrl) {
            setApiUrl(inputUrl.trim());
        }
        localStorage.setItem('darul_kamal_api_url', inputUrl.trim());
        setUrlSavedMessage('URL Google Apps Script berhasil disimpan!');
        setTimeout(() => setUrlSavedMessage(''), 3000);
    };

    // Filter santri
    const filteredSantri = santriList.filter(s => 
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.halaqah.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter setoran
    const filteredSetoran = setoranList.filter(item => {
        const matchesJenis = filterJenis === 'Semua' || item.jenis === filterJenis;
        if (isSantri) {
            return matchesJenis && (item.santriNama.toLowerCase().includes(user?.nama?.toLowerCase() || '') || item.santriId === 's-1');
        }
        return matchesJenis;
    });

    // Current santri data if user is santri
    const currentSantriData = isSantri 
        ? santriList.find(s => s.nama.toLowerCase().includes(user?.nama?.toLowerCase() || '')) || santriList[0]
        : null;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar Desktop */}
            <aside className="bg-emerald-900 text-white w-full md:w-64 hidden md:flex flex-col shadow-2xl z-20 shrink-0">
                <div className="p-6 border-b border-emerald-800/80 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 mb-2 shadow-inner">
                        <i className="fas fa-quran text-xl"></i>
                    </div>
                    <h1 className="font-arab text-2xl font-bold tracking-wide">دار الكمال</h1>
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mt-0.5">E-Tahfidz</p>
                    <div className="mt-2.5">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                            isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            isUstadz ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                            {isAdmin ? 'Administrator' : isUstadz ? 'Ustadz / Musyrif' : 'Santri'}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 text-sm ${
                            activeTab === 'dashboard' ? 'bg-emerald-800 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'
                        }`}
                    >
                        <i className="fas fa-home w-5 text-center"></i>
                        <span>Dashboard</span>
                    </button>

                    {(isAdmin || isUstadz) && (
                        <button 
                            onClick={() => setActiveTab('santri')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 text-sm ${
                                activeTab === 'santri' ? 'bg-emerald-800 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'
                            }`}
                        >
                            <i className="fas fa-users w-5 text-center"></i>
                            <span>Data Santri</span>
                            <span className="ml-auto text-xs bg-emerald-700 px-2 py-0.5 rounded-full">{santriList.length}</span>
                        </button>
                    )}

                    <button 
                        onClick={() => setActiveTab('setoran')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 text-sm ${
                            activeTab === 'setoran' ? 'bg-emerald-800 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'
                        }`}
                    >
                        <i className="fas fa-book-reader w-5 text-center"></i>
                        <span>Catatan Setoran</span>
                        <span className="ml-auto text-xs bg-emerald-700 px-2 py-0.5 rounded-full">{setoranList.length}</span>
                    </button>

                    {isSantri && (
                        <button 
                            onClick={() => setActiveTab('hafalan')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 text-sm ${
                                activeTab === 'hafalan' ? 'bg-emerald-800 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'
                            }`}
                        >
                            <i className="fas fa-book-quran w-5 text-center"></i>
                            <span>Progres 30 Juz</span>
                        </button>
                    )}

                    <button 
                        onClick={() => setActiveTab('pengaturan')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 text-sm ${
                            activeTab === 'pengaturan' ? 'bg-emerald-800 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'
                        }`}
                    >
                        <i className="fas fa-cog w-5 text-center"></i>
                        <span>Pengaturan &amp; API</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/40">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-sm">
                            {user?.nama ? user.nama.charAt(0) : 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user?.nama || 'Pengguna'}</p>
                            <p className="text-[11px] text-emerald-300 truncate">{user?.kelas || user?.role || 'Pesantren'}</p>
                        </div>
                    </div>
                    <Button 
                        variant="danger" 
                        onClick={onLogout} 
                        className="w-full py-2 text-xs flex justify-center items-center"
                        icon="fas fa-sign-out-alt"
                    >
                        Keluar Akun
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden bg-emerald-900 text-white p-4 flex justify-between items-center shadow-md z-30 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200">
                        <i className="fas fa-quran text-sm"></i>
                    </div>
                    <h1 className="font-arab text-xl font-bold">Darul Kamal</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-800 px-2.5 py-1 rounded-full text-emerald-200 font-semibold">
                        {user?.nama?.split(' ')[0] || 'User'}
                    </span>
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-white hover:text-emerald-200 p-2"
                    >
                        <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
                    </button>
                </div>
            </header>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-emerald-950 text-white px-4 py-3 space-y-2 border-b border-emerald-800 z-30">
                    <button 
                        onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                        className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 text-sm flex items-center gap-2"
                    >
                        <i className="fas fa-home w-5"></i> Dashboard
                    </button>
                    {(isAdmin || isUstadz) && (
                        <button 
                            onClick={() => { setActiveTab('santri'); setMobileMenuOpen(false); }}
                            className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 text-sm flex items-center gap-2"
                        >
                            <i className="fas fa-users w-5"></i> Data Santri
                        </button>
                    )}
                    <button 
                        onClick={() => { setActiveTab('setoran'); setMobileMenuOpen(false); }}
                        className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 text-sm flex items-center gap-2"
                    >
                        <i className="fas fa-book-reader w-5"></i> Catatan Setoran
                    </button>
                    {isSantri && (
                        <button 
                            onClick={() => { setActiveTab('hafalan'); setMobileMenuOpen(false); }}
                            className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 text-sm flex items-center gap-2"
                        >
                            <i className="fas fa-book-quran w-5"></i> Progres 30 Juz
                        </button>
                    )}
                    <button 
                        onClick={() => { setActiveTab('pengaturan'); setMobileMenuOpen(false); }}
                        className="w-full text-left py-2 px-3 rounded hover:bg-emerald-900 text-sm flex items-center gap-2"
                    >
                        <i className="fas fa-cog w-5"></i> Pengaturan &amp; API
                    </button>
                    <button 
                        onClick={onLogout}
                        className="w-full text-left py-2 px-3 rounded bg-red-600/80 text-white text-sm font-semibold flex items-center gap-2 mt-2"
                    >
                        <i className="fas fa-sign-out-alt w-5"></i> Keluar
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {/* Top Bar inside content */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {activeTab === 'dashboard' && 'Beranda E-Tahfidz'}
                            {activeTab === 'santri' && 'Data Santri & Halaqah'}
                            {activeTab === 'setoran' && 'Catatan Setoran Hafalan'}
                            {activeTab === 'hafalan' && 'Peta Capaian 30 Juz'}
                            {activeTab === 'pengaturan' && 'Pengaturan & Integrasi Backend'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Pondok Pesantren Darul Kamal • Tahun Ajaran 1447 / 1448 H
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {(isAdmin || isUstadz) && activeTab !== 'pengaturan' && (
                            <button
                                onClick={() => setIsAddSetoranOpen(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                            >
                                <i className="fas fa-plus"></i>
                                <span>Input Setoran</span>
                            </button>
                        )}
                        <Button 
                            variant="danger" 
                            onClick={onLogout} 
                            className="hidden md:inline-flex py-2 px-3 text-xs"
                            icon="fas fa-sign-out-alt"
                        >
                            Keluar
                        </Button>
                    </div>
                </div>

                {/* TAB: DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Welcome Banner */}
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold mb-3">
                                    {isAdmin ? '👑 Mode Administrator' : isUstadz ? '📖 Pengampu Halaqah' : '🌟 Santri Tahfidz'}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold">
                                    Assalamu'alaikum, {user?.nama || 'Pengguna'}!
                                </h3>
                                <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                                    {isAdmin 
                                        ? 'Selamat datang di panel kendali E-Tahfidz. Anda dapat memantau santri, mengelola setoran, dan mengekspor laporan.'
                                        : isUstadz
                                        ? 'Semoga hari ini penuh berkah dalam membimbing para penghafal Al-Qur\'an di Pondok Pesantren Darul Kamal.'
                                        : 'Terus istiqomah menambah ziyadah hafalan dan menjaga muroja\'ah setiap hari. Al-Qur\'an adalah syafaat di hari kiamat.'}
                                </p>
                            </div>
                            <div className="absolute right-4 -bottom-6 text-white/10 font-arab text-9xl pointer-events-none select-none">
                                القرآن
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Santri</span>
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <i className="fas fa-users text-lg"></i>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mt-2">{santriList.length} Santri</div>
                                <p className="text-[11px] text-green-600 font-medium mt-1">
                                    <i className="fas fa-check-circle mr-1"></i>100% Status Aktif
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Setoran</span>
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <i className="fas fa-book-open text-lg"></i>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mt-2">{setoranList.length} Catatan</div>
                                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                    <i className="fas fa-history mr-1"></i>Ziyadah &amp; Muroja'ah
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        {isSantri ? 'Hafalan Anda' : 'Rata-rata Juz'}
                                    </span>
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <i className="fas fa-medal text-lg"></i>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mt-2">
                                    {isSantri ? `${currentSantriData?.totalHafalanJuz || user?.totalJuz || 7} Juz` : '12.3 Juz'}
                                </div>
                                <p className="text-[11px] text-amber-700 font-medium mt-1">
                                    <i className="fas fa-star mr-1"></i>Target Minimal: 30 Juz
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Backend Status</span>
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <i className="fas fa-server text-lg"></i>
                                    </div>
                                </div>
                                <div className="text-base font-bold text-gray-800 mt-2 truncate">
                                    {apiUrl && apiUrl.startsWith('https://script.google.com') ? 'Google Script' : 'Mode Offline'}
                                </div>
                                <p className="text-[11px] text-purple-700 font-medium mt-1">
                                    <i className="fas fa-shield-alt mr-1"></i>Data aman &amp; tersimpan
                                </p>
                            </div>
                        </div>

                        {/* Recent Setoran Table & Quick Action */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                        <i className="fas fa-history text-emerald-700"></i> Setoran Hafalan Terbaru
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Catatan ziyadah dan muroja'ah terkini</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('setoran')}
                                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs flex items-center gap-1 self-start sm:self-auto"
                                >
                                    Lihat Semua Catatan <i className="fas fa-arrow-right text-[10px]"></i>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 uppercase font-semibold">
                                            <th className="py-2.5 px-3 rounded-l-lg">Tanggal</th>
                                            <th className="py-2.5 px-3">Santri</th>
                                            <th className="py-2.5 px-3">Jenis</th>
                                            <th className="py-2.5 px-3">Surat &amp; Ayat</th>
                                            <th className="py-2.5 px-3">Juz</th>
                                            <th className="py-2.5 px-3">Nilai</th>
                                            <th className="py-2.5 px-3 rounded-r-lg">Musyrif</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {setoranList.slice(0, 5).map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/80 transition">
                                                <td className="py-3 px-3 text-gray-500 font-medium">{item.tanggal}</td>
                                                <td className="py-3 px-3 font-bold text-gray-800">{item.santriNama}</td>
                                                <td className="py-3 px-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.jenis === 'Ziyadah' 
                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {item.jenis}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-gray-700">
                                                    {item.surat} : {item.ayatAwal}-{item.ayatAkhir}
                                                </td>
                                                <td className="py-3 px-3 text-gray-600 font-medium">Juz {item.juz}</td>
                                                <td className="py-3 px-3">
                                                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {item.nilai}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-gray-600">{item.musyrif}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: DATA SANTRI */}
                {activeTab === 'santri' && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input
                                    type="text"
                                    placeholder="Cari santri berdasarkan Nama, NIS, atau Halaqah..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                                Menampilkan <strong>{filteredSantri.length}</strong> dari {santriList.length} santri
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSantri.map((santri) => (
                                <div key={santri.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                NIS: {santri.nis}
                                            </span>
                                            <h4 className="font-bold text-gray-900 text-sm mt-1.5">{santri.nama}</h4>
                                            <p className="text-xs text-gray-500">{santri.kelas}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-emerald-800">{santri.totalHafalanJuz} <span className="text-xs font-normal">Juz</span></div>
                                            <span className="text-[10px] text-gray-400">Total Hafalan</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-1.5">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Halaqah:</span>
                                            <span className="font-semibold text-gray-800">{santri.halaqah}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Musyrif:</span>
                                            <span className="font-semibold text-gray-800">{santri.musyrif}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Surat Terakhir:</span>
                                            <span className="font-semibold text-emerald-700">{santri.suratTerakhir}</span>
                                        </div>
                                    </div>

                                    {/* Progress bar to 30 Juz */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                            <span>Target 30 Juz</span>
                                            <span className="font-bold">{Math.round((santri.totalHafalanJuz / 30) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-emerald-600 h-full rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (santri.totalHafalanJuz / 30) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedSantriId(santri.id);
                                            setIsAddSetoranOpen(true);
                                        }}
                                        className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold py-2 rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fas fa-plus-circle text-emerald-600"></i>
                                        <span>Catat Setoran Santri Ini</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: SETORAN HAFALAN */}
                {activeTab === 'setoran' && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600">Filter Jenis:</span>
                                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
                                    {(['Semua', 'Ziyadah', "Muroja'ah"] as const).map(jenis => (
                                        <button
                                            key={jenis}
                                            onClick={() => setFilterJenis(jenis)}
                                            className={`px-3 py-1 rounded-md font-medium transition ${
                                                filterJenis === jenis ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {jenis}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsAddSetoranOpen(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                            >
                                <i className="fas fa-plus"></i> Tambah Setoran Baru
                            </button>
                        </div>

                        <div className="space-y-3">
                            {filteredSetoran.map(record => (
                                <div key={record.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-200 transition">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                record.jenis === 'Ziyadah' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                <i className={`fas ${record.jenis === 'Ziyadah' ? 'fa-plus' : 'fa-redo'}`}></i>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{record.santriNama}</h4>
                                                <p className="text-xs text-gray-500">
                                                    Tanggal: {record.tanggal} • Musyrif: {record.musyrif}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                record.jenis === 'Ziyadah' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {record.jenis}
                                            </span>
                                            <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold">
                                                {record.nilai}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-500">Materi Hafalan:</span>
                                            <p className="font-bold text-gray-800 text-sm mt-0.5">
                                                Surat {record.surat} (Ayat {record.ayatAwal} s/d {record.ayatAkhir}) • Juz {record.juz}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Catatan &amp; Evaluasi Musyrif:</span>
                                            <p className="italic text-gray-700 bg-gray-50 p-2 rounded-lg mt-0.5 border border-gray-100">
                                                "{record.catatan || 'Lancar tanpa catatan khusus'}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: PROGRES 30 JUZ (SANTRI) */}
                {activeTab === 'hafalan' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h3 className="font-bold text-gray-800 text-base mb-2">Peta Capaian 30 Juz Al-Qur'an</h3>
                            <p className="text-xs text-gray-500 mb-6">
                                Kotak hijau menandakan juz yang telah selesai disetorkan dan dimuroja'ah.
                            </p>

                            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => {
                                    const totalSantriJuz = currentSantriData?.totalHafalanJuz || user?.totalJuz || 7;
                                    const isCompleted = juzNum <= totalSantriJuz;
                                    const isCurrent = juzNum === totalSantriJuz + 1;

                                    return (
                                        <div
                                            key={juzNum}
                                            className={`p-3 rounded-xl text-center border transition ${
                                                isCompleted 
                                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                                                    : isCurrent
                                                    ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400 animate-pulse'
                                                    : 'bg-gray-50 text-gray-400 border-gray-200'
                                            }`}
                                        >
                                            <div className="text-[10px] uppercase font-bold tracking-wider">Juz</div>
                                            <div className="text-lg font-bold">{juzNum}</div>
                                            <div className="text-[9px] mt-1 font-medium truncate">
                                                {isCompleted ? 'Mutqin' : isCurrent ? 'Proses' : 'Belum'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: PENGATURAN & BACKEND */}
                {activeTab === 'pengaturan' && (
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-2">
                                <i className="fas fa-network-wired text-emerald-700"></i> Integrasi Google Apps Script (Backend)
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                Aplikasi E-Tahfidz ini dapat bekerja dalam <strong>Mode Offline Lokal</strong> atau dihubungkan ke <strong>Google Sheets</strong> menggunakan Google Apps Script Web App.
                            </p>

                            {urlSavedMessage && (
                                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i>
                                    <span>{urlSavedMessage}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        URL Web App Google Apps Script
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="https://script.google.com/macros/s/.../exec"
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 outline-none"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Pastikan URL berakhiran <code>/exec</code> dan setelan deployment 'Who has access: Anyone'.
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveBackendUrl}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                                    >
                                        Simpan Perubahan URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInputUrl('');
                                            if (setApiUrl) setApiUrl('');
                                            localStorage.removeItem('darul_kamal_api_url');
                                            setUrlSavedMessage('Kembali ke Mode Offline Lokal.');
                                            setTimeout(() => setUrlSavedMessage(''), 3000);
                                        }}
                                        className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-semibold transition"
                                    >
                                        Hapus &amp; Reset ke Offline
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Panduan Code.gs */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                                <i className="fas fa-info-circle text-blue-600"></i> Contoh Kode Google Apps Script (Code.gs)
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">
                                Jika Anda ingin membuat spreadsheet backend sendiri, salin skrip di bawah ini ke editor Google Apps Script Anda:
                            </p>
                            <pre className="bg-gray-900 text-gray-200 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-56">
                                {GOOGLE_SCRIPT_SAMPLE_CODE}
                            </pre>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Input Setoran Baru */}
            {isAddSetoranOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <i className="fas fa-book-reader text-emerald-700"></i> Input Setoran Hafalan Santri
                            </h3>
                            <button 
                                onClick={() => setIsAddSetoranOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveSetoran} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pilih Santri</label>
                                <select 
                                    value={selectedSantriId}
                                    onChange={(e) => setSelectedSantriId(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    {santriList.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nis} - {s.nama} ({s.halaqah})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Setoran</label>
                                    <select 
                                        value={formJenis}
                                        onChange={(e) => setFormJenis(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                    >
                                        <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                                        <option value="Muroja'ah">Muroja'ah (Pengulangan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Juz Ke-</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="30"
                                        value={formJuz}
                                        onChange={(e) => setFormJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Surat</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Al-Baqarah, An-Nisa', dsb."
                                    value={formSurat}
                                    onChange={(e) => setFormSurat(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Awal</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={formAyatAwal}
                                        onChange={(e) => setFormAyatAwal(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ayat Akhir</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={formAyatAkhir}
                                        onChange={(e) => setFormAyatAkhir(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nilai / Predikat</label>
                                <select 
                                    value={formNilai}
                                    onChange={(e) => setFormNilai(e.target.value as any)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    <option value="A (Mumtaz)">A (Mumtaz / Sempurna)</option>
                                    <option value="B (Jayyid Jiddan)">B (Jayyid Jiddan / Baik Sekali)</option>
                                    <option value="C (Jayyid)">C (Jayyid / Baik)</option>
                                    <option value="D (Maqbul)">D (Maqbul / Cukup)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Tajwid / Makhorijul Huruf</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Catatan dari musyrif untuk evaluasi santri..."
                                    value={formCatatan}
                                    onChange={(e) => setFormCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSetoranOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition"
                                >
                                    Simpan Setoran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};