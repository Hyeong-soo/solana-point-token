import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { Check, Clock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettlementStatus = ({ settlementId, chatId, chatStatus, onAddFriend }) => {
    const [settlement, setSettlement] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!settlementId) return;

        const unsubscribe = onSnapshot(doc(db, "settlements", settlementId), (doc) => {
            if (doc.exists()) {
                setSettlement(doc.data());
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [settlementId]);

    if (loading) return <div className="p-4 text-center text-gray-400">Loading status...</div>;
    if (!settlement) return null;

    const totalAmount = settlement.totalAmount;
    const participants = settlement.participants || []; // Array of { uid, name, amount, status }

    // Calculate stats
    const paidCount = participants.filter(p => p.status === 'paid').length;
    const progress = (paidCount / participants.length) * 100;

    // Find my status
    const myParticipantInfo = participants.find(p => p.uid === currentUser?.uid);
    const creator = participants.find(p => p.role === 'payer'); // The person who paid initially
    const isCreator = settlement.creatorId === currentUser?.uid;

    const handlePay = () => {
        if (!myParticipantInfo || !creator) return;

        navigate('/send', {
            state: {
                contact: {
                    name: creator.name,
                    address: creator.address,
                    studentId: 'Unknown' // Optional
                },
                amount: myParticipantInfo.amount,
                settlementId: settlementId,
                returnToChat: true
            }
        });
    };

    const handleComplete = async () => {
        if (!chatId || !settlementId) return;
        if (!window.confirm("Mark settlement as completed? This will mark ALL participants as PAID.")) return;

        try {
            // 1. Mark all participants as paid
            const updatedParticipants = participants.map(p => ({ ...p, status: 'paid' }));

            await updateDoc(doc(db, "settlements", settlementId), {
                participants: updatedParticipants
            });

            // 2. Mark chat as completed
            await updateDoc(doc(db, "chats", chatId), {
                status: 'completed'
            });

            alert("Settlement marked as completed!");
        } catch (err) {
            console.error("Error completing settlement:", err);
            alert("Failed to complete settlement");
        }
    };

    const handleManualMarkPaid = async (participantUid) => {
        if (!isCreator || !settlement) return;
        if (!window.confirm("Mark this participant as PAID?")) return;

        try {
            const updatedParticipants = participants.map(p => {
                if (p.uid === participantUid) {
                    return { ...p, status: 'paid' };
                }
                return p;
            });

            await updateDoc(doc(db, "settlements", settlementId), {
                participants: updatedParticipants
            });

            // Check if everyone has paid
            const allPaid = updatedParticipants.every(p => p.status === 'paid');
            if (allPaid && chatId) {
                await updateDoc(doc(db, "chats", chatId), {
                    status: 'completed'
                });
            }
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-gray-800">Settlement Status</h3>
                    <p className="text-xs text-gray-500">{new Date(settlement.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-postech-600">{Number(totalAmount).toLocaleString()} P</p>
                    <p className="text-xs text-gray-500">{participants.length} People</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div
                    className="bg-postech-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="space-y-2">
                {participants.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {p.status === 'paid' ? <Check size={14} /> : <User size={14} />}
                            </div>
                            <span
                                className={`${p.status === 'paid' ? 'text-gray-800 font-medium' : 'text-gray-500'} ${p.uid !== currentUser?.uid ? 'cursor-pointer hover:text-postech-600 hover:underline' : ''}`}
                                onClick={() => {
                                    if (p.uid !== currentUser?.uid && onAddFriend) {
                                        // We don't have the studentId here directly in the participant object usually, 
                                        // but let's check if we can use uid or if we need to fetch it.
                                        // Wait, ChatRoom's handleAddFriend expects (senderId, senderName). 
                                        // Here senderId usually refers to the studentId in other contexts, but let's check ChatRoom implementation.
                                        // In ChatRoom, handleAddFriend uses arrayUnion(senderId). 
                                        // In Dashboard, we add studentId to friends array.
                                        // In ChatRoom messages, msg.senderId is likely the UID (from auth.currentUser.uid).
                                        // Wait, let's verify what "senderId" is in ChatRoom messages.
                                        // In ChatRoom: senderId: currentUser.uid. So it is the UID.
                                        // But in Dashboard, we add `studentId` (which is the document ID of student_lookup? Or the user's UID?).
                                        // Let's check Friends.jsx or Dashboard.jsx again.
                                        // In Dashboard: `friends: arrayUnion(studentId)`. 
                                        // And `studentId` comes from `req.from` or `item.lastSenderId`.
                                        // In Split.jsx, we store `uid` in participants.
                                        // So we should be consistent. If the friends array stores UIDs, then we pass p.uid.
                                        // Let's assume it stores UIDs for now based on ChatRoom usage.
                                        onAddFriend(p.uid, p.name);
                                    }
                                }}
                            >
                                {p.name} {p.uid === currentUser?.uid && "(You)"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{Number(p.amount).toLocaleString()} P</span>
                            {p.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Clock size={10} /> Pending
                                    </span>
                                    {isCreator && p.uid !== currentUser?.uid && (
                                        <button
                                            onClick={() => handleManualMarkPaid(p.uid)}
                                            className="text-xs text-postech-600 font-bold hover:underline"
                                        >
                                            Mark Paid
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pay Button for Me */}
            {myParticipantInfo && myParticipantInfo.status === 'pending' && (
                <button
                    onClick={handlePay}
                    className="w-full mt-4 bg-postech-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-postech-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-postech-200"
                >
                    Pay My Share <ArrowRight size={16} />
                </button>
            )}

            {/* Complete Button for Creator */}
            {isCreator && chatStatus !== 'completed' && (
                <button
                    onClick={handleComplete}
                    className="w-full mt-4 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    Mark as Completed
                </button>
            )}
        </div>
    );
};

export default SettlementStatus;
