import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Calendar, Users, Utensils, RefreshCw } from 'lucide-react';

export default function KitchenSummary() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [rsvps, setRsvps] = useState([]);
    const [officers, setOfficers] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all officers to map names
            // Optimisation: Cache this or context, but for now fetch is safer for consistent data
            const usersSnap = await getDocs(query(collection(db, 'users')));
            const userMap = {};
            usersSnap.forEach(doc => {
                userMap[doc.data().uid] = doc.data();
            });
            setOfficers(userMap);

            // 2. Fetch RSVPs for date
            const rsvpQuery = query(collection(db, 'rsvp'), where('date', '==', selectedDate));
            const rsvpSnap = await getDocs(rsvpQuery);
            setRsvps(rsvpSnap.docs.map(doc => doc.data()));
        } catch (error) {
            console.error("Error fetching kitchen data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const stats = rsvps.reduce((acc, curr) => {
        if (curr.meals?.breakfast) acc.breakfast++;
        if (curr.meals?.lunch) acc.lunch++;
        if (curr.meals?.dinner) acc.dinner++;
        return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0 });

    const getAttendees = (mealType) => {
        return rsvps
            .filter(r => r.meals?.[mealType])
            .map(r => officers[r.userId] || { rank: "Unknown", name: "Officer", officerNo: "N/A" })
            .sort((a, b) => a.officerNo?.localeCompare(b.officerNo));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-army-900">Kitchen Summary</h1>
                    <p className="text-army-600">Meal requests overview for catering planning.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-army-600" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-army-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-army-500"
                        />
                    </div>
                    <Button onClick={fetchData} variant="secondary" className="p-2">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-orange-50 border-orange-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-orange-900">Breakfast</h3>
                        <Utensils className="text-orange-400" />
                    </div>
                    <p className="text-4xl font-bold text-orange-700 mt-2">{stats.breakfast}</p>
                    <p className="text-sm text-orange-600">Requests</p>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-green-900">Lunch</h3>
                        <Utensils className="text-green-400" />
                    </div>
                    <p className="text-4xl font-bold text-green-700 mt-2">{stats.lunch}</p>
                    <p className="text-sm text-green-600">Requests</p>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-blue-900">Dinner</h3>
                        <Utensils className="text-blue-400" />
                    </div>
                    <p className="text-4xl font-bold text-blue-700 mt-2">{stats.dinner}</p>
                    <p className="text-sm text-blue-600">Requests</p>
                </Card>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['breakfast', 'lunch', 'dinner'].map(meal => (
                    <Card key={meal} className="flex flex-col h-[500px]">
                        <h3 className="text-lg font-bold text-army-900 capitalize mb-4 pb-2 border-b border-army-100 flex items-center gap-2">
                            <Users size={18} /> {meal} List
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {getAttendees(meal).length > 0 ? (
                                <ul className="space-y-2">
                                    {getAttendees(meal).map((officer, idx) => (
                                        <li key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded bg-white border border-gray-100">
                                            <div>
                                                <span className="font-semibold text-army-800 text-sm">{officer.rank} {officer.name}</span>
                                                <div className="text-xs text-gray-400">{officer.officerNo}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-400 italic mt-10">No requests.</p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
