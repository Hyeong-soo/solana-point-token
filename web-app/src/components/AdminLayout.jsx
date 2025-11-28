import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { LogOut } from 'lucide-react';

const AdminLayout = () => {
    const { userProfile, disconnect } = useWallet();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await disconnect();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white min-h-screen shadow-xl flex flex-col relative">
                {/* Admin Header */}
                <header className="p-4 flex justify-between items-center bg-gray-900 text-white sticky top-0 z-50">
                    <h1 className="text-xl font-bold tracking-tighter">POINT <span className="text-postech-400">ADMIN</span></h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-300">Administrator</span>
                        <button
                            onClick={handleLogout}
                            className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                            title="Log Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
