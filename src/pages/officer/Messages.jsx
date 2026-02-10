import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import ComposeMessage from '../../components/messaging/ComposeMessage';
import MessageCard from '../../components/messaging/MessageCard';
import { MessageSquare } from 'lucide-react';

export default function OfficerMessages() {
    const { currentUser, userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        // Query messages where:
        // 1. Recipient is THIS user (Reminders received)
        // 2. Sender is THIS user (Notes sent)
        // Note: Firestore doesn't support logical OR in simple queries efficiently for mixed fields.
        // We might need client-side merging or two listeners.
        // Or simpler: Listen to all messages involving this user ID.
        // "OR" queries are available with `or(...)` in newer SDK, but let's stick to simple composite or two queries.
        // Actually, let's just use two simple queries and merge, or one query if we restructure.

        // For simplicity and realtime updates, let's just listen to collection and filter client-side? No, security/performance.
        // Correct approach:
        // q1: recipientId == uid
        // q2: senderId == uid

        const q1 = query(collection(db, 'messages'), where('recipientId', '==', currentUser.uid));
        const q2 = query(collection(db, 'messages'), where('senderId', '==', currentUser.uid));

        const unsubscribe1 = onSnapshot(q1, (snap) => {
            const received = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateMessages(received, 'received');
        });

        const unsubscribe2 = onSnapshot(q2, (snap) => {
            const sent = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateMessages(sent, 'sent');
        });

        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    }, [currentUser]);

    // Merge logic
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [sentMessages, setSentMessages] = useState([]);

    const updateMessages = (newMsgs, type) => {
        if (type === 'received') setReceivedMessages(newMsgs);
        if (type === 'sent') setSentMessages(newMsgs);
    };

    // Combine and sort
    const allMessages = [...receivedMessages, ...sentMessages].sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
    });

    const handleSendMessage = async ({ content }) => {
        setLoading(true);
        try {
            await addDoc(collection(db, 'messages'), {
                senderId: currentUser.uid,
                senderName: `${userData.rank} ${userData.name}`,
                senderRole: 'officer',
                recipientId: 'admin',
                recipientName: 'Mess Office',
                content,
                isRead: false,
                timestamp: serverTimestamp()
            });
            alert('Note sent to Mess Office!');
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-army-900 flex items-center gap-2">
                    <MessageSquare size={28} />
                    Messages & Reminders
                </h1>
            </header>

            <div className="flex flex-col-reverse md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <h2 className="text-lg font-semibold text-army-800 border-b border-army-200 pb-2">
                        History
                    </h2>
                    {allMessages.length > 0 ? (
                        allMessages.map(msg => (
                            <MessageCard
                                key={msg.id}
                                message={msg}
                                isOwnMessage={msg.senderId === currentUser.uid}
                                onMarkRead={markAsRead}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">No messages yet.</p>
                    )}
                </div>

                <div className="w-full md:w-1/3">
                    <ComposeMessage
                        onSend={handleSendMessage}
                        recipients={[]} // Not needed for officer
                        loading={loading}
                        isAdmin={false}
                    />
                </div>
            </div>
        </div>
    );
}
