import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, where, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Search, User, ClipboardList, Wine, Plus, X, Receipt, DollarSign, History } from 'lucide-react';

export default function AdminOfficers() {
    const [officers, setOfficers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [inventory, setInventory] = useState([]);

    // Officer Data State
    const [messingHistory, setMessingHistory] = useState([]);
    const [barHistory, setBarHistory] = useState([]);
    const [officerPayments, setOfficerPayments] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Sheet A State (Messing)
    const [messItem, setMessItem] = useState('');
    const [messCost, setMessCost] = useState('');

    // Sheet B State (Bar)
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [barType, setBarType] = useState('shot'); // 'shot' | 'bottle'
    const [barQty, setBarQty] = useState(1);

    // Payment State
    const [paymentAmount, setPaymentAmount] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOfficers();
        fetchInventory();
    }, []);

    useEffect(() => {
        if (!selectedOfficer) {
            setMessingHistory([]);
            setBarHistory([]);
            setOfficerPayments([]);
            return;
        }

        setLoadingData(true);

        const qTrans = query(collection(db, 'transactions'), where('userId', '==', selectedOfficer.id));
        const qBar = query(collection(db, 'bar_transactions'), where('userId', '==', selectedOfficer.id));
        const qPay = query(collection(db, 'payments'), where('userId', '==', selectedOfficer.id));

        const unsubscribeTrans = onSnapshot(qTrans, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Messing' }));
            transData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setMessingHistory(transData);
            setLoadingData(false);
        });

        const unsubscribeBar = onSnapshot(qBar, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Bar' }));
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setBarHistory(data);
        });

        const unsubscribePay = onSnapshot(qPay, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setOfficerPayments(data);
        });

        // Wait, I can't just change state structure easily without changing render code.
        // Let's do this: 
        // 1. Create separate states: messingData, barData.
        // 2. Combine them in a `useEffect` or useMemo to form `officerHistory`.

        // Let's implement the separate states approach properly in the full file replacement or just this block?
        // This is `replace_file_content`. I must be careful.

        // Actually, the current `officerHistory` is used in render with filters: `.filter(h => h.category === 'Messing')`
        // So keeping them separate is actually BETTER for the new split view!
        // But I need to change the state definitions first. 
    }, [selectedOfficer]);

    const fetchOfficers = async () => {
        const q = query(collection(db, "users"), where("role", "==", "officer"));
        const snapshot = await getDocs(q);
        const officerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        officerList.sort((a, b) => a.officerNo.localeCompare(b.officerNo));
        setOfficers(officerList);
    };

    const fetchInventory = async () => {
        const q = query(collection(db, "inventory"), where("available", "==", true));
        const snapshot = await getDocs(q);
        setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const getFilteredOfficers = () => {
        return officers.filter(o =>
            o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.officerNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const calculateTotals = () => {
        const totalDebit = messingHistory.reduce((sum, item) => sum + (item.totalCost || 0), 0) +
            barHistory.reduce((sum, item) => sum + (item.totalCost || 0), 0);
        const totalCredit = officerPayments.reduce((sum, item) => sum + (item.amount || 0), 0);
        return { totalDebit, totalCredit, outstanding: totalDebit - totalCredit };
    };

    const handleAddMessing = async (e) => {
        e.preventDefault();
        if (!messItem || !messCost) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'transactions'), {
                userId: selectedOfficer.id,
                date: new Date().toISOString(),
                type: 'messing',
                items: [{ name: messItem, cost: parseFloat(messCost) }], // Array structure for flexibility
                totalCost: parseFloat(messCost),
                timestamp: serverTimestamp()
            });
            setMessItem('');
            setMessCost('');
            // fetchOfficerData(selectedOfficer.id); // Auto-updated via listener
            alert('Messing entry added!');
        } catch (err) {
            console.error(err);
            alert('Failed to add entry.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBar = async (e) => {
        e.preventDefault();
        if (!selectedBrandId) return;
        setLoading(true);
        try {
            const brandItem = inventory.find(i => i.id === selectedBrandId);
            const costPerUnit = barType === 'bottle' ? brandItem.priceFull : brandItem.priceShot;
            const total = costPerUnit * parseInt(barQty);

            await addDoc(collection(db, 'bar_transactions'), {
                userId: selectedOfficer.id,
                date: new Date().toISOString(),
                type: 'bar',
                items: [{
                    brand: brandItem.brand,
                    type: barType,
                    quantity: parseInt(barQty),
                    cost: total
                }],
                totalCost: total,
                timestamp: serverTimestamp()
            });

            setSelectedBrandId('');
            setBarQty(1);
            // fetchOfficerData(selectedOfficer.id); // Auto-updated via listener
            alert('Bar entry added!');
        } catch (err) {
            console.error(err);
            alert('Failed to add entry.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount) return;
        if (!confirm(`Confirm payment of LKR ${paymentAmount} for ${selectedOfficer.name}?`)) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'payments'), {
                userId: selectedOfficer.id,
                amount: parseFloat(paymentAmount),
                date: new Date().toISOString().split('T')[0],
                timestamp: serverTimestamp()
            });
            setPaymentAmount('');
            // fetchOfficerData(selectedOfficer.id); // Auto-updated via listener
            alert('Payment recorded successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to record payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto flex gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Officer List */}
            <div className="w-1/4 flex flex-col">
                <div className="mb-4">
                    <Input
                        placeholder="Search Officers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-0"
                    />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-army-200 flex-1 overflow-y-auto">
                    {getFilteredOfficers().map(officer => (
                        <div
                            key={officer.id}
                            onClick={() => setSelectedOfficer(officer)}
                            className={`p-3 border-b border-army-100 cursor-pointer hover:bg-army-50 transition-colors ${selectedOfficer?.id === officer.id ? 'bg-army-100' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-army-200 flex items-center justify-center text-army-700 font-bold text-sm">
                                    {officer.rank.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-army-900 text-sm">{officer.rank} {officer.name}</h3>
                                    <p className="text-xs text-army-500">{officer.officerNo}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Ledger / Details */}
            <div className="w-3/4 flex flex-col h-full overflow-hidden">
                {selectedOfficer ? (
                    <div className="flex flex-col h-full gap-4">
                        {/* 1. Header & Summary */}
                        <div className="flex gap-4">
                            <Card className="flex-1 bg-army-900 text-white p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold">{selectedOfficer.rank} {selectedOfficer.name}</h2>
                                        <p className="text-army-400 text-sm">{selectedOfficer.officerNo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-army-400 text-xs">Total Outstanding</p>
                                        <h3 className={`text-2xl font-bold ${calculateTotals().outstanding > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                                            LKR {calculateTotals().outstanding.toFixed(2)}
                                        </h3>
                                    </div>
                                </div>
                            </Card>

                            {/* Payment Form */}
                            <Card className="w-1/3 p-4 bg-green-50 border-green-200">
                                <h3 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2">
                                    <DollarSign size={16} /> Record Payment
                                </h3>
                                <form onSubmit={handlePayment} className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        className="flex-1 p-2 border rounded text-sm"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                    <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700" disabled={loading}>Pay</Button>
                                </form>
                            </Card>
                        </div>

                        {/* 2. Main Content Area - Split Columns */}
                        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">

                            {/* Sheet A: Messing Section */}
                            <div className="flex flex-col gap-4 overflow-hidden">
                                <Card className="p-4 bg-orange-50 border-orange-100">
                                    <h3 className="font-bold text-orange-800 text-sm mb-3 flex items-center gap-2">
                                        <ClipboardList size={16} /> Sheet A: Messing Entry
                                    </h3>
                                    <form onSubmit={handleAddMessing} className="space-y-3">
                                        <Input
                                            label="Description"
                                            placeholder="Tea, Guest Meal..."
                                            value={messItem}
                                            onChange={(e) => setMessItem(e.target.value)}
                                            className="bg-white"
                                        />
                                        <Input
                                            label="Cost (LKR)"
                                            type="number"
                                            placeholder="0.00"
                                            value={messCost}
                                            onChange={(e) => setMessCost(e.target.value)}
                                            className="bg-white"
                                        />
                                        <Button type="submit" variant="secondary" size="sm" disabled={loading} className="w-full bg-orange-600 text-white hover:bg-orange-700 border-none">
                                            Add to Messing Sheet
                                        </Button>
                                    </form>
                                </Card>

                                <Card className="flex-1 p-0 flex flex-col overflow-hidden border border-orange-200 shadow-sm">
                                    <div className="p-2 bg-orange-100 border-b border-orange-200">
                                        <h3 className="font-bold text-orange-900 text-xs">Messing Log</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-orange-50 text-orange-900 sticky top-0">
                                                <tr>
                                                    <th className="p-2 font-semibold">Date</th>
                                                    <th className="p-2 font-semibold">Item</th>
                                                    <th className="p-2 font-semibold text-right">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-orange-100">
                                                {messingHistory.map((h, i) => (
                                                    <tr key={i} className="hover:bg-orange-50">
                                                        <td className="p-2 text-gray-500 whitespace-nowrap">{h.date.split('T')[0]}</td>
                                                        <td className="p-2 font-medium text-gray-900">
                                                            {h.items?.[0]?.name}
                                                            {/* Show consolidated items if bulk entry */}
                                                            {h.items && h.items.length > 1 && (
                                                                <span className="text-[10px] text-gray-500 block">
                                                                    ({h.items.length} items)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-2 text-right font-medium text-orange-900">
                                                            {h.totalCost.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Sheet B: Bar Section */}
                            <div className="flex flex-col gap-4 overflow-hidden">
                                <Card className="p-4 bg-purple-50 border-purple-100">
                                    <h3 className="font-bold text-purple-800 text-sm mb-3 flex items-center gap-2">
                                        <Wine size={16} /> Sheet B: Bar Entry
                                    </h3>
                                    <form onSubmit={handleAddBar} className="space-y-3">
                                        <select
                                            value={selectedBrandId}
                                            onChange={(e) => setSelectedBrandId(e.target.value)}
                                            className="w-full p-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Select Brand</option>
                                            {inventory.map(item => (
                                                <option key={item.id} value={item.id}>{item.brand}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <select
                                                value={barType}
                                                onChange={(e) => setBarType(e.target.value)}
                                                className="w-full p-2 border rounded text-sm bg-white"
                                            >
                                                <option value="shot">Shot</option>
                                                <option value="bottle">Bottle</option>
                                            </select>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-16 p-2 border rounded text-sm text-center bg-white"
                                                value={barQty}
                                                onChange={(e) => setBarQty(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" variant="secondary" size="sm" disabled={loading} className="w-full bg-purple-600 text-white hover:bg-purple-700 border-none">
                                            Add to Bar Sheet
                                        </Button>
                                    </form>
                                </Card>

                                <Card className="flex-1 p-0 flex flex-col overflow-hidden border border-purple-200 shadow-sm">
                                    <div className="p-2 bg-purple-100 border-b border-purple-200">
                                        <h3 className="font-bold text-purple-900 text-xs">Bar Log</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-purple-50 text-purple-900 sticky top-0">
                                                <tr>
                                                    <th className="p-2 font-semibold">Date</th>
                                                    <th className="p-2 font-semibold">Item</th>
                                                    <th className="p-2 font-semibold text-right">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-purple-100">
                                                {barHistory.map((h, i) => (
                                                    <tr key={i} className="hover:bg-purple-50">
                                                        <td className="p-2 text-gray-500 whitespace-nowrap">{h.date.split('T')[0]}</td>
                                                        <td className="p-2 font-medium text-gray-900">
                                                            {h.items?.[0]?.brand}
                                                            <span className="text-[10px] text-gray-500 block">
                                                                {h.items?.[0]?.type} x{h.items?.[0]?.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-right font-medium text-purple-900">
                                                            {h.totalCost.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <User size={48} className="mb-4 opacity-50" />
                        <p>Select an officer to view ledger and add entries.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
