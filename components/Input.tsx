import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, fullWidth = true, className = '', ...props }) => {
    return (
        <div className={fullWidth ? 'w-full' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                className={`w-full border border-gray-300 p-3 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 ${className}`}
                {...props}
            />
        </div>
    );
};