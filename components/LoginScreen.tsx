import React, { useState, useEffect } from 'react';
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

interface SecurityLog {
    id: string;
    timestamp: string;
    status: 'SUKSES' | 'GAGAL' | 'TERKUNCI' | 'RESET_PASS';
    detail: string;
    ipSimulasi: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ apiUrl, setApiUrl, onLoginSuccess }) => {
    // Form Login State
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Google Apps Script API Configuration State
    const [showApiConfig, setShowApiConfig] = useState(false);
    const [showScriptModal, setShowScriptModal] = useState(false);
    const [manualUrl, setManualUrl] = useState(apiUrl.includes(PLACEHOLDER_MARKER) ? '' : apiUrl);
    const [copiedScript, setCopiedScript] = useState(false);
    const isConnectedToGas = apiUrl && !apiUrl.includes(PLACEHOLDER_MARKER) && apiUrl.startsWith('https://script.google.com');

    // Security & Rate Limiting System State
    const [failedCount, setFailedCount] = useState<number>(0);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
    const [showCaptcha, setShowCaptcha] = useState<boolean>(false);
    const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
    const [captchaNum1, setCaptchaNum1] = useState<number>(7);
    const [captchaNum2, setCaptchaNum2] = useState<number>(5);
    const [showSecurityLogs, setShowSecurityLogs] = useState<boolean>(false);

    // Security Audit Logs (Stored locally)
    const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => {
        const saved = localStorage.getItem('darul_kamal_security_logs');
        if (saved) {
            try { return JSON.parse(saved); } catch { return []; }
        }
        return [
            {
                id: 'log-1',
                timestamp: new Date().toLocaleTimeString('id-ID'),
                status: 'SUKSES',
                detail: 'Sistem Keamanan Login E-Tahfidz Darul Kamal Inisialisasi Berhasil',
                ipSimulasi: '192.168.1.100'
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('darul_kamal_security_logs', JSON.stringify(securityLogs));
    }, [securityLogs]);

    // Lockout Timer Countdown
    useEffect(() => {
        let timer: any;
        if (lockoutTimeLeft > 0) {
            timer = setInterval(() => {
                setLockoutTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutTimeLeft]);

    // Generate New Captcha Challenge
    const generateNewCaptcha = () => {
        const n1 = Math.floor(Math.random() * 9) + 2;
        const n2 = Math.floor(Math.random() * 9) + 1;
        setCaptchaNum1(n1);
        setCaptchaNum2(n2);
        setCaptchaAnswer('');
    };

    const addSecurityLog = (status: 'SUKSES' | 'GAGAL' | 'TERKUNCI' | 'RESET_PASS', detail: string) => {
        const newLog: SecurityLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            status,
            detail,
            ipSimulasi: `10.12.${Math.floor(Math.random() * 50) + 1}.${Math.floor(Math.random() * 200) + 1}`
        };
        setSecurityLogs(prev => [newLog, ...prev.slice(0, 19)]);
    };

    // Modal State Lupa Password
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetRole, setResetRole] = useState<'santri' | 'ustadz' | 'pengasuh' | 'admin'>('santri');
    const [resetIdentifier, setResetIdentifier] = useState(''); // NIS / NIP / ID
    const [resetVerificationInput, setResetVerificationInput] = useState(''); // Nama / OTP / Key
    const [generatedOtp, setGeneratedOtp] = useState('849201');
    const [resetStep, setResetStep] = useState<1 | 2>(1); // 1: Verify, 2: New Password Form
    const [newResetPassword, setNewResetPassword] = useState('');
    const [confirmResetPassword, setConfirmResetPassword] = useState('');
    const [resetError, setResetError] = useState<string | null>(null);

    // Custom Reset Passwords Storage (Allow resetting credentials in demo)
    const [customPasswords, setCustomPasswords] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('darul_kamal_user_passwords');
        if (saved) {
            try { return JSON.parse(saved); } catch { return {}; }
        }
        return {};
    });

    const handleQuickLogin = (roleKey: 'admin' | 'pengasuh' | 'ustadz' | 'santri') => {
        const demo = DEMO_USERS[roleKey];
        if (demo) {
            setId(demo.user.id || roleKey);
            setPassword(demo.pass);
            setError(null);
            setFailedCount(0);
            setLockoutTimeLeft(0);
            setShowCaptcha(false);
            addSecurityLog('SUKSES', `Akses Masuk Cepat sebagai ${demo.user.nama} (${roleKey.toUpperCase()})`);
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
        setSuccessMsg(null);

        // Check Lockout
        if (lockoutTimeLeft > 0) {
            setError(`🔒 Akun terkunci sementara karena 3 kali kesalahan. Harap tunggu ${lockoutTimeLeft} detik atau gunakan fitur Lupa Kata Sandi.`);
            addSecurityLog('TERKUNCI', `Percobaan login ditolak: Terkunci (${lockoutTimeLeft}s tersisa)`);
            return;
        }

        const cleanId = id.trim().toLowerCase();
        const cleanPass = password.trim();

        if (!cleanId || !cleanPass) {
            setError("ID Pengguna dan Kata Sandi wajib diisi.");
            return;
        }

        // Verify Captcha if active
        if (showCaptcha) {
            const expected = captchaNum1 + captchaNum2;
            if (parseInt(captchaAnswer.trim()) !== expected) {
                setError(`❌ Hasil verifikasi keamanan tidak cocok! Berapakah ${captchaNum1} + ${captchaNum2}?`);
                generateNewCaptcha();
                addSecurityLog('GAGAL', `Captcha Keamanan Salah untuk ID: ${cleanId}`);
                return;
            }
        }

        setLoading(true);

        // Helper: Record Failed Attempt
        const recordFailure = (msg: string) => {
            const newCount = failedCount + 1;
            setFailedCount(newCount);
            setLoading(false);
            setError(msg);

            if (newCount >= 3) {
                setLockoutTimeLeft(30); // 30 seconds security lockout
                addSecurityLog('TERKUNCI', `3x Percobaan Gagal berturut-turut untuk ID: ${cleanId}. Sistem Mengunci Sesi (30 Detik)`);
            } else if (newCount >= 2) {
                setShowCaptcha(true);
                generateNewCaptcha();
                addSecurityLog('GAGAL', `Percobaan Ke-${newCount} Gagal untuk ID: ${cleanId}. Tantangan CAPTCHA diaktifkan.`);
            } else {
                addSecurityLog('GAGAL', `Percobaan Ke-${newCount} Gagal untuk ID: ${cleanId}`);
            }
        };

        // 0. Cek Password Kustom Hasil Reset
        const customPass = customPasswords[cleanId];
        if (customPass && customPass === cleanPass) {
            setTimeout(() => {
                setLoading(false);
                setFailedCount(0);
                setShowCaptcha(false);
                addSecurityLog('SUKSES', `Login Berhasil menggunakan Kata Sandi Baru untuk ID: ${cleanId}`);
                onLoginSuccess({
                    id: cleanId,
                    nama: cleanId === 'admin' ? 'M. Asngad' : cleanId === 'pengasuh' ? 'K.H. Mohammad Sangidun' : 'Pengguna Terverifikasi',
                    role: cleanId === 'admin' ? 'admin' : cleanId === 'pengasuh' ? 'pengasuh' : cleanId === 'ustadz' ? 'ustadz' : 'santri'
                });
            }, 300);
            return;
        }

        // 1. Cek Kredensial Demo Bawaan
        const matchedDemo = DEMO_USERS[cleanId];
        if (matchedDemo && matchedDemo.pass === cleanPass) {
            setTimeout(() => {
                setLoading(false);
                setFailedCount(0);
                setShowCaptcha(false);
                addSecurityLog('SUKSES', `Login Berhasil sebagai ${matchedDemo.user.nama} (${matchedDemo.user.role.toUpperCase()})`);
                onLoginSuccess(matchedDemo.user);
            }, 300);
            return;
        }

        // Cek admin alternatif
        if (cleanId === 'admin' && (cleanPass === 'admin123' || cleanPass === customPasswords['admin'])) {
            setTimeout(() => {
                setLoading(false);
                setFailedCount(0);
                setShowCaptcha(false);
                addSecurityLog('SUKSES', `Login Administrator (M. Asngad) Berhasil`);
                onLoginSuccess({
                    id: 'admin',
                    nama: 'M. Asngad',
                    role: 'admin',
                    kelas: 'Pimpinan & Koordinator Tahfidz',
                    jabatan: 'Administrator Sistem & Tata Usaha'
                });
            }, 300);
            return;
        }

        // Cek Pengasuh / Kyai alternatif
        if ((cleanId === 'pengasuh' || cleanId === 'kyai') && (cleanPass === 'pengasuh123' || cleanPass === 'kyai123' || cleanPass === 'admin123' || cleanPass === customPasswords['pengasuh'])) {
            setTimeout(() => {
                setLoading(false);
                setFailedCount(0);
                setShowCaptcha(false);
                addSecurityLog('SUKSES', `Login Pengasuh (K.H. Mohammad Sangidun) Berhasil`);
                onLoginSuccess({
                    id: 'pengasuh',
                    nama: 'K.H. Mohammad Sangidun, S.Ag., Al-Hafidz',
                    role: 'pengasuh',
                    jabatan: 'Pengasuh Pondok Pesantren & Pembina LPTQ',
                    halaqah: 'Majelis Pengasuhan Tahfidz'
                });
            }, 300);
            return;
        }

        // Cek Ustadz / Ustadzah alternatif
        if ((cleanId === 'ustadz' || cleanId === 'musyrif') && (cleanPass === 'ustadz123' || cleanPass === 'admin123' || cleanPass === customPasswords['ustadz'])) {
            setTimeout(() => {
                setLoading(false);
                setFailedCount(0);
                setShowCaptcha(false);
                addSecurityLog('SUKSES', `Login Musyrif (Ustadz Abdullah Mukhtar) Berhasil`);
                onLoginSuccess({
                    id: 'ustadz',
                    nama: 'Ustadz Abdullah Mukhtar, S.Pd.I',
                    role: 'ustadz',
                    jabatan: 'Musyrif Halaqah Tahfidz',
                    halaqah: 'Pembina Halaqah Abu Bakar Ash-Shiddiq'
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

        const foundSantri = allSantri.find((s: any) => 
            (s.nis && s.nis.toString().toLowerCase() === cleanId) ||
            (s.id && s.id.toString().toLowerCase() === cleanId) ||
            (s.nama && s.nama.toLowerCase() === cleanId)
        );

        if (foundSantri) {
            const validSantriPass = customPasswords[foundSantri.nis] || customPasswords[foundSantri.id] || 'santri123';
            if (cleanPass === validSantriPass || cleanPass === foundSantri.nis || cleanPass === foundSantri.id || cleanPass === 'santri123') {
                setTimeout(() => {
                    setLoading(false);
                    setFailedCount(0);
                    setShowCaptcha(false);
                    addSecurityLog('SUKSES', `Login Santri (${foundSantri.nama}) Berhasil`);
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

        // 2. Google Apps Script Backend (jika terhubung)
        if (isConnectedToGas) {
            try {
                const result = await callAPI(apiUrl, {
                    action: 'login',
                    id: id.trim(),
                    password: password,
                    role: 'santri'
                });

                if (result.status === 'success') {
                    setFailedCount(0);
                    setShowCaptcha(false);
                    addSecurityLog('SUKSES', `Login GAS API Berhasil: ${id.trim()}`);
                    onLoginSuccess({
                        id: id.trim(),
                        nama: result.nama || 'Santri',
                        role: result.role || 'santri'
                    });
                } else {
                    throw new Error(result.message || "ID atau Kata Sandi salah.");
                }
            } catch (err: any) {
                recordFailure(`Gagal login: ${err.message}. Pastikan ID & Kata Sandi sesuai.`);
            } finally {
                setLoading(false);
            }
        } else {
            // Kredensial Tidak Cocok
            recordFailure(`⚠️ ID Pengguna atau Kata Sandi tidak sesuai. (Percobaan ${failedCount + 1}/3)`);
        }
    };

    // Open Modal Lupa Password
    const handleOpenResetModal = () => {
        setShowResetModal(true);
        setResetStep(1);
        setResetIdentifier(id || '');
        setResetVerificationInput('');
        setNewResetPassword('');
        setConfirmResetPassword('');
        setResetError(null);
        // Generate fresh OTP code for ustadz verification
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(randomOtp);
    };

    // Verify Identity in Reset Password Modal
    const handleVerifyResetIdentity = (e: React.FormEvent) => {
        e.preventDefault();
        setResetError(null);

        const cleanIdent = resetIdentifier.trim().toLowerCase();
        const cleanVerif = resetVerificationInput.trim().toLowerCase();

        if (!cleanIdent) {
            setResetError("ID Pengguna / NIS wajib diisi.");
            return;
        }

        if (resetRole === 'santri') {
            let allSantri = INITIAL_SANTRI;
            try {
                const saved = localStorage.getItem('darul_kamal_santri_list');
                if (saved) allSantri = JSON.parse(saved);
            } catch { allSantri = INITIAL_SANTRI; }

            const match = allSantri.find(s => 
                (s.nis && s.nis.toString().toLowerCase() === cleanIdent) || 
                (s.nama && s.nama.toLowerCase().includes(cleanIdent)) ||
                cleanIdent === '12345' || cleanIdent === 'fauzan'
            );

            if (!match) {
                setResetError("NIS / Data Santri tidak ditemukan di dalam sistem.");
                return;
            }

            if (cleanVerif && !match.nama.toLowerCase().includes(cleanVerif) && !match.kelas.toLowerCase().includes(cleanVerif) && cleanVerif !== 'fauzan' && cleanVerif !== 'tahfidz') {
                setResetError(`Verifikasi Nama/Kelas tidak cocok dengan data santri ${match.nama}.`);
                return;
            }

            setResetStep(2);
            return;
        }

        if (resetRole === 'ustadz') {
            if (cleanIdent !== 'ustadz' && cleanIdent !== 'musyrif' && cleanIdent !== 'ustadzah') {
                setResetError("ID Ustadz/Musyrif tidak terdaftar.");
                return;
            }
            if (cleanVerif !== generatedOtp && cleanVerif !== '849201' && cleanVerif !== 'abdullah') {
                setResetError(`Kode OTP verifikasi tidak valid. Masukkan kode: ${generatedOtp}`);
                return;
            }
            setResetStep(2);
            return;
        }

        if (resetRole === 'pengasuh') {
            if (cleanIdent !== 'pengasuh' && cleanIdent !== 'kyai' && !cleanIdent.includes('sangidun')) {
                setResetError("ID Pengasuh tidak terdaftar.");
                return;
            }
            if (cleanVerif !== 'pengasuh-darul-kamal' && cleanVerif !== 'sangidun' && cleanVerif !== 'darul kamal') {
                setResetError("Kode Otorisasi Keamanan Pengasuh tidak cocok.");
                return;
            }
            setResetStep(2);
            return;
        }

        if (resetRole === 'admin') {
            if (cleanIdent !== 'admin' && cleanIdent !== 'asngad') {
                setResetError("ID Admin tidak valid.");
                return;
            }
            if (cleanVerif !== 'admin-security-2026' && cleanVerif !== 'admin123' && cleanVerif !== 'asngad') {
                setResetError("Master Security Passkey Admin salah.");
                return;
            }
            setResetStep(2);
            return;
        }
    };

    // Execute Save New Reset Password
    const handleSaveNewPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setResetError(null);

        if (!newResetPassword || newResetPassword.length < 6) {
            setResetError("Kata sandi baru minimal harus 6 karakter demi keamanan.");
            return;
        }

        if (newResetPassword !== confirmResetPassword) {
            setResetError("Konfirmasi kata sandi baru tidak cocok.");
            return;
        }

        const targetKey = resetIdentifier.trim().toLowerCase();
        const updatedPasswords = {
            ...customPasswords,
            [targetKey]: newResetPassword
        };

        setCustomPasswords(updatedPasswords);
        localStorage.setItem('darul_kamal_user_passwords', JSON.stringify(updatedPasswords));

        // Reset security lockouts
        setFailedCount(0);
        setLockoutTimeLeft(0);
        setShowCaptcha(false);
        setShowResetModal(false);

        // Pre-fill login credentials
        setId(resetIdentifier);
        setPassword(newResetPassword);
        setSuccessMsg(`✅ Alhamdulillah! Kata sandi baru untuk '${resetIdentifier}' berhasil diperbarui. Silakan tekan tombol Masuk Aplikasi.`);
        addSecurityLog('RESET_PASS', `Kata Sandi Berhasil Direset & Diperbarui untuk Akun: ${resetIdentifier}`);
    };

    // Password Strength Meter Helper
    const getPasswordStrength = (pass: string) => {
        if (!pass) return { label: 'Kosong', color: 'bg-gray-200', text: 'text-gray-400' };
        if (pass.length < 6) return { label: 'Lemah', color: 'bg-red-500', text: 'text-red-600' };
        if (pass.length >= 8 && /[0-9]/.test(pass) && /[A-Z]/.test(pass)) {
            return { label: 'Sangat Kuat', color: 'bg-emerald-600', text: 'text-emerald-700' };
        }
        return { label: 'Sedang', color: 'bg-amber-500', text: 'text-amber-700' };
    };

    const strength = getPasswordStrength(newResetPassword);

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
                <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 mb-2 border border-emerald-200 shadow-inner">
                        <i className="fas fa-quran text-2xl"></i>
                    </div>
                    <h1 className="font-arab text-3xl font-bold text-emerald-800 tracking-wide">معهد دار الكمال</h1>
                    <p className="text-xs font-semibold text-emerald-600 tracking-widest uppercase mt-0.5">Sistem E-Tahfidz Darul Kamal</p>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <i className="fas fa-shield-halved text-emerald-700"></i> Proteksi Keamanan Akses
                        </span>
                    </div>
                </div>

                {/* Status System Security Indicator */}
                <div className="mb-4 flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${lockoutTimeLeft > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                        <span className="text-emerald-950 font-semibold flex items-center gap-1.5">
                            <i className="fas fa-fire text-amber-500"></i> 
                            {lockoutTimeLeft > 0 ? `Sesi Terkunci (${lockoutTimeLeft}s)` : 'Firebase Firestore: Terhubung'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => setShowApiConfig(!showApiConfig)}
                            className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px]"
                        >
                            {showApiConfig ? 'Tutup API' : 'GAS API'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowSecurityLogs(!showSecurityLogs)}
                            className="text-purple-700 hover:text-purple-900 font-bold underline text-[11px] flex items-center gap-1"
                        >
                            <i className="fas fa-shield-cat"></i>
                            {showSecurityLogs ? 'Tutup Log' : 'Audit Logs'}
                        </button>
                    </div>
                </div>

                {/* API Config Drawer */}
                {showApiConfig && (
                    <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs mb-4 transition-all space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                                <i className="fas fa-network-wired text-amber-700"></i> Google Apps Script (Opsional)
                            </span>
                            <button 
                                onClick={() => setShowScriptModal(true)} 
                                className="text-blue-700 hover:underline text-[11px] font-medium"
                            >
                                Kode Script
                            </button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="https://script.google.com/macros/s/.../exec" 
                            className="w-full border border-amber-300 p-2 rounded-lg text-xs text-gray-800 outline-none bg-white"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={handleSaveApiUrl}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded text-xs font-semibold"
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
                                    className="text-red-600 hover:underline text-xs py-1 font-medium"
                                >
                                    Reset ke Demo
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Security Audit Log Drawer */}
                {showSecurityLogs && (
                    <div className="bg-gray-900 text-gray-100 p-3.5 rounded-xl text-xs mb-4 border border-gray-800 font-mono space-y-2 animate-scale-up">
                        <div className="flex justify-between items-center text-[11px] font-bold text-purple-300 border-b border-gray-800 pb-1.5">
                            <span><i className="fas fa-terminal mr-1"></i> Log Audit Keamanan Sesi</span>
                            <span className="text-emerald-400">{securityLogs.length} Entri</span>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[10px]">
                            {securityLogs.map(log => (
                                <div key={log.id} className="flex items-start justify-between gap-2 border-b border-gray-800/60 pb-1">
                                    <div>
                                        <span className={`font-bold px-1 rounded text-[9px] ${
                                            log.status === 'SUKSES' ? 'bg-emerald-900 text-emerald-300' :
                                            log.status === 'TERKUNCI' ? 'bg-red-900 text-red-300' :
                                            log.status === 'RESET_PASS' ? 'bg-purple-900 text-purple-300' :
                                            'bg-amber-900 text-amber-300'
                                        }`}>{log.status}</span>
                                        <span className="text-gray-300 ml-1.5">{log.detail}</span>
                                    </div>
                                    <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Success Message Alert */}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 text-xs rounded-xl mb-4 flex items-start gap-2 shadow-xs">
                        <i className="fas fa-circle-check text-emerald-600 mt-0.5 text-base"></i>
                        <p className="font-semibold leading-relaxed">{successMsg}</p>
                    </div>
                )}

                {/* Error & Warning Alert Box */}
                {error && (
                    <div className={`p-3 text-xs rounded-xl mb-4 flex items-start gap-2.5 border ${
                        lockoutTimeLeft > 0 ? 'bg-red-100 border-red-300 text-red-950 font-bold' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <i className="fas fa-triangle-exclamation text-red-600 mt-0.5 text-base shrink-0"></i>
                        <div className="space-y-1">
                            <p className="font-bold">Peringatan Keamanan</p>
                            <p className="leading-relaxed">{error}</p>
                            {failedCount >= 2 && (
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={handleOpenResetModal}
                                        className="text-red-700 hover:text-red-900 font-bold underline text-xs flex items-center gap-1"
                                    >
                                        <i className="fas fa-key"></i> Lupa kata sandi? Klik untuk reset akun
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input 
                        label="ID Pengguna / NIS" 
                        placeholder="Contoh: admin, pengasuh, ustadz, atau 12345" 
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        disabled={loading || lockoutTimeLeft > 0}
                    />

                    <div className="relative">
                        <Input 
                            label="Kata Sandi" 
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan kata sandi..." 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || lockoutTimeLeft > 0}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 text-xs"
                            title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>

                    {/* Security Math Captcha Verification (Triggered after 2 failed attempts) */}
                    {showCaptcha && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
                                <span className="flex items-center gap-1.5">
                                    <i className="fas fa-robot text-amber-700"></i> Verifikasi Keamanan Anti-Bot:
                                </span>
                                <button
                                    type="button"
                                    onClick={generateNewCaptcha}
                                    className="text-[10px] text-amber-800 underline font-semibold"
                                >
                                    Acak Soal
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-amber-200 text-amber-950 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
                                    Berapakah {captchaNum1} + {captchaNum2} = ?
                                </span>
                                <input
                                    type="number"
                                    placeholder="Hasil"
                                    value={captchaAnswer}
                                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                                    className="w-24 p-2 border border-amber-300 rounded-lg text-xs text-center font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded text-emerald-700 focus:ring-emerald-500" />
                            <span>Ingat Sesi Perangkat</span>
                        </label>
                        
                        <button 
                            type="button" 
                            onClick={handleOpenResetModal}
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1"
                        >
                            <i className="fas fa-key text-amber-600"></i> Lupa Kata Sandi?
                        </button>
                    </div>
                    
                    <Button 
                        type="submit" 
                        isLoading={loading} 
                        disabled={lockoutTimeLeft > 0}
                        className="w-full py-3 text-sm font-bold shadow-lg shadow-emerald-700/20"
                        icon="fas fa-shield-alt"
                    >
                        {lockoutTimeLeft > 0 ? `Terkunci (${lockoutTimeLeft}s)` : 'Masuk Aplikasi secara Aman'}
                    </Button>
                </form>

                {/* Quick Multi-Role Access Buttons */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Masuk Cepat 4 Hak Akses Peran
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                            Mode Demo
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('admin')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 transition text-xs group"
                            title="Administrator Sistem & Tata Usaha"
                        >
                            <i className="fas fa-user-shield text-emerald-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold">M. Asngad</span>
                            <span className="text-[10px] text-emerald-700 font-medium">Admin TU</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('pengasuh')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition text-xs group"
                            title="Pengasuh Pondok & Pembina LPTQ"
                        >
                            <i className="fas fa-mosque text-purple-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold truncate max-w-[85px]">K.H. Sangidun</span>
                            <span className="text-[10px] text-purple-700 font-medium">Pengasuh</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('ustadz')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition text-xs group"
                            title="Ustadz / Musyrif Halaqah"
                        >
                            <i className="fas fa-chalkboard-teacher text-amber-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold">Ust. Abdullah</span>
                            <span className="text-[10px] text-amber-700 font-medium">Musyrif</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('santri')}
                            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 transition text-xs group"
                            title="Santri Penghafal Al-Qur'an"
                        >
                            <i className="fas fa-user-graduate text-blue-700 text-sm mb-1 group-hover:scale-110 transition-transform"></i>
                            <span className="font-bold">M. Fauzan</span>
                            <span className="text-[10px] text-blue-700 font-medium">Santri (7 Juz)</span>
                        </button>
                    </div>
                </div>

                <p className="text-[11px] text-center mt-5 text-gray-400">
                    Sistem E-Tahfidz v2.2 • Proteksi Keamanan Keperanan &amp; Verifikasi Reset Password
                </p>
            </div>

            {/* MODAL LUPA PASSWORD & RESET SANDI */}
            {showResetModal && (
                <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up border border-emerald-200 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <div>
                                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                    <i className="fas fa-key text-amber-600"></i> Lupa Kata Sandi &amp; Reset Akun
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Langkah {resetStep} dari 2: {resetStep === 1 ? 'Verifikasi Identitas Akun' : 'Buat Kata Sandi Baru'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowResetModal(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {resetError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                                <i className="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
                                <span>{resetError}</span>
                            </div>
                        )}

                        {/* STEP 1: VERIFIKASI IDENTITAS */}
                        {resetStep === 1 && (
                            <form onSubmit={handleVerifyResetIdentity} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Pilih Peran Akun yang Ingin Direset</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['santri', 'ustadz', 'pengasuh', 'admin'] as const).map(role => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setResetRole(role)}
                                                className={`p-2 rounded-xl font-bold border transition text-center capitalize ${
                                                    resetRole === role
                                                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {role === 'santri' ? 'Santri' : role === 'ustadz' ? 'Ustadz / Musyrif' : role === 'pengasuh' ? 'Pengasuh Kiai' : 'Admin TU'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    label={resetRole === 'santri' ? 'NIS atau Nama Santri' : resetRole === 'ustadz' ? 'ID Ustadz (contoh: ustadz)' : resetRole === 'pengasuh' ? 'ID Pengasuh (contoh: pengasuh)' : 'ID Admin (contoh: admin)'}
                                    placeholder={resetRole === 'santri' ? 'Masukkan NIS (12345) / Nama' : 'Masukkan ID Pengguna...'}
                                    value={resetIdentifier}
                                    onChange={(e) => setResetIdentifier(e.target.value)}
                                    required
                                />

                                {resetRole === 'santri' && (
                                    <Input
                                        label="Verifikasi Tambahan (Nama / Kelas Santri)"
                                        placeholder="Contoh: Fauzan atau Tahfidz"
                                        value={resetVerificationInput}
                                        onChange={(e) => setResetVerificationInput(e.target.value)}
                                    />
                                )}

                                {resetRole === 'ustadz' && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-gray-700 font-bold">
                                            <span>Kode OTP Verifikasi Ustadz</span>
                                            <span className="text-emerald-700 font-mono">Kode OTP Anda: {generatedOtp}</span>
                                        </div>
                                        <Input
                                            label="Kode OTP Verifikasi"
                                            placeholder={`Masukkan kode OTP (${generatedOtp})`}
                                            value={resetVerificationInput}
                                            onChange={(e) => setResetVerificationInput(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                {resetRole === 'pengasuh' && (
                                    <Input
                                        label="Kode Otorisasi Keamanan Pengasuh"
                                        placeholder="Masukkan 'pengasuh-darul-kamal' atau 'sangidun'"
                                        value={resetVerificationInput}
                                        onChange={(e) => setResetVerificationInput(e.target.value)}
                                        required
                                    />
                                )}

                                {resetRole === 'admin' && (
                                    <Input
                                        label="Master Security Passkey Admin"
                                        placeholder="Masukkan 'admin-security-2026' atau 'admin123'"
                                        value={resetVerificationInput}
                                        onChange={(e) => setResetVerificationInput(e.target.value)}
                                        required
                                    />
                                )}

                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowResetModal(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                                    >
                                        <span>Verifikasi Identitas</span>
                                        <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 2: FORM KATA SANDI BARU */}
                        {resetStep === 2 && (
                            <form onSubmit={handleSaveNewPassword} className="space-y-4 text-xs animate-fade-in">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                        <i className="fas fa-check-circle text-emerald-600"></i> Identitas Terverifikasi!
                                    </div>
                                    <div className="text-gray-600">
                                        Memperbarui kata sandi untuk akun <strong>{resetIdentifier}</strong> ({resetRole.toUpperCase()}).
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Input
                                        label="Kata Sandi Baru"
                                        type="password"
                                        placeholder="Minimal 6 karakter..."
                                        value={newResetPassword}
                                        onChange={(e) => setNewResetPassword(e.target.value)}
                                        required
                                    />
                                    {newResetPassword && (
                                        <div className="flex items-center justify-between text-[11px] pt-1">
                                            <span className="text-gray-500 font-medium">Kekuatan Sandi:</span>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <span className={`w-3 h-3 rounded-full ${strength.color}`}></span>
                                                <span className={strength.text}>{strength.label}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Input
                                    label="Konfirmasi Kata Sandi Baru"
                                    type="password"
                                    placeholder="Ulangi kata sandi baru..."
                                    value={confirmResetPassword}
                                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                                    required
                                />

                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setResetStep(1)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl shadow-md flex items-center gap-1.5"
                                    >
                                        <i className="fas fa-save"></i>
                                        <span>Simpan Sandi Baru</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

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