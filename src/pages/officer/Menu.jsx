import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Calendar, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export default function OfficerMenu() {
    const { currentUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [menu, setMenu] = useState(null);
    const [rsvp, setRsvp] = useState({ breakfast: false, lunch: false, dinner: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Format date as YYYY-MM-DD for database keys
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const dateKey = formatDate(selectedDate);

    useEffect(() => {
        setLoading(true);
        // 1. Fetch Menu for selected date
        const menuRef = doc(db, 'menus', dateKey);
        const unsubscribeMenu = onSnapshot(menuRef, (docSnap) => {
            if (docSnap.exists()) {
                setMenu(docSnap.data());
            } else {
                setMenu(null);
            }
        });

        // 2. Fetch User's RSVP for selected date
        const fetchRsvp = async () => {
            try {
                const rsvpRef = doc(db, 'rsvp', `${dateKey}_${currentUser.uid}`);
                const rsvpSnap = await getDoc(rsvpRef);
                if (rsvpSnap.exists()) {
                    setRsvp(rsvpSnap.data().meals);
                } else {
                    setRsvp({ breakfast: false, lunch: false, dinner: false });
                }
            } catch (err) {
                console.error("Error fetching RSVP:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRsvp();

        return () => unsubscribeMenu();
    }, [dateKey, currentUser.uid]);

    const handleDateChange = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const toggleMeal = (mealType) => {
        setRsvp(prev => ({
            ...prev,
            [mealType]: !prev[mealType]
        }));
    };

    const saveRsvp = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'rsvp', `${dateKey}_${currentUser.uid}`), {
                date: dateKey,
                userId: currentUser.uid,
                meals: rsvp,
                updatedAt: new Date()
            });
            alert('Meal selections saved successfully!');
        } catch (error) {
            console.error("Error saving RSVP:", error);
            alert('Failed to save selection.');
        } finally {
            setSaving(false);
        }
    };

    // Helper to check if date is in the past (disable editing if so)
    const isPast = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-army-900">Weekly Menu & RSVP</h1>

                {/* Date Navigator */}
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-army-200">
                    <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-army-100 rounded">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 font-medium min-w-[140px] justify-center">
                        <Calendar size={18} className="text-army-600" />
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-army-100 rounded">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading menu data...</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-1">
                    {/* Menu Card */}
                    <Card className="relative overflow-hidden">
                        {!menu ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg">Menu not updated for this date.</p>
                                <p className="text-sm">Contact Mess Manager if this is an error.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-army-800 border-b border-army-100 pb-2 mb-2">Breakfast</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{menu.breakfast || "No special menu"}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-army-800 border-b border-army-100 pb-2 mb-2">Lunch</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{menu.lunch || "No special menu"}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-army-800 border-b border-army-100 pb-2 mb-2">Dinner</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{menu.dinner || "No special menu"}</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* RSVP Selection */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-army-900">Meal Attendance</h2>
                            {isPast() && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">PAST DATE</span>}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {['breakfast', 'lunch', 'dinner'].map((meal) => (
                                <button
                                    key={meal}
                                    onClick={() => !isPast() && toggleMeal(meal)}
                                    disabled={isPast()}
                                    className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                    ${rsvp[meal]
                                            ? 'border-army-600 bg-army-50 text-army-800'
                                            : 'border-gray-200 text-gray-400 hover:border-army-300'}
                  `}
                                >
                                    <span className="capitalize font-semibold mb-2">{meal}</span>
                                    {rsvp[meal] ? (
                                        <div className="bg-army-600 text-white p-1 rounded-full">
                                            <Check size={16} />
                                        </div>
                                    ) : (
                                        <div className="bg-gray-200 text-gray-400 p-1 rounded-full">
                                            <X size={16} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={saveRsvp}
                            disabled={isPast() || saving}
                            className="w-full"
                        >
                            {saving ? 'Saving...' : 'Update My Meal Requests'}
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}
