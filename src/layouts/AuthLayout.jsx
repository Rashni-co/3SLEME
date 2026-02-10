import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-army-50 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-army-900">3 SLEME MESS</h1>
                    <p className="text-army-600 mt-2">Mess Management System</p>
                </div>
                <Outlet />
            </div>
        </div>
    );
}
