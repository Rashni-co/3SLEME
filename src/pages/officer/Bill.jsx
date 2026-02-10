import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { Receipt, DollarSign, Calendar } from 'lucide-react';

export default function OfficerBill() {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Listen to Messing Transactions
        const qTransactions = query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid)
        );

        // Listen to Bar Transactions
        const qBar = query(
            collection(db, 'bar_transactions'),
            where('userId', '==', currentUser.uid)
        );

        // Listen to Payments
        const qPayments = query(
            collection(db, 'payments'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribeTrans = onSnapshot(qTransactions, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Messing' }));
            // Normally we'd merge streams, but for simplicity let's just do one for now or merge manually
            // We'll update state in a combined way if we want single list, or separate.
            // Let's keep it simple: Messing List

            updateAllData(transData, null, null);
        });

        const unsubscribeBar = onSnapshot(qBar, (snapshot) => {
            const barData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'Bar' }));
            updateAllData(null, barData, null);
        });

        const unsubscribePay = onSnapshot(qPayments, (snapshot) => {
            const payData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'payment' }));
            updateAllData(null, null, payData);
        });

        let currentTrans = [];
        let currentBar = [];
        let currentPay = [];

        const updateAllData = (t, b, p) => {
            if (t) currentTrans = t;
            if (b) currentBar = b;
            if (p) currentPay = p;

            const all = [...currentTrans, ...currentBar].sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(all);
            setPayments(currentPay);
            setLoading(false);
        };

        return () => {
            unsubscribeTrans();
            unsubscribeBar();
            unsubscribePay();
        };
    }, [currentUser]);

    const calculateTotal = () => {
        const totalDebit = transactions.reduce((sum, item) => sum + (item.totalCost || 0), 0);
        const totalCredit = payments.reduce((sum, item) => sum + (item.amount || 0), 0);
        return totalDebit - totalCredit;
    };

    const currentMonthBill = () => {
        const now = new Date();
        const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM

        const monthDebit = transactions
            .filter(t => t.date.startsWith(currentMonthPrefix))
            .reduce((sum, t) => sum + (t.totalCost || 0), 0);

        return monthDebit; // Payments usually deduct from total outstanding, not just month
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-army-900">Billing & History</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-army-900 text-white border-none">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-full">
                            <DollarSign size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-army-200 text-sm">Total Outstanding</p>
                            <h2 className="text-3xl text-blue-400 font-bold">LKR {calculateTotal().toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between text-sm text-army-300">
                            <span>This Month's Consumption</span>
                            <span className="text-white font-medium">LKR {currentMonthBill().toFixed(2)}</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="font-semibold text-army-900 mb-4">Payment History</h3>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                        {payments.length === 0 ? (
                            <p className="text-sm text-gray-500">No payments recorded.</p>
                        ) : (
                            payments.map(pay => (
                                <div key={pay.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-600">{pay.date}</span>
                                    <span className="font-medium text-green-600">- LKR {pay.amount.toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <h2 className="text-xl font-bold text-army-900 mt-8">Recent Transactions</h2>
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-army-50 text-army-700">
                            <tr>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-gray-500">No transactions found.</td></tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-600">{t.date}</td>
                                        <td className="p-4 font-medium text-gray-900">
                                            {t.items?.map(i => i.name || i.brand).join(', ')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${t.category === 'Bar' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-medium text-army-900">
                                            LKR {t.totalCost.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
