import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { Beer, Wine, Search } from 'lucide-react';

export default function OfficerBar() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'
    const [inventory, setInventory] = useState([]);
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Fetch Inventory
    useEffect(() => {
        const q = query(collection(db, 'inventory'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventory(items);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch My History
    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'bar_transactions'),
            where('userId', '==', currentUser.uid)
            // We can also orderBy date if we had a composite index, 
            // but client-side sort is fine for small lists
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort desc by date
            items.sort((a, b) => new Date(b.date) - new Date(a.date));
            setHistory(items);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const filteredInventory = inventory.filter(item =>
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-army-900">Bar Facilities</h1>

                {/* Search */}
                {activeTab === 'inventory' && (
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-army-500"
                        />
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'inventory'
                            ? 'border-army-600 text-army-800'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Price List
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history'
                            ? 'border-army-600 text-army-800'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Consumption
                </button>
            </div>

            {activeTab === 'inventory' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredInventory.length === 0 ? (
                        <p className="col-span-full text-center py-8 text-gray-500">No items found.</p>
                    ) : (
                        filteredInventory.map(item => (
                            <Card key={item.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20">
                                    <Wine size={64} className="text-army-800" />
                                </div>
                                <h3 className="text-lg font-bold text-army-900 mb-1">{item.brand}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {item.available ? 'In Stock' : 'Out of Stock'}
                                </span>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Full Bottle</span>
                                        <span className="font-semibold text-army-900">LKR {item.priceFull?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Shot (50ml)</span>
                                        <span className="font-semibold text-army-900">LKR {item.priceShot?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-army-50 text-army-700">
                            <tr>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Item</th>
                                <th className="p-4 font-semibold">Quantity</th>
                                <th className="p-4 font-semibold text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.length === 0 ? (
                                <tr><td colSpan="4" className="p-6 text-center text-gray-500">No consumption history found.</td></tr>
                            ) : (
                                history.map(record => (
                                    <React.Fragment key={record.id}>
                                        {record.items.map((item, idx) => (
                                            <tr key={`${record.id}-${idx}`} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-600">{record.date}</td>
                                                <td className="p-4 font-medium text-gray-900">{item.brand}</td>
                                                <td className="p-4 text-gray-600">{item.quantity}</td>
                                                <td className="p-4 text-right font-medium text-army-900">LKR {item.cost?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
