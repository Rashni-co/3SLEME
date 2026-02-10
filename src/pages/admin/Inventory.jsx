import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export default function AdminInventory() {
    const [items, setItems] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        priceFull: '',
        priceShot: '',
        available: true
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'inventory'), orderBy('brand'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, 'inventory', editingId), {
                    brand: formData.brand,
                    priceFull: parseFloat(formData.priceFull),
                    priceShot: parseFloat(formData.priceShot),
                    available: formData.available
                });
                setEditingId(null);
            } else {
                await addDoc(collection(db, 'inventory'), {
                    brand: formData.brand,
                    priceFull: parseFloat(formData.priceFull),
                    priceShot: parseFloat(formData.priceShot),
                    available: formData.available
                });
            }
            setFormData({ brand: '', priceFull: '', priceShot: '', available: true });
            setIsAdding(false);
        } catch (error) {
            console.error("Error saving inventory:", error);
        }
    };

    const startEdit = (item) => {
        setFormData({
            brand: item.brand,
            priceFull: item.priceFull,
            priceShot: item.priceShot,
            available: item.available
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await deleteDoc(doc(db, 'inventory', id));
        }
    };

    const toggleAvailability = async (item) => {
        await updateDoc(doc(db, 'inventory', item.id), {
            available: !item.available
        });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-army-900">Bar Inventory</h1>
                <Button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ brand: '', priceFull: '', priceShot: '', available: true }); }}>
                    <Plus size={20} className="mr-2" /> Add Item
                </Button>
            </div>

            {isAdding && (
                <Card className="mb-8 border-l-4 border-l-army-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <Input label="Brand Name" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} required />
                        </div>
                        <div>
                            <Input label="Price (Full Bottle)" type="number" value={formData.priceFull} onChange={e => setFormData({ ...formData, priceFull: e.target.value })} required />
                        </div>
                        <div>
                            <Input label="Price (50ml Shot)" type="number" value={formData.priceShot} onChange={e => setFormData({ ...formData, priceShot: e.target.value })} required />
                        </div>
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.available}
                                    onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                    className="w-4 h-4 text-army-600 rounded focus:ring-army-500"
                                />
                                <span className="text-sm font-medium text-army-800">In Stock</span>
                            </label>
                        </div>
                        <div className="md:col-span-4 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit">{editingId ? 'Update Item' : 'Save Item'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card className="overflow-hidden p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-army-50 text-army-700">
                        <tr>
                            <th className="p-4 font-semibold">Brand</th>
                            <th className="p-4 font-semibold text-right">Price (Bottle)</th>
                            <th className="p-4 font-semibold text-right">Price (Shot)</th>
                            <th className="p-4 font-semibold text-center">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{item.brand}</td>
                                <td className="p-4 text-right text-gray-600">{item.priceFull?.toFixed(2)}</td>
                                <td className="p-4 text-right text-gray-600">{item.priceShot?.toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => toggleAvailability(item)}
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {item.available ? 'In Stock' : 'Unavailable'}
                                    </button>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
