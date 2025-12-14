import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Home, Send, PlusCircle, ArrowDownLeft, LogOut, Users, User, MessageCircle } from 'lucide-react';
import { db, auth } from '../utils/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { isChatUnread } from '../utils/unreadUtils';
import { useState, useEffect } from 'react';


const Layout = ({ children }) => {
    const location = useLocation();
    const { disconnect, userProfile } = useWallet();

    const isActive = (path) => location.pathname === path;

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let count = 0;
            snapshot.forEach(doc => {
                const chat = { id: doc.id, ...doc.data() };
                if (isChatUnread(chat, auth.currentUser?.uid)) {
                    count++;
                }
            });
            setUnreadCount(count);
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col items-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative">
                {/* Header */}
                <header className="p-4 flex justify-between items-center bg-white sticky top-0 z-50 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-postech-600 tracking-tighter">POINT</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">{userProfile?.name || 'Student'}</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 overflow-y-auto pb-24">
                    <Outlet />
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 grid grid-cols-4 items-center py-3 pb-6 z-20">
                    <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <Home size={24} />
                        <span className="text-xs font-medium">Home</span>
                    </Link>
                    <Link to="/chats" className={`flex flex-col items-center gap-1 ${isActive('/chats') ? 'text-postech-600' : 'text-gray-400'} relative`}>
                        <div className="relative">
                            <MessageCircle size={24} />
                            {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-medium">Chats</span>
                    </Link>
                    <Link to="/friends" className={`flex flex-col items-center gap-1 ${isActive('/friends') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <Users size={24} />
                        <span className="text-xs font-medium">Friends</span>
                    </Link>
                    <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <User size={24} />
                        <span className="text-xs font-medium">Profile</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default Layout;
