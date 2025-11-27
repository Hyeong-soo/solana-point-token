import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('active'); // 'active' | 'completed'

    useEffect(() => {
        if (!auth.currentUser) return;

        // Query chats where current user is a participant
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", auth.currentUser.uid),
            orderBy("lastMessageAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredChats = chats.filter(chat => {
        if (tab === 'active') {
            return chat.status !== 'completed';
        } else {
            return chat.status === 'completed';
        }
    });

    return (
        <div className="p-4 pb-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Chats</h2>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button
                    onClick={() => setTab('active')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'active' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setTab('completed')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'completed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Completed
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading chats...</div>
            ) : filteredChats.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        {tab === 'active' ? <MessageCircle size={32} /> : <CheckCircle size={32} />}
                    </div>
                    <p>{tab === 'active' ? 'No active chats.' : 'No completed settlements.'}</p>
                    {tab === 'active' && (
                        <Link to="/split" className="text-postech-600 font-bold mt-2 inline-block">Start a Split</Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredChats.map(chat => (
                        <Link
                            key={chat.id}
                            to={`/chats/${chat.id}`}
                            className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-800 truncate">{chat.title}</h3>
                                <span className="text-xs text-gray-400">
                                    {chat.lastMessageAt?.toDate().toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                    {chat.lastMessage || "No messages yet"}
                                </p>
                                <ArrowRight size={16} className="text-gray-300" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatList;
