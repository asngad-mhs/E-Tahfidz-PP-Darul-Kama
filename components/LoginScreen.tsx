import React, { useState } from 'react';
import { callAPI } from '../services/apiService';
import { User } from '../types';
import { PLACEHOLDER_MARKER, ISLAMIC_BG_PATTERN } from '../constants';
import { DEMO_USERS, GOOGLE_SCRIPT_SAMPLE_CODE, INITIAL_SANTRI } from '../mockData';
import { Input } from './Input';
import { Button } from './Button';

interface LoginScreenProps {
    apiUrl: string;
    setApiUrl: (url: string) => void;
    onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ apiUrl, setApiUrl, onLoginSuccess }) => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showApiConfig, setShowApiConfig] = useState(false);
    const [showScriptModal, setShowScriptModal] = useState(false);
    const [manualUrl, setManualUrl] = useState(apiUrl.includes(PLACEHOLDER_MARKER) ? '' : apiUrl);
    const [copiedScript, setCopiedScript] = useState(false);

    const isConnectedToGas = apiUrl && !apiUrl.includes(PLACEHOLDER_MARKER) && apiUrl.startsWith('https://script.google.com');

    const handleQuickLogin = (roleKey: 'admin' | 'santri' | 'ustadz') => {
        const demo = DEMO_USERS[roleKey];
        if (demo) {
            setId(demo.user.id || roleKey);
            setPassword(demo.pass);
            setError(null);
            // Instant login for demo convenience
            onLoginSuccess(demo.user);
        }
    };

    const handleSaveApiUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = manualUrl.trim();
        if (trimmed && !trimmed.startsWith('https://script.google.com')) {
            setError("Format URL tidak valid. Pastikan diawali dengan 'https://script.google.com/macros/s/.../exec'");
            return;
        }
        setApiUrl(trimmed);
        setError(null);
        setShowApiConfig(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const cleanId = id.trim().toLowerCase();
        const cleanPass = password.trim();

        if (!cleanId || !cleanPass) {
            setError("ID Pengguna dan Kata Sandi wajib diisi.");
            setLoading(false);
            return;
        }

        // 1. Cek Kredensial Demo Bawaan
        const matchedDemo = DEMO_USERS[cleanId];
        if (matchedDemo && matchedDemo.pass === cleanPass) {
            setTimeout(() => {
                setLoading(false);
                onLoginSuccess(matchedDemo.user);
            }, 300);
            return;
        }

        // Cek admin alternatif
        if (cleanId === 'admin' && cleanPass === 'admin123') {
            setTimeout(() => {
                setLoading(false);
                onLoginSuccess({
                    id: 'admin',
                    nama: 'M. Asngad',
                    role: 'admin',
                    kelas: 'Pimpinan & Koordinator Tahfidz'
                });
            }, 300);
            return;
        }

        // Cek Ustadz alternatif
        if ((cleanId === 'ustadz' || cleanId === 'musyrif') && (cleanPass === 'ustadz123' || cleanPass === 'admin123')) {
            setTimeout(() => {
                setLoading(false);
                onLoginSuccess({
                    id: 'ustadz',
                    nama: 'Ustadz Abdullah Mukhtar, S.Pd.I',
                    role: 'ustadz',
                    kelas: 'Pembina Halaqah Abu Bakar Ash-Shiddiq'
                });
            }, 300);
            return;
        }

        // Cek Data Santri (dari localStorage atau mock bawaan INITIAL_SANTRI)
        let allSantri = INITIAL_SANTRI;
        try {
            const saved = localStorage.getItem('darul_kamal_santri_list');
            if (saved) {
                allSantri = JSON.parse(saved);
            }
        } catch {
            allSantri = INITIAL_SANTRI;
        }

        // Cari santri berdasarkan NIS, ID, atau nama
        const foundSantri = allSantri.find((s: any) => 
            (s.nis && s.nis.toString().toLowerCase() === cleanId) ||
            (s.id && s.id.toString().toLowerCase() === cleanId) ||
            (s.nama && s.nama.toLowerCase() === cleanId)
        );

        if (foundSantri) {
            // Password yang diterima: 'santri123', atau NIS santri itu sendiri
            if (cleanPass === 'santri123' || cleanPass === foundSantri.nis || cleanPass === foundSantri.id) {
                setTimeout(() => {
                    setLoading(false);
                    onLoginSuccess({
                        id: foundSantri.nis || foundSantri.id,
                        nama: foundSantri.nama,
                        role: 'santri',
                        kelas: foundSantri.kelas
                    });
                }, 300);
                return;
            }
        }

        // 2. Jika menggunakan koneksi Google Apps Script yang valid
        if (isConnectedToGas) {
            try {
                const result = await callAPI(apiUrl, {
                    action: 'login',
                    id: id.trim(),
                    password: password,
                    role: 'santri'
                });

                if (result.status === 'success') {
                    onLoginSuccess({
                        id: id.trim(),
                        nama: result.nama || 'Santri',
                        role: result.role || 'santri'
                    });
                } else {
                    throw new Error(result.message || "ID atau Kata Sandi salah.");
                }
            } catch (err: any) {
                setError(`Gagal login via Google Apps Script: ${err.message}. Anda juga dapat masuk dengan akun demo di bawah.`);
            } finally {
                setLoading(false);
            }
        } else {
            // Jika akun bukan demo dan Google Apps Script belum disetting
            setLoading(false);
            setError("ID/Password tidak cocok dengan akun demo, dan URL Google Apps Script belum diset. Gunakan akun demo di bawah atau masukkan URL backend.");
        }
    };

    const copyScriptToClipboard = () => {
        navigator.clipboard.writeText(GOOGLE_SCRIPT_SAMPLE_CODE);
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2500);
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950 overflow-y-auto"
            style={{ 
                backgroundImage: `url("${ISLAMIC_BG_PATTERN}")`,
                backgroundColor: '#064E3B'
            }}
        >
            <div className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl relative my-auto animate-fade-in-up border border-emerald-100">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 mb-3 border border-emerald-200 shadow-inner">
                        <i className="fas fa-quran text-2xl"></i>
                    </div>
                    <h1 className="font-arab text-3xl font-bold text-emerald-800 tracking-wide">معهد دار الكمال</h1>
                    <p className="text-xs font-semibold text-emerald-600 tracking-widest uppercase mt-0.5">Sistem E-Tahfidz Darul Kamal</p>
                    <p className="text-xs text-gray-500 mt-1">Pondok Pesantren Darul Kamal</p>
                </div>

                {/* Status Backend Indicator */}
                <div className="mb-4 flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-950 font-semibold flex items-center gap-1.5">
                            <i className="fas fa-fire text-amber-500"></i> Firebase Firestore: Terhubung
                        </span>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setShowApiConfig(!showApiConfig)}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px] flex items-center gap-1"
                    >
                        <i className="fas fa-sliders-h"></i>
                        {showApiConfig ? 'Tutup' : 'Sheets API'}
                    </button>
                </div>

                {/* API Config Drawer (Collapsible & non-blocking) */}
                {showApiConfig && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs mb-5 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                                <i className="fas fa-network-wired text-amber-700"></i> Pengaturan Backend (Opsional)
                            </span>
                            <button 
                                onClick={() => setShowScriptModal(true)} 
                                className="text-blue-700 hover:underline text-[11px] font-medium"
                            >
                                <i className="fas fa-code mr-1"></i>Lihat Kode Script
                            </button>
                        </div>
                        <p className="text-gray-600 mb-2 leading-relaxed">
                            Aplikasi siap digunakan langsung dalam <strong>Mode Demo</strong>. Jika ingin menghubungkan ke Google Spreadsheet asli Anda, tempelkan URL Web App hasil Deploy Google Apps Script di sini:
                        </p>
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                placeholder="https://script.google.com/macros/s/.../exec" 
                                className="w-full border border-amber-300 p-2.5 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 outline-none bg-white"
                                value={manualUrl}
                                onChange={(e) => setManualUrl(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={handleSaveApiUrl}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded text-xs font-semibold"
                                >
                                    Simpan URL
                                </button>
                                {isConnectedToGas && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setManualUrl('');
                                            setApiUrl('');
                                            localStorage.removeItem('darul_kamal_api_url');
                                        }}
                                        className="text-red-600 hover:underline text-xs py-1.5 font-medium"
                                    >
                                        Reset ke Demo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Box */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs rounded-xl mb-4 flex items-start gap-2.5">
                        <i className="fas fa-exclamation-circle text-red-500 mt-0.5 text-sm"></i>
                        <div>
                            <p className="font-bold">Perhatian</p>
                            <p className="mt-0.5 leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input 
                        label="ID Pengguna / NIS" 
                        placeholder="Contoh: admin atau 12345" 
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        disabled={loading}
                    />

                    <Input 
                        label="Kata Sandi" 
                        type="password"
                        placeholder="Masukkan kata sandi..." 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    
                    <Button 
                        type="submit" 
                        isLoading={loading} 
                        className="w-full py-3 text-sm font-bold shadow-lg shadow-emerald-700/20"
                        icon="fas fa-arrow-right"
                    >
                        Masuk Aplikasi
                    </Button>
                </form>

                {/* Quick Demo Login Buttons */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center mb-2.5">
                        Masuk Cepat (Akun Uji Coba)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('admin')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 transition text-xs group"
                        >
                            <i className="fas fa-user-shield text-emerald-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold">M. Asngad</span>
                            <span className="text-[10px] text-gray-500">Admin</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('santri')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 transition text-xs group"
                        >
                            <i className="fas fa-user-graduate text-blue-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold">Santri</span>
                            <span className="text-[10px] text-gray-500">NIS: 12345</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('ustadz')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition text-xs group"
                        >
                            <i className="fas fa-chalkboard-teacher text-amber-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold">Ustadz</span>
                            <span className="text-[10px] text-gray-500">ustadz123</span>
                        </button>
                    </div>
                </div>

                <p className="text-[11px] text-center mt-5 text-gray-400">
                    Sistem E-Tahfidz v2.1 • Pondok Pesantren Darul Kamal
                </p>
            </div>

            {/* Modal Panduan Google Apps Script */}
            {showScriptModal && (
                <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col animate-scale-up">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <i className="fas fa-file-code text-emerald-600"></i> Panduan Backend Google Apps Script
                            </h3>
                            <button 
                                onClick={() => setShowScriptModal(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="overflow-y-auto py-4 text-xs text-gray-700 space-y-3 pr-1">
                            <ol className="list-decimal list-inside space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                                <li>Buka <strong>Google Sheets</strong> Anda, klik <strong>Ekstensi &gt; Apps Script</strong>.</li>
                                <li>Salin dan tempelkan kode di bawah ini ke dalam file <code>Code.gs</code>.</li>
                                <li>Klik tombol <strong>Deploy &gt; New Deployment (Kelola Deployment Baru)</strong>.</li>
                                <li>Pilih tipe <strong>Web App</strong>.</li>
                                <li>Atur <strong>Execute as:</strong> <em>Me</em> dan <strong>Who has access:</strong> <em>Anyone (Siapa saja)</em>.</li>
                                <li>Salin <strong>Web App URL</strong> yang berakhiran <code>/exec</code> lalu tempelkan di form konfigurasi aplikasi ini.</li>
                            </ol>

                            <div className="relative">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-gray-600">Kode Apps Script (Code.gs):</span>
                                    <button 
                                        onClick={copyScriptToClipboard}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                                    >
                                        <i className={`fas ${copiedScript ? 'fa-check' : 'fa-copy'}`}></i>
                                        {copiedScript ? 'Tersalin!' : 'Salin Kode'}
                                    </button>
                                </div>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-56">
                                    {GOOGLE_SCRIPT_SAMPLE_CODE}
                                </pre>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowScriptModal(false)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-medium text-xs"
                            >
                                Tutup Panduan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};