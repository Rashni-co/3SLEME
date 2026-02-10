import React from 'react';

export default function Button({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-army-600 text-white hover:bg-army-700 focus:ring-army-500",
        secondary: "bg-white text-army-700 border border-army-300 hover:bg-army-50 focus:ring-army-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        ghost: "text-army-600 hover:bg-army-100 focus:ring-army-500"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
