import React, { useState, useEffect } from 'react';
import { User, Santri, SetoranRecord, JuzStatusType, JuzProgressRecord } from '../types';
import { INITIAL_SANTRI, INITIAL_SETORAN, GOOGLE_SCRIPT_SAMPLE_CODE, QURAN_SURAHS, JUZ_METADATA, createDefaultJuzProgress } from '../mockData';
import { callAPI } from '../services/apiService';
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

    // Persisted state in LocalStorage so records are not lost on refresh
    const [santriList, setSantriList] = useState<Santri[]>(() => {
        const saved = localStorage.getItem('darul_kamal_santri_list');
        if (saved) {
            try { 
                const parsed: Santri[] = JSON.parse(saved);
                // Ensure juzProgress exists for every santri
                return parsed.map(s => ({
                    ...s,
                    juzProgress: s.juzProgress || createDefaultJuzProgress(s.totalHafalanJuz || 0)
                }));
            } catch { 
                return INITIAL_SANTRI; 
            }
        }
        return INITIAL_SANTRI;
    });

    const [setoranList, setSetoranList] = useState<SetoranRecord[]>(() => {
        const saved = localStorage.getItem('darul_kamal_setoran_list');
        if (saved) {
            try { return JSON.parse(saved); } catch { return INITIAL_SETORAN; }
        }
        return INITIAL_SETORAN;
    });

    useEffect(() => {
        localStorage.setItem('darul_kamal_santri_list', JSON.stringify(santriList));
    }, [santriList]);

    useEffect(() => {
        localStorage.setItem('darul_kamal_setoran_list', JSON.stringify(setoranList));
    }, [setoranList]);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState<'Semua' | 'Ziyadah' | "Muroja'ah">('Semua');
    const [filterSantriId, setFilterSantriId] = useState<string>('Semua');

    // Modul 30 Juz Active States
    const [selectedJuzSantriId, setSelectedJuzSantriId] = useState<string>(() => {
        if (isSantri) {
            const found = santriList.find(s => s.nama.toLowerCase().includes(user?.nama?.toLowerCase() || ''));
            return found ? found.id : santriList[0]?.id || 's-1';
        }
        return santriList[0]?.id || 's-1';
    });
    const [juzFilterStatus, setJuzFilterStatus] = useState<'Semua' | JuzStatusType>('Semua');
    const [juzViewMode, setJuzViewMode] = useState<'grid' | 'table'>('grid');
    
    // Modal Detail & Evaluasi Juz
    const [activeJuzModal, setActiveJuzModal] = useState<number | null>(null);
    const [modalJuzStatus, setModalJuzStatus] = useState<JuzStatusType>('Mutqin');
    const [modalJuzNilai, setModalJuzNilai] = useState<string>('A (Mumtaz)');
    const [modalJuzTanggal, setModalJuzTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
    const [modalJuzPenguji, setModalJuzPenguji] = useState<string>(user?.nama || 'Ustadz Abdullah');
    const [modalJuzCatatan, setModalJuzCatatan] = useState<string>('');

    // Modal Input Setoran Baru
    const [isAddSetoranOpen, setIsAddSetoranOpen] = useState(false);
    const [selectedSantriId, setSelectedSantriId] = useState(santriList[0]?.id || 's-1');
    const [formJenis, setFormJenis] = useState<'Ziyadah' | "Muroja'ah">('Ziyadah');
    const [selectedSurahNomor, setSelectedSurahNomor] = useState<number>(1);
    const [formAyatAwal, setFormAyatAwal] = useState('1');
    const [formAyatAkhir, setFormAyatAkhir] = useState('7');
    const [formJuz, setFormJuz] = useState('1');
    const [formNilai, setFormNilai] = useState<'A (Mumtaz)' | 'B (Jayyid Jiddan)' | 'C (Jayyid)' | 'D (Maqbul)'>('A (Mumtaz)');
    const [formCatatan, setFormCatatan] = useState('');

    // Modal Tambah Santri Baru
    const [isAddSantriOpen, setIsAddSantriOpen] = useState(false);
    const [newNis, setNewNis] = useState('');
    const [newNama, setNewNama] = useState('');
    const [newKelas, setNewKelas] = useState('Kelas X - Tahfidz Wustho');
    const [newHalaqah, setNewHalaqah] = useState('Halaqah Abu Bakar Ash-Shiddiq');
    const [newMusyrif, setNewMusyrif] = useState(user?.nama || 'Ustadz Abdullah');
    const [newTotalJuz, setNewTotalJuz] = useState('0');

    // Backend URL settings inside dashboard
    const [inputUrl, setInputUrl] = useState(apiUrl);
    const [urlSavedMessage, setUrlSavedMessage] = useState('');
    const [testConnectionStatus, setTestConnectionStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

    // Active santri for 30 Juz module
    const currentJuzSantri = santriList.find(s => s.id === selectedJuzSantriId) || santriList[0];
    const juzProgressMap = currentJuzSantri?.juzProgress || createDefaultJuzProgress(currentJuzSantri?.totalHafalanJuz || 0);

    // Count statistics for the selected santri in 30 Juz module
    const totalMutqin = Object.values(juzProgressMap).filter(j => j.status === 'Mutqin').length;
    const totalSedangBerjalan = Object.values(juzProgressMap).filter(j => j.status === 'Sedang Berjalan').length;
    const totalPerluMurojaah = Object.values(juzProgressMap).filter(j => j.status === "Perlu Muroja'ah").length;
    const totalBelum = 30 - totalMutqin - totalSedangBerjalan - totalPerluMurojaah;
    const percentageComplete = Math.round((totalMutqin / 30) * 100);

    // Open Juz detail modal
    const handleOpenJuzModal = (juzNum: number) => {
        const existing = juzProgressMap[juzNum];
        setActiveJuzModal(juzNum);
        setModalJuzStatus(existing?.status || (juzNum <= currentJuzSantri.totalHafalanJuz ? 'Mutqin' : 'Belum'));
        setModalJuzNilai(existing?.nilaiTasmi || 'A (Mumtaz)');
        setModalJuzTanggal(existing?.tanggalUjian || new Date().toISOString().split('T')[0]);
        setModalJuzPenguji(existing?.penguji || user?.nama || 'Ustadz Pembina');
        setModalJuzCatatan(existing?.catatan || '');
    };

    // Save Juz evaluation and update santri
    const handleSaveJuzProgress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeJuzModal || !currentJuzSantri) return;

        const updatedRecord: JuzProgressRecord = {
            juz: activeJuzModal,
            status: modalJuzStatus,
            nilaiTasmi: modalJuzStatus === 'Mutqin' ? modalJuzNilai : undefined,
            tanggalUjian: modalJuzStatus === 'Mutqin' ? modalJuzTanggal : undefined,
            penguji: modalJuzPenguji,
            catatan: modalJuzCatatan.trim()
        };

        const updatedProgressMap = {
            ...juzProgressMap,
            [activeJuzModal]: updatedRecord
        };

        // Recalculate total completed juz
        const newTotalCompleted = Object.values(updatedProgressMap).filter(r => r.status === 'Mutqin').length;

        const updatedSantriList = santriList.map(s => {
            if (s.id === currentJuzSantri.id) {
                return {
                    ...s,
                    totalHafalanJuz: newTotalCompleted,
                    juzProgress: updatedProgressMap
                };
            }
            return s;
        });

        setSantriList(updatedSantriList);
        setActiveJuzModal(null);
    };

    // Auto-update Juz and verse limit when surah changes
    const handleSurahChange = (nomor: number) => {
        setSelectedSurahNomor(nomor);
        const surah = QURAN_SURAHS.find(s => s.nomor === nomor);
        if (surah) {
            setFormJuz(String(surah.juz));
            setFormAyatAwal('1');
            setFormAyatAkhir(String(Math.min(surah.ayat, 20)));
        }
    };

    // Handle adding new setoran
    const handleSaveSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        const targetSantri = santriList.find(s => s.id === selectedSantriId) || santriList[0];
        const surahObj = QURAN_SURAHS.find(s => s.nomor === selectedSurahNomor) || QURAN_SURAHS[0];

        const newRecord: SetoranRecord = {
            id: `set-${Date.now()}`,
            santriId: targetSantri.id,
            santriNama: targetSantri.nama,
            tanggal: new Date().toISOString().split('T')[0],
            jenis: formJenis,
            surat: surahObj.nama,
            ayatAwal: parseInt(formAyatAwal) || 1,
            ayatAkhir: parseInt(formAyatAkhir) || surahObj.ayat,
            juz: parseInt(formJuz) || surahObj.juz,
            nilai: formNilai,
            musyrif: user?.nama || 'Ustadz Pembina',
            catatan: formCatatan.trim() || 'Alhamdulillah lancar dan tartil'
        };

        const updatedSetoran = [newRecord, ...setoranList];
        setSetoranList(updatedSetoran);

        // Update target santri's last surah and total juz if ziyadah increases
        setSantriList(santriList.map(s => {
            if (s.id === targetSantri.id) {
                const calculatedJuz = Math.max(s.totalHafalanJuz, formJenis === 'Ziyadah' ? parseInt(formJuz) || s.totalHafalanJuz : s.totalHafalanJuz);
                return {
                    ...s,
                    totalHafalanJuz: calculatedJuz,
                    suratTerakhir: `${surahObj.nama} : ${formAyatAwal}-${formAyatAkhir}`
                };
            }
            return s;
        }));

        setIsAddSetoranOpen(false);
        setFormCatatan('');
    };

    // Handle adding new santri
    const handleSaveSantri = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNama.trim() || !newNis.trim()) return;

        const totalJuzInt = parseInt(newTotalJuz) || 0;
        const newSantri: Santri = {
            id: `s-${Date.now()}`,
            nis: newNis.trim(),
            nama: newNama.trim(),
            kelas: newKelas,
            halaqah: newHalaqah,
            musyrif: newMusyrif,
            totalHafalanJuz: totalJuzInt,
            suratTerakhir: 'Memulai juz awal',
            status: 'Aktif',
            juzProgress: createDefaultJuzProgress(totalJuzInt)
        };

        setSantriList([...santriList, newSantri]);
        setIsAddSantriOpen(false);
        setNewNis('');
        setNewNama('');
    };

    // Test Google Apps Script connection
    const handleTestBackend = async () => {
        if (!inputUrl.trim() || !inputUrl.startsWith('https://script.google.com')) {
            setTestConnectionStatus({
                loading: false,
                success: false,
                message: 'URL belum valid. Pastikan dimulai dengan https://script.google.com/macros/s/.../exec'
            });
            return;
        }

        setTestConnectionStatus({ loading: true });
        try {
            const start = performance.now();
            await callAPI(inputUrl.trim(), { action: 'ping' });
            const duration = Math.round(performance.now() - start);
            setTestConnectionStatus({
                loading: false,
                success: true,
                message: `Berhasil terhubung ke server Google Apps Script! (Respon: ${duration} ms)`
            });
        } catch (err: any) {
            setTestConnectionStatus({
                loading: false,
                success: false,
                message: `Gagal terhubung: ${err.message}. Pastikan izin deployment Web App adalah "Who has access: Anyone".`
            });
        }
    };

    // Export CSV of setoran
    const exportCSV = () => {
        const headers = ["ID", "Santri", "Tanggal", "Jenis", "Surat", "Ayat Awal", "Ayat Akhir", "Juz", "Nilai", "Musyrif", "Catatan"];
        const rows = setoranList.map(item => [
            item.id,
            `"${item.santriNama}"`,
            item.tanggal,
            item.jenis,
            `"${item.surat}"`,
            item.ayatAwal,
            item.ayatAkhir,
            item.juz,
            `"${item.nilai}"`,
            `"${item.musyrif}"`,
            `"${item.catatan || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `rekap_tahfidz_darul_kamal_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        const matchesSantri = filterSantriId === 'Semua' || item.santriId === filterSantriId;
        if (isSantri) {
            return matchesJenis && (item.santriNama.toLowerCase().includes(user?.nama?.toLowerCase() || '') || item.santriId === 's-1');
        }
        return matchesJenis && matchesSantri;
    });

    // Recent setoran for active modal juz
    const modalJuzSetoran = activeJuzModal 
        ? setoranList.filter(s => s.juz === activeJuzModal && s.santriId === currentJuzSantri?.id)
        : [];

    const activeMeta = activeJuzModal ? JUZ_METADATA.find(m => m.juz === activeJuzModal) : null;

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

                    <button 
                        onClick={() => setActiveTab('hafalan')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 text-sm ${
                            activeTab === 'hafalan' ? 'bg-emerald-800 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'
                        }`}
                    >
                        <i className="fas fa-book-quran w-5 text-center text-amber-300"></i>
                        <span className="font-semibold text-amber-200">Modul 30 Juz</span>
                        <span className="ml-auto text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/30">Aktif</span>
                    </button>

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
                    <span className="text-xs bg-emerald-800 px-2.5 py-1 rounded-full text-emerald-200 font-semibold truncate max-w-[120px]">
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
                    <button 
                        onClick={() => { setActiveTab('hafalan'); setMobileMenuOpen(false); }}
                        className="w-full text-left py-2 px-3 rounded bg-emerald-900/80 text-amber-300 text-sm font-semibold flex items-center gap-2"
                    >
                        <i className="fas fa-book-quran w-5"></i> Modul 30 Juz
                    </button>
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
                            {activeTab === 'hafalan' && 'Modul Evaluasi & Progres 30 Juz'}
                            {activeTab === 'pengaturan' && 'Pengaturan & Integrasi Backend'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Pondok Pesantren Darul Kamal • Tahun Ajaran 1447 / 1448 H
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === 'hafalan' && (
                            <button
                                onClick={() => window.print()}
                                className="bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                            >
                                <i className="fas fa-print"></i>
                                <span>Cetak Lembar Pantau 30 Juz</span>
                            </button>
                        )}
                        {(isAdmin || isUstadz) && activeTab === 'santri' && (
                            <button
                                onClick={() => setIsAddSantriOpen(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                            >
                                <i className="fas fa-user-plus"></i>
                                <span>Tambah Santri</span>
                            </button>
                        )}
                        {(isAdmin || isUstadz) && (
                            <button
                                onClick={() => setIsAddSetoranOpen(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                            >
                                <i className="fas fa-plus"></i>
                                <span>Input Setoran</span>
                            </button>
                        )}
                        {activeTab === 'setoran' && (
                            <button
                                onClick={exportCSV}
                                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                            >
                                <i className="fas fa-file-csv text-emerald-600"></i>
                                <span>Ekspor CSV</span>
                            </button>
                        )}
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
                                        {isSantri ? 'Hafalan Anda' : 'Rata-rata Hafalan'}
                                    </span>
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <i className="fas fa-medal text-lg"></i>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mt-2">
                                    {isSantri 
                                        ? `${currentJuzSantri?.totalHafalanJuz || user?.totalJuz || 7} Juz` 
                                        : `${(santriList.reduce((acc, s) => acc + s.totalHafalanJuz, 0) / (santriList.length || 1)).toFixed(1)} Juz`}
                                </div>
                                <p className="text-[11px] text-amber-700 font-medium mt-1">
                                    <i className="fas fa-star mr-1"></i>Target Minimal: 30 Juz
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Status Backend</span>
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <i className="fas fa-server text-lg"></i>
                                    </div>
                                </div>
                                <div className="text-base font-bold text-gray-800 mt-2 truncate">
                                    {apiUrl && apiUrl.startsWith('https://script.google.com') ? 'Google Apps Script' : 'Mode Offline Lokal'}
                                </div>
                                <p className="text-[11px] text-purple-700 font-medium mt-1">
                                    <i className="fas fa-shield-alt mr-1"></i>Tersimpan di Penyimpanan Aman
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
                                    <p className="text-xs text-gray-500 mt-0.5">Catatan Ziyadah dan Muroja'ah santri terkini</p>
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
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-medium">
                                    Total: <strong>{filteredSantri.length}</strong> santri
                                </span>
                                {(isAdmin || isUstadz) && (
                                    <button
                                        onClick={() => setIsAddSantriOpen(true)}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                                    >
                                        <i className="fas fa-plus"></i> Tambah Santri
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSantri.map((santri) => (
                                <div key={santri.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between">
                                    <div>
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
                                    </div>

                                    <div className="mt-4 pt-2 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedJuzSantriId(santri.id);
                                                setActiveTab('hafalan');
                                            }}
                                            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold py-2 rounded-xl border border-amber-200 transition flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fas fa-book-quran text-amber-700"></i>
                                            <span>Buka Peta 30 Juz</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSantriId(santri.id);
                                                setIsAddSetoranOpen(true);
                                            }}
                                            className="px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs rounded-xl border border-emerald-200"
                                            title="Input Setoran"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: SETORAN HAFALAN */}
                {activeTab === 'setoran' && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-600">Jenis:</span>
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

                                {!isSantri && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-600">Santri:</span>
                                        <select
                                            value={filterSantriId}
                                            onChange={(e) => setFilterSantriId(e.target.value)}
                                            className="border border-gray-300 p-1.5 rounded-lg text-xs outline-none bg-white"
                                        >
                                            <option value="Semua">Semua Santri</option>
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>{s.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={exportCSV}
                                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                >
                                    <i className="fas fa-file-csv text-emerald-600"></i> Ekspor CSV
                                </button>
                                {(isAdmin || isUstadz) && (
                                    <button
                                        onClick={() => setIsAddSetoranOpen(true)}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                                    >
                                        <i className="fas fa-plus"></i> Setoran Baru
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredSetoran.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                                    <i className="fas fa-book-open text-4xl text-gray-300 mb-2"></i>
                                    <p className="font-semibold">Belum ada catatan setoran yang sesuai filter.</p>
                                </div>
                            ) : (
                                filteredSetoran.map(record => (
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
                                                <span className="text-gray-500">Materi Setoran:</span>
                                                <p className="font-bold text-gray-800 text-sm mt-0.5">
                                                    Surat {record.surat} (Ayat {record.ayatAwal} s/d {record.ayatAkhir}) • Juz {record.juz}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Catatan &amp; Evaluasi Musyrif:</span>
                                                <p className="italic text-gray-700 bg-gray-50 p-2.5 rounded-lg mt-0.5 border border-gray-100">
                                                    "{record.catatan || 'Lancar tanpa catatan khusus'}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: MODUL PROGRES 30 JUZ AL-QUR'AN */}
                {activeTab === 'hafalan' && (
                    <div className="space-y-6">
                        {/* Selector Santri & Ringkasan Capaian */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                <div>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Modul Khusus Mutaba'ah Tahfidz
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                        <span>Progres 30 Juz Al-Qur'an</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Klik pada salah satu kotak Juz untuk melihat detail materi, riwayat setoran, serta mengupdate kelulusan ujian tasmi'.
                                    </p>
                                </div>

                                {!isSantri && (
                                    <div className="flex items-center gap-2 self-start lg:self-auto bg-gray-50 p-2 rounded-xl border border-gray-200">
                                        <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Pilih Santri:</label>
                                        <select
                                            value={selectedJuzSantriId}
                                            onChange={(e) => setSelectedJuzSantriId(e.target.value)}
                                            className="bg-white border border-gray-300 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                                        >
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.nama} ({s.totalHafalanJuz} Juz Mutqin)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Santri Card Detail */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-950 text-white p-5 rounded-2xl relative overflow-hidden shadow-md">
                                <div className="md:col-span-2 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-emerald-800 border-2 border-emerald-400 flex items-center justify-center text-xl font-bold">
                                            {currentJuzSantri?.nama ? currentJuzSantri.nama.charAt(0) : 'S'}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white">{currentJuzSantri?.nama}</h4>
                                            <p className="text-xs text-emerald-200">
                                                NIS: {currentJuzSantri?.nis} • {currentJuzSantri?.kelas}
                                            </p>
                                            <p className="text-[11px] text-emerald-300 mt-0.5">
                                                Musyrif: {currentJuzSantri?.musyrif} ({currentJuzSantri?.halaqah})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center relative z-10">
                                    <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">Capaian Mutqin</span>
                                    <div className="text-2xl font-bold text-amber-300 mt-0.5">
                                        {totalMutqin} <span className="text-sm font-normal text-white">/ 30 Juz</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-200">{percentageComplete}% Menuju Khotmil Qur'an</span>
                                </div>

                                <div className="flex flex-col justify-center relative z-10">
                                    <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">Status Ziyadah Aktif</span>
                                    <div className="text-lg font-bold text-white mt-0.5 truncate">
                                        {currentJuzSantri?.suratTerakhir || 'Juz ' + (totalMutqin + 1)}
                                    </div>
                                    <span className="text-[11px] text-amber-300">
                                        {30 - totalMutqin} Juz tersisa
                                    </span>
                                </div>

                                <div className="absolute -right-6 -bottom-8 text-white/5 font-arab text-9xl pointer-events-none select-none">
                                    ختم
                                </div>
                            </div>

                            {/* Overall Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-1.5">
                                    <span>Kemajuan Keseluruhan 30 Juz:</span>
                                    <span className="text-emerald-700 font-bold">{totalMutqin} dari 30 Juz Telah Mutqin ({percentageComplete}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${percentageComplete}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Status Legend & View Toggle */}
                            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-bold text-gray-700">Filter Status:</span>
                                    <button
                                        onClick={() => setJuzFilterStatus('Semua')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                            juzFilterStatus === 'Semua' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Semua (30)
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus('Mutqin')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === 'Mutqin' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Mutqin ({totalMutqin})
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus('Sedang Berjalan')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === 'Sedang Berjalan' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Sedang Berjalan ({totalSedangBerjalan})
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus("Perlu Muroja'ah")}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === "Perlu Muroja'ah" ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Perlu Muroja'ah ({totalPerluMurojaah})
                                    </button>
                                    <button
                                        onClick={() => setJuzFilterStatus('Belum')}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                                            juzFilterStatus === 'Belum' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Belum ({totalBelum})
                                    </button>
                                </div>

                                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                                    <button
                                        onClick={() => setJuzViewMode('grid')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                                            juzViewMode === 'grid' ? 'bg-white shadow-xs text-emerald-800' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <i className="fas fa-th-large"></i> Grid 30 Juz
                                    </button>
                                    <button
                                        onClick={() => setJuzViewMode('table')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                                            juzViewMode === 'table' ? 'bg-white shadow-xs text-emerald-800' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <i className="fas fa-list"></i> Tabel Rekap
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MODE: GRID 30 JUZ */}
                        {juzViewMode === 'grid' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
                                {JUZ_METADATA.map((meta) => {
                                    const progress = juzProgressMap[meta.juz] || {
                                        juz: meta.juz,
                                        status: meta.juz <= (currentJuzSantri?.totalHafalanJuz || 0) ? 'Mutqin' : 'Belum'
                                    };

                                    if (juzFilterStatus !== 'Semua' && progress.status !== juzFilterStatus) {
                                        return null;
                                    }

                                    const isMutqin = progress.status === 'Mutqin';
                                    const isSedangBerjalan = progress.status === 'Sedang Berjalan';
                                    const isPerluMurojaah = progress.status === "Perlu Muroja'ah";

                                    return (
                                        <div
                                            key={meta.juz}
                                            onClick={() => handleOpenJuzModal(meta.juz)}
                                            className={`rounded-2xl p-4 border text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
                                                isMutqin
                                                    ? 'bg-gradient-to-br from-emerald-700 to-teal-800 text-white border-emerald-600 shadow-sm'
                                                    : isSedangBerjalan
                                                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 text-gray-900 border-amber-300 ring-2 ring-amber-400 shadow-md'
                                                    : isPerluMurojaah
                                                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900 border-blue-300 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {/* Badge Juz Top */}
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        isMutqin 
                                                            ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40' 
                                                            : isSedangBerjalan
                                                            ? 'bg-amber-200 text-amber-900 font-extrabold'
                                                            : isPerluMurojaah
                                                            ? 'bg-blue-200 text-blue-900 font-extrabold'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        JUZ {meta.juz}
                                                    </span>

                                                    {isMutqin && (
                                                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                                                            <i className="fas fa-check"></i>
                                                        </span>
                                                    )}
                                                    {isSedangBerjalan && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                                    )}
                                                </div>

                                                <h4 className={`font-arab text-xl font-bold mt-2 ${isMutqin ? 'text-amber-200' : 'text-gray-800'}`}>
                                                    {meta.namaArab}
                                                </h4>
                                                <p className={`text-xs font-bold leading-tight ${isMutqin ? 'text-white' : 'text-gray-900'}`}>
                                                    {meta.namaLatin}
                                                </p>
                                                <p className={`text-[10px] mt-1 leading-snug line-clamp-2 ${isMutqin ? 'text-emerald-100' : 'text-gray-500'}`}>
                                                    {meta.rentangSurat}
                                                </p>
                                            </div>

                                            {/* Status Footer */}
                                            <div className="mt-4 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px]">
                                                <span className={`font-bold ${
                                                    isMutqin ? 'text-emerald-200' :
                                                    isSedangBerjalan ? 'text-amber-800' :
                                                    isPerluMurojaah ? 'text-blue-800' :
                                                    'text-gray-400'
                                                }`}>
                                                    {progress.status}
                                                </span>
                                                {progress.nilaiTasmi && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                                        isMutqin ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                                                    }`}>
                                                        {progress.nilaiTasmi.split(' ')[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* MODE: TABEL REKAPITULASI 30 JUZ */}
                        {juzViewMode === 'table' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs">
                                    <span className="font-bold text-gray-700">Tabel Rincian Capaian Mutaba'ah Juz 1 s/d 30</span>
                                    <span className="text-gray-500">Klik baris untuk mengubah status atau mencatat evaluasi</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-700 uppercase font-semibold">
                                                <th className="py-3 px-4">Juz</th>
                                                <th className="py-3 px-4">Nama Juz (Arab &amp; Latin)</th>
                                                <th className="py-3 px-4">Cakupan Surat</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Nilai Tasmi'</th>
                                                <th className="py-3 px-4">Tanggal Ujian</th>
                                                <th className="py-3 px-4">Penguji</th>
                                                <th className="py-3 px-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {JUZ_METADATA.map((meta) => {
                                                const progress = juzProgressMap[meta.juz] || {
                                                    juz: meta.juz,
                                                    status: meta.juz <= (currentJuzSantri?.totalHafalanJuz || 0) ? 'Mutqin' : 'Belum'
                                                };

                                                if (juzFilterStatus !== 'Semua' && progress.status !== juzFilterStatus) {
                                                    return null;
                                                }

                                                return (
                                                    <tr 
                                                        key={meta.juz}
                                                        onClick={() => handleOpenJuzModal(meta.juz)}
                                                        className="hover:bg-emerald-50/60 cursor-pointer transition"
                                                    >
                                                        <td className="py-3 px-4 font-bold text-emerald-800">Juz {meta.juz}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="font-arab text-base text-gray-800 mr-2 font-bold">{meta.namaArab}</span>
                                                            <span className="text-gray-600 font-medium">({meta.namaLatin})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">{meta.rentangSurat}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                progress.status === 'Mutqin' ? 'bg-emerald-100 text-emerald-800' :
                                                                progress.status === 'Sedang Berjalan' ? 'bg-amber-100 text-amber-800' :
                                                                progress.status === "Perlu Muroja'ah" ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {progress.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                                            {progress.nilaiTasmi || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500">
                                                            {progress.tanggalUjian || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            {progress.penguji || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenJuzModal(meta.juz);
                                                                }}
                                                                className="text-emerald-700 hover:text-emerald-900 font-bold"
                                                            >
                                                                <i className="fas fa-edit mr-1"></i> Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: PENGATURAN & BACKEND */}
                {activeTab === 'pengaturan' && (
                    <div className="max-w-3xl space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-2">
                                <i className="fas fa-network-wired text-emerald-700"></i> Integrasi Google Apps Script (Backend)
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                Aplikasi E-Tahfidz ini siap digunakan dalam <strong>Mode Offline Lokal</strong> (data tersimpan di browser) atau dapat dihubungkan ke <strong>Google Sheets</strong> menggunakan Google Apps Script Web App.
                            </p>

                            {urlSavedMessage && (
                                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i>
                                    <span>{urlSavedMessage}</span>
                                </div>
                            )}

                            {testConnectionStatus && (
                                <div className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                                    testConnectionStatus.loading 
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                        : testConnectionStatus.success
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                    <i className={`fas ${
                                        testConnectionStatus.loading ? 'fa-spinner fa-spin' :
                                        testConnectionStatus.success ? 'fa-check-circle' : 'fa-exclamation-triangle'
                                    }`}></i>
                                    <span>{testConnectionStatus.message || 'Menguji koneksi ke Google Apps Script...'}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        URL Web App Google Apps Script (/exec)
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="https://script.google.com/macros/s/.../exec"
                                        value={inputUrl}
                                        onChange={(e) => setInputUrl(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 outline-none"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Pastikan deployment Web App diatur dengan: <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong>.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (setApiUrl) setApiUrl(inputUrl.trim());
                                            localStorage.setItem('darul_kamal_api_url', inputUrl.trim());
                                            setUrlSavedMessage('URL Google Apps Script berhasil disimpan!');
                                            setTimeout(() => setUrlSavedMessage(''), 3000);
                                        }}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                                    >
                                        Simpan Perubahan URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleTestBackend}
                                        disabled={testConnectionStatus?.loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                                    >
                                        <i className="fas fa-bolt"></i> Uji Koneksi API
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
                                        Reset ke Offline
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reset Local Data Option */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h4 className="font-bold text-gray-800 text-sm mb-1 text-red-600 flex items-center gap-2">
                                <i className="fas fa-trash-alt"></i> Reset Data Aplikasi Lokal
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">
                                Jika ingin mengembalikan data santri, setoran, dan peta 30 juz ke data contoh bawaan:
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm('Yakin ingin mereset seluruh data santri, setoran, dan peta 30 juz ke bawaan?')) {
                                        setSantriList(INITIAL_SANTRI);
                                        setSetoranList(INITIAL_SETORAN);
                                        localStorage.removeItem('darul_kamal_santri_list');
                                        localStorage.removeItem('darul_kamal_setoran_list');
                                        alert('Data berhasil direset ke bawaan.');
                                    }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition"
                            >
                                Reset Semua Data ke Bawaan
                            </button>
                        </div>

                        {/* Panduan Code.gs */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                            <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                                <i className="fas fa-code text-blue-600"></i> Contoh Kode Google Apps Script (Code.gs)
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">
                                Salin skrip di bawah ini ke editor Google Apps Script di spreadsheet Anda:
                            </p>
                            <pre className="bg-gray-900 text-gray-200 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-56">
                                {GOOGLE_SCRIPT_SAMPLE_CODE}
                            </pre>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL DETAIL & EVALUASI JUZ 30 (MODUL JUZ) */}
            {activeJuzModal !== null && activeMeta && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="flex justify-between items-start pb-3 border-b border-gray-200 mb-4">
                            <div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    Juz {activeMeta.juz} • {activeMeta.rentangSurat}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <h3 className="font-arab text-2xl font-bold text-emerald-900">{activeMeta.namaArab}</h3>
                                    <span className="font-bold text-gray-800 text-base">({activeMeta.namaLatin})</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Santri: <strong>{currentJuzSantri?.nama}</strong> (NIS: {currentJuzSantri?.nis})
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveJuzModal(null)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Deskripsi Kandungan Juz */}
                        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 mb-4 leading-relaxed">
                            <span className="font-bold flex items-center gap-1.5 mb-1">
                                <i className="fas fa-info-circle text-emerald-700"></i> Pokok Kandungan Juz {activeMeta.juz}:
                            </span>
                            <p>{activeMeta.deskripsi}</p>
                        </div>

                        {/* Riwayat Setoran Khusus Juz Ini */}
                        <div className="mb-4">
                            <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <i className="fas fa-history text-gray-500"></i> Riwayat Setoran Santri di Juz Ini:
                            </h4>
                            {modalJuzSetoran.length === 0 ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    Belum ada catatan setoran terinci untuk Juz {activeMeta.juz} pada santri ini.
                                </p>
                            ) : (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {modalJuzSetoran.map(item => (
                                        <div key={item.id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-800">{item.surat} ({item.ayatAwal}-{item.ayatAkhir})</span>
                                                <span className="text-gray-500 text-[11px] block">{item.tanggal} • {item.jenis}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    {item.nilai}
                                                </span>
                                                <span className="text-[10px] text-gray-500 block">{item.musyrif}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form Update Kelulusan / Status Juz */}
                        <form onSubmit={handleSaveJuzProgress} className="space-y-3 pt-3 border-t border-gray-200 text-xs">
                            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                                <i className="fas fa-certificate text-amber-600"></i> Evaluasi &amp; Status Kelulusan Juz:
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Juz</label>
                                    <select 
                                        value={modalJuzStatus}
                                        onChange={(e) => setModalJuzStatus(e.target.value as any)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                        disabled={isSantri}
                                    >
                                        <option value="Mutqin">Mutqin (Lulus Tasmi')</option>
                                        <option value="Sedang Berjalan">Sedang Berjalan (Ziyadah Aktif)</option>
                                        <option value="Perlu Muroja'ah">Perlu Muroja'ah Ulang</option>
                                        <option value="Belum">Belum Dimulai</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nilai Ujian Tasmi'</label>
                                    <select 
                                        value={modalJuzNilai}
                                        onChange={(e) => setModalJuzNilai(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                                        disabled={isSantri || modalJuzStatus !== 'Mutqin'}
                                    >
                                        <option value="A (Mumtaz)">A (Mumtaz / Sempurna)</option>
                                        <option value="B (Jayyid Jiddan)">B (Jayyid Jiddan / Baik Sekali)</option>
                                        <option value="C (Jayyid)">C (Jayyid / Baik)</option>
                                        <option value="D (Maqbul)">D (Maqbul / Cukup)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Ujian Tasmi'</label>
                                    <input 
                                        type="date"
                                        value={modalJuzTanggal}
                                        onChange={(e) => setModalJuzTanggal(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        disabled={isSantri || modalJuzStatus !== 'Mutqin'}
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ustadz Penguji</label>
                                    <input 
                                        type="text"
                                        value={modalJuzPenguji}
                                        onChange={(e) => setModalJuzPenguji(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                        disabled={isSantri}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Evaluasi / Ayat Mutasyabihat</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Contoh: Sangat fasih, hati-hati ayat mutasyabihat di pertengahan surat..."
                                    value={modalJuzCatatan}
                                    onChange={(e) => setModalJuzCatatan(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                                    disabled={isSantri}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setActiveJuzModal(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Tutup
                                </button>
                                {!isSantri && (
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                    >
                                        Simpan Perubahan Juz
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                    <label className="block font-bold text-gray-700 mb-1">Juz</label>
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
                                <label className="block font-bold text-gray-700 mb-1">Nama Surat Al-Qur'an</label>
                                <select
                                    value={selectedSurahNomor}
                                    onChange={(e) => handleSurahChange(parseInt(e.target.value))}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    {QURAN_SURAHS.map(s => (
                                        <option key={s.nomor} value={s.nomor}>
                                            {s.nomor}. {s.nama} ({s.ayat} ayat, Juz {s.juz})
                                        </option>
                                    ))}
                                </select>
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
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Simpan Setoran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah Santri Baru */}
            {isAddSantriOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <i className="fas fa-user-plus text-emerald-700"></i> Pendaftaran Santri Baru
                            </h3>
                            <button 
                                onClick={() => setIsAddSantriOpen(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveSantri} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nomor Induk Santri (NIS)</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: 12351"
                                    value={newNis}
                                    onChange={(e) => setNewNis(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Santri</label>
                                <input 
                                    type="text" 
                                    placeholder="Nama lengkap santri..."
                                    value={newNama}
                                    onChange={(e) => setNewNama(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kelas</label>
                                    <input 
                                        type="text" 
                                        value={newKelas}
                                        onChange={(e) => setNewKelas(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Hafalan Awal (Juz)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="30"
                                        value={newTotalJuz}
                                        onChange={(e) => setNewTotalJuz(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kelompok Halaqah</label>
                                <input 
                                    type="text" 
                                    value={newHalaqah}
                                    onChange={(e) => setNewHalaqah(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Ustadz Musyrif Pembina</label>
                                <input 
                                    type="text" 
                                    value={newMusyrif}
                                    onChange={(e) => setNewMusyrif(e.target.value)}
                                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSantriOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition"
                                >
                                    Daftarkan Santri
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};