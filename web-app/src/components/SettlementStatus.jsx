import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { Check, Clock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettlementStatus = ({ settlementId, chatId, chatStatus }) => {
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
        if (!chatId) return;
        try {
            await updateDoc(doc(db, "chats", chatId), {
                status: 'completed'
            });
            alert("Settlement marked as completed!");
        } catch (err) {
            console.error("Error completing settlement:", err);
            alert("Failed to complete settlement");
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
                            <span className={p.status === 'paid' ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                                {p.name} {p.uid === currentUser?.uid && "(You)"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{Number(p.amount).toLocaleString()} P</span>
                            {p.status === 'pending' && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock size={10} /> Pending
                                </span>
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
