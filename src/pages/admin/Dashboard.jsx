import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { Users, Utensils, Wine, ClipboardList, Receipt, ArrowRight, UtensilsCrossed, LayoutGrid } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        officers: 0,
        mealsToday: 0,
        barItems: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Officers Count
                const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "officer")));

                // 2. Today's Meals
                const today = new Date().toISOString().split('T')[0];
                const rsvpSnap = await getDocs(query(collection(db, "rsvp"), where("date", "==", today)));
                let mealCount = 0;
                rsvpSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.meals?.breakfast) mealCount++;
                    if (data.meals?.lunch) mealCount++;
                    if (data.meals?.dinner) mealCount++;
                });

                // 3. Bar Items
                const invSnap = await getDocs(collection(db, "inventory"));

                setStats({
                    officers: usersSnap.size,
                    mealsToday: mealCount,
                    barItems: invSnap.size
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const QuickAction = ({ title, desc, icon: Icon, color, path }) => (
        <div
            onClick={() => navigate(path)}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                <Icon className="text-white" size={24} />
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-army-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500">{desc}</p>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-army-600 transition-colors" size={20} />
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-army-900">Admin Overview</h1>
                <p className="text-army-600">Welcome back, Mess Manager.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-army-900 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <Users size={24} className="text-army-100" />
                        </div>
                        <div>
                            <p className="text-blue-300 text-sm">Registered Officers</p>
                            <h2 className="text-blue-600 text-3xl font-bold">{loading ? '-' : stats.officers}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="bg-orange-600 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <UtensilsCrossed size={24} className="text-orange-100" />
                        </div>
                        <div>
                            <p className="text-orange-100 text-sm">Meal Requests (Today)</p>
                            <h2 className="text-3xl font-bold">{loading ? '-' : stats.mealsToday}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="bg-green-600 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <Wine size={24} className="text-green-100" />
                        </div>
                        <div>
                            <p className="text-green-100 text-sm">Bar Inventory Items</p>
                            <h2 className="text-3xl font-bold">{loading ? '-' : stats.barItems}</h2>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Actions */}
            <div>
                <h2 className="text-lg font-bold text-army-900 mb-4 flex items-center gap-2">
                    <LayoutGrid size={20} /> Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <QuickAction
                        title="Daily Ledger"
                        desc="Bulk entry for daily messing"
                        icon={ClipboardList}
                        color="bg-purple-600"
                        path="/admin/ledger"
                    />
                    <QuickAction
                        title="Kitchen Summary"
                        desc="View meal counts & requests"
                        icon={Utensils}
                        color="bg-orange-500"
                        path="/admin/kitchen"
                    />
                    <QuickAction
                        title="Financial Dashboard"
                        desc="Master billing & reports"
                        icon={Receipt}
                        color="bg-blue-600"
                        path="/admin/billing"
                    />
                    <QuickAction
                        title="Update Menu"
                        desc="Set daily meals"
                        icon={UtensilsCrossed}
                        color="bg-army-600"
                        path="/admin/menu"
                    />
                    <QuickAction
                        title="Manage Officers"
                        desc="View officer profiles"
                        icon={Users}
                        color="bg-teal-600"
                        path="/admin/officers"
                    />
                    <QuickAction
                        title="Bar Inventory"
                        desc="Update stock & prices"
                        icon={Wine}
                        color="bg-pink-600"
                        path="/admin/inventory"
                    />
                </div>
            </div>
        </div>
    );
}
