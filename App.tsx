import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { User } from './types';
import { DEFAULT_API_URL } from './constants';

const App: React.FC = () => {
    // State management
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('darul_kamal_user');
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch {
                return null;
            }
        }
        return null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('darul_kamal_user');
    });
    
    // API URL State - Initialize from LocalStorage or Default
    const [apiUrl, setApiUrl] = useState<string>(() => {
        const savedUrl = localStorage.getItem('darul_kamal_api_url');
        return savedUrl || DEFAULT_API_URL;
    });

    // Persist API URL changes to LocalStorage
    useEffect(() => {
        if (apiUrl && apiUrl !== DEFAULT_API_URL) {
            localStorage.setItem('darul_kamal_api_url', apiUrl);
        } else if (!apiUrl) {
            localStorage.removeItem('darul_kamal_api_url');
        }
    }, [apiUrl]);

    const handleLoginSuccess = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('darul_kamal_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('darul_kamal_user');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 antialiased selection:bg-emerald-500 selection:text-white">
            {!isAuthenticated ? (
                <LoginScreen 
                    apiUrl={apiUrl} 
                    setApiUrl={setApiUrl} 
                    onLoginSuccess={handleLoginSuccess} 
                />
            ) : (
                <Dashboard 
                    user={user} 
                    onLogout={handleLogout} 
                    apiUrl={apiUrl}
                    setApiUrl={setApiUrl}
                />
            )}
        </div>
    );
};

export default App;