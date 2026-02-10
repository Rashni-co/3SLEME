import React from 'react';
import Card from '../ui/Card';
import { Clock, User, CheckCircle } from 'lucide-react';

export default function MessageCard({ message, isOwnMessage, onMarkRead }) {
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // Handle both Firestore Timestamp and regular Date objects
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className={`p-4 transition-all ${!message.isRead && !isOwnMessage
                ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500'
                : 'bg-white border-army-100 hover:bg-army-50'
            }`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOwnMessage
                                ? 'bg-army-100 text-army-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {isOwnMessage ? 'Sent' : 'Received'}
                        </span>
                        <h4 className="text-sm font-semibold text-army-900 flex items-center gap-1">
                            <User size={14} className="text-army-400" />
                            {message.senderName || 'Unknown User'}
                        </h4>
                    </div>

                    <p className="text-gray-700 text-sm whitespace-pre-wrap mt-2">
                        {message.content}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(message.timestamp)}
                        </span>
                        {isOwnMessage && (
                            <span className="flex items-center gap-1">
                                {message.isRead ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle size={12} /> Read
                                    </span>
                                ) : (
                                    <span>Delivered</span>
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {!isOwnMessage && !message.isRead && onMarkRead && (
                    <button
                        onClick={() => onMarkRead(message.id)}
                        className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors font-medium whitespace-nowrap"
                    >
                        Mark Read
                    </button>
                )}
            </div>
        </Card>
    );
}
