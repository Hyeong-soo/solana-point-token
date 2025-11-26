import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Home, Send, PlusCircle, ArrowDownLeft, LogOut, Users, User } from 'lucide-react';


const Layout = ({ children }) => {
    const location = useLocation();
    const { disconnect, userProfile } = useWallet();

    const isActive = (path) => location.pathname === path;

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
                <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around items-center py-3 pb-6 z-20">
                    <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <Home size={24} />
                        <span className="text-xs font-medium">Home</span>
                    </Link>
                    <Link to="/send" className={`flex flex-col items-center gap-1 ${isActive('/send') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <Send size={24} />
                        <span className="text-xs font-medium">Send</span>
                    </Link>
                    <Link to="/buy" className={`flex flex-col items-center gap-1 ${isActive('/buy') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <PlusCircle size={24} />
                        <span className="text-xs font-medium">Buy</span>
                    </Link>
                    <Link to="/request" className={`flex flex-col items-center gap-1 ${isActive('/request') ? 'text-postech-600' : 'text-gray-400'}`}>
                        <ArrowDownLeft size={24} />
                        <span className="text-xs font-medium">Request</span>
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
