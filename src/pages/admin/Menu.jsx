import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Calendar, Save, Loader2 } from 'lucide-react';

export default function AdminMenu() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [menu, setMenu] = useState({ breakfast: '', lunch: '', dinner: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const dateKey = selectedDate.toISOString().split('T')[0];

    useEffect(() => {
        fetchMenu();
    }, [dateKey]);

    const fetchMenu = async () => {
        setLoading(true);
        setMsg('');
        try {
            const docRef = doc(db, 'menus', dateKey);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMenu({
                    breakfast: data.breakfast || '',
                    lunch: data.lunch || '',
                    dinner: data.dinner || ''
                });
            } else {
                setMenu({ breakfast: '', lunch: '', dinner: '' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await setDoc(doc(db, 'menus', dateKey), {
                date: dateKey,
                ...menu,
                updatedAt: serverTimestamp()
            });
            setMsg('Menu updated successfully!');
        } catch (error) {
            console.error(error);
            setMsg('Failed to update menu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(new Date(e.target.value));
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-army-900 mb-6">Menu Management</h1>

            <Card>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-army-100">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-army-700 mb-1">Select Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-army-400" size={18} />
                            <input
                                type="date"
                                value={dateKey}
                                onChange={handleDateChange}
                                className="w-full pl-10 pr-4 py-2 border border-army-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-army-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 flex justify-end items-end">
                        <Button onClick={() => setSelectedDate(new Date())} variant="secondary" className="text-sm">
                            Today
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="animate-spin text-army-600" size={32} />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-army-900 mb-1">Breakfast</label>
                            <textarea
                                value={menu.breakfast}
                                onChange={e => setMenu({ ...menu, breakfast: e.target.value })}
                                rows={3}
                                className="w-full p-3 border border-army-300 rounded-lg focus:ring-2 focus:ring-army-500 focus:outline-none"
                                placeholder="e.g. String Hoppers, Dhal, Fish Curry..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-army-900 mb-1">Lunch</label>
                            <textarea
                                value={menu.lunch}
                                onChange={e => setMenu({ ...menu, lunch: e.target.value })}
                                rows={3}
                                className="w-full p-3 border border-army-300 rounded-lg focus:ring-2 focus:ring-army-500 focus:outline-none"
                                placeholder="e.g. Rice, Chicken Curry, Dhal, Salad..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-army-900 mb-1">Dinner</label>
                            <textarea
                                value={menu.dinner}
                                onChange={e => setMenu({ ...menu, dinner: e.target.value })}
                                rows={3}
                                className="w-full p-3 border border-army-300 rounded-lg focus:ring-2 focus:ring-army-500 focus:outline-none"
                                placeholder="e.g. Fried Rice, Chopsuey..."
                            />
                        </div>

                        {msg && (
                            <div className={`p-3 rounded text-sm ${msg.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {msg}
                            </div>
                        )}

                        <Button type="submit" disabled={saving} className="w-full flex justify-center items-center gap-2">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {saving ? 'Updating...' : 'Update Menu'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}
