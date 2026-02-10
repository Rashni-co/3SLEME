import React from 'react';

export default function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl shadow-md border border-army-100 p-6 ${className}`}>
            {children}
        </div>
    );
}
