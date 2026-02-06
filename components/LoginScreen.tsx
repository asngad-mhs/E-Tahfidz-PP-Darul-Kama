import React, { useState, useEffect } from 'react';
import { callAPI } from '../services/apiService';
import { User } from '../types';
import { PLACEHOLDER_MARKER, ISLAMIC_BG_PATTERN } from '../constants';
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
    const [manualUrl, setManualUrl] = useState('');

    useEffect(() => {
        // Check if URL is dummy/default on mount
        const isDummy = apiUrl.includes(PLACEHOLDER_MARKER) || apiUrl === "";
        setShowApiConfig(isDummy);
    }, [apiUrl]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        let currentUrl = apiUrl;

        // Validation for initial setup
        if (showApiConfig) {
            if (!manualUrl.trim() || !manualUrl.startsWith('https://script.google.com')) {
                setError("URL API belum disetting! Masukkan URL Web App Google Script yang valid.");
                setLoading(false);
                return;
            }
            currentUrl = manualUrl.trim();
            // Update the global API URL state
            setApiUrl(currentUrl);
        }

        try {
            if (!id || !password) {
                throw new Error("ID dan Kata Sandi wajib diisi.");
            }

            const result = await callAPI(currentUrl, {
                action: 'login',
                id: id,
                password: password,
                role: 'santri' // Default role per requirements
            });

            if (result.status === 'success') {
                onLoginSuccess({
                    nama: result.nama || 'Santri',
                    role: result.role || 'santri'
                });
            } else {
                throw new Error(result.message || "Login gagal. Periksa ID/Password.");
            }

        } catch (err: any) {
            setError(err.message);
            // If failed, allow re-checking URL config if it was manually entered just now
            if (showApiConfig) {
                // Keep config open
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-850"
            style={{ 
                backgroundImage: `url("${ISLAMIC_BG_PATTERN}")`,
                backgroundColor: '#064E3B'
            }}
        >
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl relative animate-fade-in-up">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="font-arab text-3xl font-bold text-emerald-800 mb-1">معهد دار الكمال</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Sistem E-Tahfidz</p>
                </div>

                {/* API Config Area (Conditional) */}
                {showApiConfig && (
                    <div className="bg-red-50 p-3 rounded border border-red-200 text-sm mb-4 animate-pulse">
                        <label className="block font-bold text-red-700 mb-1 text-xs uppercase">
                            Konfigurasi URL API Backend
                        </label>
                        <input 
                            type="text" 
                            placeholder="Tempel URL Web App (/exec) di sini..." 
                            className="w-full border border-red-300 p-2 rounded text-xs focus:ring-red-500 focus:border-red-500 text-gray-700 outline-none"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                        />
                        <p className="text-[10px] text-red-500 mt-1">
                            *Wajib diisi agar tidak error "Failed to fetch". Dapatkan URL dari Deploy Google Apps Script.
                        </p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <Input 
                        label="ID Pengguna / NIS" 
                        placeholder="Contoh: 12345" 
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        disabled={loading}
                    />

                    <Input 
                        label="Kata Sandi" 
                        type="password"
                        placeholder="******" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    
                    <Button 
                        type="submit" 
                        isLoading={loading} 
                        className="w-full"
                        icon="fas fa-arrow-right"
                    >
                        Masuk Aplikasi
                    </Button>
                </form>
                
                <p className="text-xs text-center mt-6 text-gray-400">
                    Pastikan internet lancar & URL API benar.
                </p>
            </div>
        </div>
    );
};