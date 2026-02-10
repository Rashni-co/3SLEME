import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Calendar, Filter, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function OfficerHistory() {
    const { currentUser } = useAuth();
    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = today.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Fetch Messing Transactions
            const transQuery = query(
                collection(db, 'transactions'),
                where('userId', '==', currentUser.uid)
            );

            const barQuery = query(
                collection(db, 'bar_transactions'),
                where('userId', '==', currentUser.uid)
            );

            const [transSnap, barSnap] = await Promise.all([
                getDocs(transQuery),
                getDocs(barQuery)
            ]);

            const messItems = transSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                category: 'Messing'
            }));

            const barItems = barSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                category: 'Bar'
            }));

            // Merge and Filter by Date Range client-side
            const allItems = [...messItems, ...barItems].filter(item =>
                item.date >= startDate && item.date <= endDate
            );

            // Sort by date desc
            allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(allItems);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []); // Run once on mount, then user uses button

    const totalAmount = transactions.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    const downloadCSV = () => {
        if (transactions.length === 0) return;

        const headers = ["Date", "Description", "Category", "Cost"];
        const rows = transactions.map(t => {
            const description = t.items?.map(i => {
                return `${i.name || i.brand}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`;
            }).join('; ');
            return [
                t.date,
                `"${description}"`, // Quote description to handle commas
                t.category,
                t.totalCost.toFixed(2)
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `history_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        if (transactions.length === 0) return;

        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("3 SLEME Officers' Mess - Purchase History", 14, 22);

        // Meta Info
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Officer: ${currentUser.displayName || currentUser.email}`, 14, 32);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 38);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 44);

        // Table
        const tableColumn = ["Date", "Description", "Category", "Cost (LKR)"];
        const tableRows = transactions.map(t => {
            const description = t.items?.map(i => {
                return `${i.name || i.brand}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`;
            }).join(', ');
            return [t.date, description, t.category, t.totalCost.toFixed(2)];
        });

        doc.autoTable({
            startY: 50,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [74, 98, 77] }, // Army green-ish
            foot: [['', '', 'Total', totalAmount.toFixed(2)]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        doc.save(`history_${startDate}_to_${endDate}.pdf`);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-army-900">Purchase History</h1>
                    <p className="text-army-600">View your consumption log.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 ml-1">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-sm p-1 border rounded"
                            />
                        </div>
                        <span className="text-gray-400 mt-4">-</span>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 ml-1">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-sm p-1 border rounded"
                            />
                        </div>
                    </div>
                    <Button onClick={fetchHistory} size="sm" className="h-[34px] mt-4 sm:mt-0">
                        <Filter size={16} className="mr-1" /> Filter
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-0 overflow-hidden min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-army-50 text-army-700 sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading records...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No records found for this period.</td></tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{t.date}</td>
                                        <td className="p-4 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                {t.items?.map((i, idx) => (
                                                    <span key={idx}>
                                                        {i.name || i.brand}
                                                        {i.quantity > 1 ? ` (x${i.quantity})` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${t.category === 'Bar' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-army-800">
                                            {t.totalCost?.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-army-900 text-white border-none">
                        <p className="text-army-300 text-sm mb-1">Total (Selected Period)</p>
                        <h2 className="text-3xl text-blue-400 font-bold">LKR {totalAmount.toFixed(2)}</h2>
                        <p className="text-xs text-army-400 mt-2">
                            {transactions.length} transactions found
                        </p>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-army-900 mb-2">Export Data</h3>
                        <p className="text-sm text-gray-600 mb-4">Download this report for your records.</p>
                        <div className="flex flex-col gap-2">
                            <Button onClick={downloadCSV} variant="secondary" className="w-full flex items-center justify-center gap-2" disabled={transactions.length === 0}>
                                <Download size={18} /> Download CSV
                            </Button>
                            <Button onClick={downloadPDF} variant="primary" className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white" disabled={transactions.length === 0}>
                                <Download size={18} /> Download PDF
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
