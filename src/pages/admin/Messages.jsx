import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import ComposeMessage from '../../components/messaging/ComposeMessage';
import MessageCard from '../../components/messaging/MessageCard';
import { MessageSquare, Bell } from 'lucide-react';

export default function AdminMessages() {
    const { userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [filter, setFilter] = useState('all'); // all, unread
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOfficers();

        // Listen for messages where recipient is 'admin' OR sent by 'admin' (to see history)
        // Actually, for Admin inbox, we mainly care about messages SENT TO admin.
        // But it's nice to see conversation history.
        // Let's just fetch ALL messages for now and filter in UI or simple query.
        // Better: Fetch messages where recipient is 'admin' OR sender is 'admin'.
        // Firestore OR queries are limited.

        // Let's stick to two listeners or one broad listener if collection is small.
        // Given this is a simple app, let's just listen to the whole collection for now, 
        // or refine to: query(collection(db, 'messages'), orderBy('timestamp', 'desc'))

        const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        });

        return unsubscribe;
    }, []);

    const fetchOfficers = async () => {
        const q = query(collection(db, "users"), where("role", "==", "officer"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => a.rank.localeCompare(b.rank)); // Should better sort by rank weight
        setOfficers(list);
    };

    const handleSendMessage = async ({ content, recipientId }) => {
        setLoading(true);
        try {
            if (recipientId === 'all') {
                // Broadcast to all officers
                const batchPromises = officers.map(officer => {
                    return addDoc(collection(db, 'messages'), {
                        senderId: 'admin',
                        senderName: 'Mess Office',
                        senderRole: 'admin',
                        recipientId: officer.id,
                        recipientName: `${officer.rank} ${officer.name}`,
                        content,
                        isRead: false,
                        timestamp: serverTimestamp()
                    });
                });
                await Promise.all(batchPromises);
                alert('Broadcast sent to all officers!');
            } else {
                // Single recipient
                const recipient = officers.find(o => o.id === recipientId);
                await addDoc(collection(db, 'messages'), {
                    senderId: 'admin',
                    senderName: 'Mess Office', // userData.name might be personal name, generic is better
                    senderRole: 'admin',
                    recipientId,
                    recipientName: recipient ? `${recipient.rank} ${recipient.name}` : 'Unknown',
                    content,
                    isRead: false,
                    timestamp: serverTimestamp()
                });
                alert('Reminder sent!');
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            await updateDoc(doc(db, 'messages', messageId), {
                isRead: true
            });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    // Filter messages for the view
    // 1. Inbox: Messages sent TO admin (recipientId === 'admin')
    // 2. Sent: Messages sent BY admin (senderId === 'admin')
    // Let's show a unified stream or tabs?
    // User requested "send reminders" and "receive notes".
    // A split view is best. Inbox on left, Compose/History on right?
    // Or a classic chat interface?
    // Let's go with:
    // Tab 1: Inbox (Notes from Officers)
    // Tab 2: Sent Reminders

    const [activeTab, setActiveTab] = useState('inbox');

    const inboxMessages = messages.filter(m => m.recipientId === 'admin');
    const sentMessages = messages.filter(m => m.senderId === 'admin');

    return (
        <div className="max-w-6xl mx-auto p-4">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-army-900 flex items-center gap-2">
                    <MessageSquare size={28} />
                    Message Center
                </h1>
                <p className="text-army-600">Manage communications with officers.</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Messages List */}
                <div className="flex-1">
                    <div className="flex items-center gap-4 border-b border-army-200 mb-4">
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`pb-2 px-4 font-semibold text-sm transition-colors ${activeTab === 'inbox'
                                    ? 'border-b-2 border-army-600 text-army-900'
                                    : 'text-army-400 hover:text-army-600'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                Inbox
                                {inboxMessages.some(m => !m.isRead) && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                                        {inboxMessages.filter(m => !m.isRead).length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`pb-2 px-4 font-semibold text-sm transition-colors ${activeTab === 'sent'
                                    ? 'border-b-2 border-army-600 text-army-900'
                                    : 'text-army-400 hover:text-army-600'
                                }`}
                        >
                            Sent Reminders
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {activeTab === 'inbox' ? (
                            inboxMessages.length > 0 ? (
                                inboxMessages.map(msg => (
                                    <MessageCard
                                        key={msg.id}
                                        message={msg}
                                        isOwnMessage={false}
                                        onMarkRead={markAsRead}
                                    />
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-8">No messages received.</p>
                            )
                        ) : (
                            sentMessages.length > 0 ? (
                                sentMessages.map(msg => (
                                    <MessageCard
                                        key={msg.id}
                                        message={msg}
                                        isOwnMessage={true}
                                    />
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-8">No reminders sent.</p>
                            )
                        )}
                    </div>
                </div>

                {/* Right Column: Compose */}
                <div className="w-full lg:w-1/3">
                    <ComposeMessage
                        onSend={handleSendMessage}
                        recipients={officers}
                        loading={loading}
                        isAdmin={true}
                    />
                </div>
            </div>
        </div>
    );
}
