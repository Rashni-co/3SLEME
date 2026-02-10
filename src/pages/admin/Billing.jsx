import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Download, RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminBilling() {
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'totalOutstanding', direction: 'desc' });
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all users
            const usersSnap = await getDocs(query(collection(db, 'users')));
            const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.role === 'officer');

            // 2. Fetch all financial records (This is query heavy, in prod use Cloud Functions aggregation)
            const [transSnap, barSnap, paySnap] = await Promise.all([
                getDocs(collection(db, 'transactions')),
                getDocs(collection(db, 'bar_transactions')),
                getDocs(collection(db, 'payments'))
            ]);

            // 3. Aggregate data
            const officerData = users.map(user => {
                const userTrans = transSnap.docs.filter(d => d.data().userId === user.id);
                const userBar = barSnap.docs.filter(d => d.data().userId === user.id);
                const userPay = paySnap.docs.filter(d => d.data().userId === user.id);

                const messBill = userTrans.reduce((sum, d) => sum + (d.data().totalCost || 0), 0);
                const barBill = userBar.reduce((sum, d) => sum + (d.data().totalCost || 0), 0);
                const paid = userPay.reduce((sum, d) => sum + (d.data().amount || 0), 0);

                return {
                    id: user.id,
                    officerNo: user.officerNo || '',
                    rank: user.rank || '',
                    name: user.name || 'Unknown',
                    messBill,
                    barBill,
                    paid,
                    totalOutstanding: (messBill + barBill) - paid
                };
            });

            setOfficers(officerData);

        } catch (error) {
            console.error("Error fetching billing data:", error);
            alert("Failed to load financial data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedOfficers = [...officers].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Filtering
    const filteredOfficers = sortedOfficers.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.officerNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstandingAll = officers.reduce((sum, o) => sum + o.totalOutstanding, 0);

    const downloadCSV = () => {
        const headers = ["Officer No", "Rank", "Name", "Mess Bill", "Bar Bill", "Paid", "Outstanding"];
        const rows = filteredOfficers.map(o => [
            o.officerNo,
            o.rank,
            o.name,
            o.messBill.toFixed(2),
            o.barBill.toFixed(2),
            o.paid.toFixed(2),
            o.totalOutstanding.toFixed(2)
        ]);

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\n";
        rows.forEach(r => csvContent += r.join(",") + "\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `mess_billing_summary_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-army-900">Financial Overview</h1>
                    <p className="text-army-600">Master billing dashboard for the Mess.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search officer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-army-500 w-64"
                        />
                    </div>
                    <Button onClick={fetchData} variant="secondary" className="p-2">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </Button>
                    <Button onClick={downloadCSV} className="flex items-center gap-2">
                        <Download size={18} /> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-army-900 text-white md:col-span-3 lg:col-span-1">
                    <h3 className="text-army-200 text-sm">Total Outstanding (All Officers)</h3>
                    <div className="text-2xl text-blue-400 font-bold mt-2">LKR {totalOutstandingAll.toFixed(2)}</div>
                    <p className="text-xs text-army-400 mt-2">Sum of all individual debts.</p>
                </Card>

                <div className="md:col-span-3 lg:col-span-2">
                    <Card className="p-0 overflow-hidden shadow-lg border border-army-200">
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-army-100 text-army-800 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-semibold cursor-pointer hover:bg-army-200" onClick={() => handleSort('officerNo')}>
                                            <div className="flex items-center gap-1">Off No <ArrowUpDown size={14} /></div>
                                        </th>
                                        <th className="p-4 font-semibold cursor-pointer hover:bg-army-200" onClick={() => handleSort('rank')}>
                                            <div className="flex items-center gap-1">Rank <ArrowUpDown size={14} /></div>
                                        </th>
                                        <th className="p-4 font-semibold cursor-pointer hover:bg-army-200" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">Name <ArrowUpDown size={14} /></div>
                                        </th>
                                        <th className="p-4 font-semibold text-right cursor-pointer hover:bg-army-200" onClick={() => handleSort('messBill')}>
                                            <div className="flex items-center justify-end gap-1">Mess Bill <ArrowUpDown size={14} /></div>
                                        </th>
                                        <th className="p-4 font-semibold text-right cursor-pointer hover:bg-army-200" onClick={() => handleSort('barBill')}>
                                            <div className="flex items-center justify-end gap-1">Bar Bill <ArrowUpDown size={14} /></div>
                                        </th>
                                        <th className="p-4 font-semibold text-right cursor-pointer hover:bg-army-200" onClick={() => handleSort('paid')}>
                                            <div className="flex items-center justify-end gap-1">Paid <ArrowUpDown size={14} /></div>
                                        </th>
                                        <th className="p-4 font-semibold text-right cursor-pointer hover:bg-army-200 bg-army-200" onClick={() => handleSort('totalOutstanding')}>
                                            <div className="flex items-center justify-end gap-1">Outstanding <ArrowUpDown size={14} /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {loading ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">Calculating financial data...</td></tr>
                                    ) : filteredOfficers.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">No records found.</td></tr>
                                    ) : (
                                        filteredOfficers.map(officer => (
                                            <tr key={officer.id} className="hover:bg-orange-50 transition-colors">
                                                <td className="p-4 text-gray-500">{officer.officerNo}</td>
                                                <td className="p-4 text-gray-900 font-medium">{officer.rank}</td>
                                                <td className="p-4 text-army-900 font-bold hover:underline cursor-pointer" onClick={() => navigate('/admin/officers')}>
                                                    {officer.name}
                                                </td>
                                                <td className="p-4 text-right text-gray-600">{officer.messBill.toFixed(2)}</td>
                                                <td className="p-4 text-right text-gray-600">{officer.barBill.toFixed(2)}</td>
                                                <td className="p-4 text-right text-green-600 font-medium">-{officer.paid.toFixed(2)}</td>
                                                <td className={`p-4 text-right font-bold border-l border-gray-100 ${officer.totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {officer.totalOutstanding.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
