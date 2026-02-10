import React from 'react';

export default function Input({ label, type = 'text', id, value, onChange, placeholder, required = false, className = '' }) {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-army-800 mb-1">
                    {label}
                </label>
            )}
            <input
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-3 py-2 border border-army-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-army-500 focus:border-army-500 bg-white"
            />
        </div>
    );
}
