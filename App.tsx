import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { User } from './types';
import { DEFAULT_API_URL } from './constants';

const App: React.FC = () => {
    // State management
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // API URL State - Initialize from LocalStorage or Default
    const [apiUrl, setApiUrl] = useState<string>(() => {
        const savedUrl = localStorage.getItem('darul_kamal_api_url');
        return savedUrl || DEFAULT_API_URL;
    });

    // Persist API URL changes to LocalStorage
    useEffect(() => {
        if (apiUrl && apiUrl !== DEFAULT_API_URL) {
            localStorage.setItem('darul_kamal_api_url', apiUrl);
        }
    }, [apiUrl]);

    const handleLoginSuccess = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setUser(null);
        setIsAuthenticated(false);
        // Optional: clear persisted user session if you implement session persistence
    };

    return (
        <>
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
                />
            )}
        </>
    );
};

export default App;