import React, { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Calendar, SaveAll, Loader2, CheckSquare, Square, Filter } from 'lucide-react';

export default function DailyLedger() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Batch Configuration
    const [batchType, setBatchType] = useState('Tea'); // Default
    const [batchDesc, setBatchDesc] = useState('');
    const [batchPrice, setBatchPrice] = useState('');

    // Row State: { [userId]: { selected: boolean, cost: number, desc: string } }
    const [rows, setRows] = useState({});

    useEffect(() => {
        fetchOfficers();
    }, []);

    const fetchOfficers = async () => {
        try {
            const q = query(collection(db, "users"), where("role", "==", "officer"));
            const snapshot = await getDocs(q);
            const officerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            officerList.sort((a, b) => a.officerNo.localeCompare(b.officerNo));
            setOfficers(officerList);

            // Initialize rows
            const initialRows = {};
            officerList.forEach(off => {
                initialRows[off.id] = { selected: false, cost: '', desc: '' };
            });
            setRows(initialRows);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching officers:", error);
            setLoading(false);
        }
    };

    // Handle Global Batch Settings Change
    useEffect(() => {
        // When batch price/desc changes, update UNLESS user has manually edited a row?
        // For simplicity in this "Excel-style" request:
        // Let's rely on the user manually setting the global defaults, 
        // but we won't overwrite existing row edits automatically to avoid data loss,
        // OR we provide a "Apply to All" button.
    }, [batchType, batchDesc, batchPrice]);

    const applyDefaultsToSelected = () => {
        setRows(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (next[key].selected) {
                    next[key].cost = batchPrice;
                    next[key].desc = batchDesc;
                }
            });
            return next;
        });
    };

    const toggleSelect = (id) => {
        setRows(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                selected: !prev[id].selected,
                // Auto-fill cost/desc if selecting and empty
                cost: !prev[id].selected && !prev[id].cost ? batchPrice : prev[id].cost,
                desc: !prev[id].selected && !prev[id].desc ? batchDesc : prev[id].desc
            }
        }));
    };

    const updateRow = (id, field, value) => {
        setRows(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value, selected: true } // Auto select on edit
        }));
    };

    const handleSelectAll = () => {
        const allSelected = officers.every(o => rows[o.id]?.selected);
        setRows(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                next[key].selected = !allSelected;
                if (!allSelected) {
                    // If collecting, apply defaults
                    if (!next[key].cost) next[key].cost = batchPrice;
                    if (!next[key].desc) next[key].desc = batchDesc;
                }
            });
            return next;
        });
    };

    const handleSaveAll = async () => {
        // Filter selected rows
        const selectedIds = Object.keys(rows).filter(id => rows[id].selected);

        if (selectedIds.length === 0) {
            alert("Please select at least one officer.");
            return;
        }

        setSaving(true);
        const batch = writeBatch(db);
        let count = 0;

        try {
            for (const id of selectedIds) {
                const row = rows[id];
                const cost = parseFloat(row.cost);

                if (cost > 0) {
                    const docRef = doc(collection(db, 'transactions'));

                    // Construct Item Name
                    let itemName = batchType;
                    if (batchType === 'Other' || batchType === 'Special') {
                        itemName = row.desc || batchDesc || 'Special Item';
                    } else if (row.desc) {
                        itemName = `${batchType} - ${row.desc}`;
                    }

                    const items = [{ name: itemName, cost: cost }];

                    batch.set(docRef, {
                        userId: id,
                        date: selectedDate,
                        type: 'messing',
                        items: items,
                        totalCost: cost,
                        timestamp: serverTimestamp(),
                        isBulkEntry: true
                    });
                    count++;
                }
            }

            if (count > 0) {
                await batch.commit();
                alert(`Successfully saved ${count} transactions.`);
                // Reset
                const nextRows = { ...rows };
                selectedIds.forEach(id => {
                    nextRows[id] = { selected: false, cost: '', desc: '' };
                });
                setRows(nextRows);
            } else {
                alert("Selected entries have 0 cost. Nothing saved.");
            }
        } catch (error) {
            console.error("Error batch saving:", error);
            alert("Failed to save ledger.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading officers...</div>;

    return (
        <div className="max-w-[95%] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-army-900">Daily Ledger</h1>
                    <p className="text-army-600">Bulk Transaction Entry</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-army-100">
                    {/* Date Picker */}
                    <div className="flex items-center gap-2">
                        <Calendar className="text-army-600" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-1 border border-army-300 rounded focus:outline-none focus:ring-2 focus:ring-army-500"
                        />
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <Card className="bg-army-50 border-army-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-army-700 mb-1">Item Type</label>
                        <select
                            value={batchType}
                            onChange={(e) => setBatchType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-army-500"
                        >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Tea">Tea</option>
                            <option value="Other">Other / Special</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-army-700 mb-1">
                            {batchType === 'Other' ? 'Description (Required)' : 'Description (Optional)'}
                        </label>
                        <input
                            type="text"
                            placeholder={batchType === 'Other' ? "e.g. Special Fried Rice" : "e.g. Extra Chicken"}
                            value={batchDesc}
                            onChange={(e) => setBatchDesc(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-army-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-army-700 mb-1">Default Price (LKR)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={batchPrice}
                            onChange={(e) => setBatchPrice(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-army-500 font-bold text-right"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-center border-t border-army-200 pt-3">
                    <p className="text-xs text-army-600 italic">
                        * Select officers below. Prices will auto-fill with the Default Price.
                    </p>
                    <Button onClick={handleSaveAll} disabled={saving} className="flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <SaveAll size={20} />}
                        Save Selected Rows
                    </Button>
                </div>
            </Card>

            {/* Grid */}
            <Card className="overflow-hidden p-0 border border-army-200 shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-army-800 text-white sticky top-0 z-10">
                            <tr>
                                <th className="p-3 w-12 text-center cursor-pointer hover:bg-army-700" onClick={handleSelectAll}>
                                    <CheckSquare size={18} className="mx-auto" />
                                </th>
                                <th className="p-3 font-semibold min-w-[200px]">Officer</th>
                                <th className="p-3 font-semibold w-32 text-right">Price (LKR)</th>
                                <th className="p-3 font-semibold w-64">Specific Note (Optional)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {officers.map(officer => {
                                const row = rows[officer.id] || { selected: false, cost: '', desc: '' };
                                return (
                                    <tr key={officer.id} className={`transition-colors ${row.selected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                                        <td className="p-3 text-center cursor-pointer" onClick={() => toggleSelect(officer.id)}>
                                            {row.selected ?
                                                <CheckSquare size={20} className="mx-auto text-army-600" /> :
                                                <Square size={20} className="mx-auto text-gray-300" />
                                            }
                                        </td>
                                        <td className="p-3 cursor-pointer" onClick={() => toggleSelect(officer.id)}>
                                            <div className="font-bold text-army-900">{officer.rank} {officer.name}</div>
                                            <div className="text-xs text-gray-500">{officer.officerNo}</div>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className={`w-full p-2 border rounded text-right font-medium focus:ring-2 focus:ring-army-500 ${row.selected && !row.cost ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                value={row.cost}
                                                onChange={(e) => updateRow(officer.id, 'cost', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder={batchDesc || "Add note..."}
                                                className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-army-500"
                                                value={row.desc}
                                                onChange={(e) => updateRow(officer.id, 'desc', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
