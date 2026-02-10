import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import { Utensils, Beer, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OfficerDashboard() {
    const { currentUser, userData } = useAuth();
    const [todayMenu, setTodayMenu] = useState(null);
    const [billTotal, setBillTotal] = useState(0);

    useEffect(() => {
        // 1. Get Today's Menu
        const todayStr = new Date().toISOString().split('T')[0];
        const menuRef = doc(db, 'menus', todayStr);
        const unsubMenu = onSnapshot(menuRef, (doc) => {
            setTodayMenu(doc.exists() ? doc.data() : null);
        });

        // 2. Get Bill Summary
        if (currentUser?.uid) {
            // Listen to Messing
            const qTrans = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
            const unsubTrans = onSnapshot(qTrans, (snap) => {
                const total = snap.docs.reduce((sum, d) => sum + (d.data().totalCost || 0), 0);
                updateTotal('messing', total);
            });

            // Listen to Bar
            const qBar = query(collection(db, 'bar_transactions'), where('userId', '==', currentUser.uid));
            const unsubBar = onSnapshot(qBar, (snap) => {
                const total = snap.docs.reduce((sum, d) => sum + (d.data().totalCost || 0), 0);
                updateTotal('bar', total);
            });

            // Listen to Payments
            const qPay = query(collection(db, 'payments'), where('userId', '==', currentUser.uid));
            const unsubPay = onSnapshot(qPay, (snap) => {
                const total = snap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
                updateTotal('payment', total);
            });

            // Helper to aggregate totals
            let totals = { messing: 0, bar: 0, payment: 0 };
            const updateTotal = (type, amount) => {
                totals[type] = amount;
                setBillTotal(totals.messing + totals.bar - totals.payment);
            };

            return () => {
                unsubMenu();
                unsubTrans();
                unsubBar();
                unsubPay();
            };
        }

        return () => {
            unsubMenu();
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-army-900">Welcome, {userData?.rank} {userData?.name}</h1>
                    <p className="text-army-600">3 SLEME Officers' Mess</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-army-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-army-800 to-army-900 text-white border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-army-200 text-sm mb-1">Current Bill</p>
                            <h3 className="text-3xl font-bold">LKR {billTotal.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-white/10 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <Link to="/bill" className="text-xs text-army-300 hover:text-white mt-4 inline-block">View Details &rarr;</Link>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Today's Menu Status</p>
                            <h3 className="text-xl font-bold text-army-900">
                                {todayMenu ? "Updated" : "Not Posted"}
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Utensils size={24} className="text-orange-500" />
                        </div>
                    </div>
                    <Link to="/menu" className="text-xs text-orange-600 hover:text-orange-700 mt-4 inline-block font-medium">View Menu & RSVP &rarr;</Link>
                </Card>
            </div>

            {/* Today's Menu Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="text-army-600" size={20} />
                        <h3 className="text-lg font-bold text-army-900">Today's Menu</h3>
                    </div>

                    {todayMenu ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-army-50 rounded-lg">
                                <span className="text-xs font-bold text-army-500 uppercase tracking-wider">Breakfast</span>
                                <p className="text-army-800 font-medium mt-1">{todayMenu.breakfast || "Standard"}</p>
                            </div>
                            <div className="p-3 bg-army-50 rounded-lg">
                                <span className="text-xs font-bold text-army-500 uppercase tracking-wider">Lunch</span>
                                <p className="text-army-800 font-medium mt-1">{todayMenu.lunch || "Standard"}</p>
                            </div>
                            <div className="p-3 bg-army-50 rounded-lg">
                                <span className="text-xs font-bold text-army-500 uppercase tracking-wider">Dinner</span>
                                <p className="text-army-800 font-medium mt-1">{todayMenu.dinner || "Standard"}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-gray-500">Menu not yet available for today.</p>
                        </div>
                    )}
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-army-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/menu" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-army-500 hover:shadow-md transition-all">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-full mb-2">
                                <Utensils size={24} />
                            </div>
                            <span className="font-medium text-gray-800">Order Meals</span>
                        </Link>
                        <Link to="/bar" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-army-500 hover:shadow-md transition-all">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-2">
                                <Beer size={24} />
                            </div>
                            <span className="font-medium text-gray-800">Bar List</span>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
