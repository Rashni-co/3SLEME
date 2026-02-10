import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import {
    Menu,
    LayoutDashboard,
    UtensilsCrossed,
    Receipt,
    Wine,
    LogOut,
    X,
    Users,
    ClipboardList,
    MessageSquare
} from 'lucide-react';

export default function DashboardLayout({ role }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { userData } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const officerLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/messages', label: 'Messages', icon: MessageSquare },
        { path: '/menu', label: 'Menu & RSVP', icon: UtensilsCrossed },
        { path: '/bill', label: 'My Bill', icon: Receipt },
        { path: '/history', label: 'History', icon: ClipboardList },
        { path: '/bar', label: 'Bar Facilities', icon: Wine },
    ];

    const adminLinks = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
        { path: '/admin/menu', label: 'Menu Management', icon: UtensilsCrossed },
        { path: '/admin/kitchen', label: 'Kitchen Summary', icon: UtensilsCrossed },
        { path: '/admin/ledger', label: 'Daily Ledger', icon: ClipboardList },
        { path: '/admin/billing', label: 'Master Billing', icon: Receipt },
        { path: '/admin/officers', label: 'Officers', icon: Users },
        { path: '/admin/inventory', label: 'Inventory', icon: Wine },
    ];

    const links = role === 'admin' ? adminLinks : officerLinks;

    return (
        <div className="min-h-screen bg-army-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-army-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-army-800 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">3 SLEME</h2>
                            <p className="text-xs text-army-300">Mess Management</p>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden p-1 hover:bg-army-800 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 border-b border-army-800">
                        <p className="text-sm font-medium truncate">{userData?.name || 'User'}</p>
                        <p className="text-xs text-army-400 capitalize">{role}</p>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {links.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                                        ? 'bg-army-700 text-white'
                                        : 'text-army-300 hover:bg-army-800 hover:text-white'}
                `}
                            >
                                <link.icon size={20} />
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-army-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-army-800 hover:text-red-300 transition-colors"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                <header className="bg-white border-b border-army-200 p-4 lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-army-700 hover:bg-army-50 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
