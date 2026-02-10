import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function ComposeMessage({ onSend, recipients, loading, isAdmin }) {
    const [content, setContent] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        // If admin, recipient is required (unless sending to all logic is handled elsewhere or via specific value)
        if (isAdmin && !selectedRecipient) return;

        onSend({
            content,
            recipientId: isAdmin ? selectedRecipient : 'admin'
        });

        setContent('');
        if (isAdmin) setSelectedRecipient('');
    };

    return (
        <Card className="p-4 bg-white sticky top-4">
            <h3 className="text-lg font-bold text-army-900 mb-4 flex items-center gap-2">
                <Send size={20} />
                Compose Message
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {isAdmin && (
                    <div>
                        <label className="block text-xs font-semibold text-army-600 mb-1">
                            To:
                        </label>
                        <select
                            value={selectedRecipient}
                            onChange={(e) => setSelectedRecipient(e.target.value)}
                            className="w-full p-2 border border-army-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-army-500 bg-white"
                            required
                        >
                            <option value="">Select Officer...</option>
                            <option value="all">📢 ALL OFFICERS (Broadcast)</option>
                            {recipients.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.rank} {r.name} ({r.officerNo})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-army-600 mb-1">
                        Message:
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isAdmin ? "Type your reminder here..." : "Type your note to the mess office..."}
                        rows={4}
                        className="w-full p-3 border border-army-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-army-500 resize-none"
                        required
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading || !content.trim() || (isAdmin && !selectedRecipient)}
                    className="flex justify-center items-center gap-2"
                >
                    <Send size={16} />
                    Send Message
                </Button>
            </form>
        </Card>
    );
}
