import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'secondary';
    isLoading?: boolean;
    icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    isLoading = false, 
    icon,
    className = '',
    disabled,
    ...props 
}) => {
    const baseStyles = "font-bold py-3 rounded-lg transition shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
        danger: "bg-red-100 text-red-600 hover:bg-red-200",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300"
    };

    return (
        <button 
            className={`${baseStyles} ${variants[variant]} ${className}`} 
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Memuat...</span>
                </>
            ) : (
                <>
                    {children}
                    {icon && <i className={icon}></i>}
                </>
            )}
        </button>
    );
};