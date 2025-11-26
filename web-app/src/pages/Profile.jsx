import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Copy, Eye, EyeOff, LogOut, Shield, User } from 'lucide-react';
import bs58 from 'bs58';

const Profile = () => {
    const { userProfile, publicKey, keypair, disconnect } = useWallet();
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey.toBase58());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getPrivateKeyString = () => {
        if (!keypair) return "";
        return bs58.encode(keypair.secretKey);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">My Profile</h2>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-postech-100 rounded-full flex items-center justify-center text-postech-600 mb-4">
                    <User size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{userProfile?.name || 'Student'}</h3>
                <p className="text-gray-500">{userProfile?.studentId || 'Unknown ID'}</p>
                <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    {userProfile?.department || 'Department'}
                </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-800 font-bold mb-2">
                    <Shield size={20} className="text-postech-600" />
                    <h3>Wallet Security</h3>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wallet Address</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-50 p-3 rounded-xl text-xs text-gray-600 break-all font-mono">
                            {publicKey ? publicKey.toBase58() : 'Loading...'}
                        </code>
                        <button
                            onClick={handleCopyAddress}
                            className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                    {copied && <p className="text-xs text-green-600 mt-1 text-right">Copied!</p>}
                </div>

                {/* Private Key Export */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Private Key</label>
                        <button
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            className="text-xs text-postech-600 font-medium flex items-center gap-1"
                        >
                            {showPrivateKey ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Reveal</>}
                        </button>
                    </div>

                    {showPrivateKey ? (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                            <p className="text-xs text-red-600 font-bold mb-2">⚠️ DO NOT SHARE THIS KEY</p>
                            <code className="block text-xs text-red-800 break-all font-mono">
                                {getPrivateKeyString()}
                            </code>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-400 text-center italic">
                            Hidden for security
                        </div>
                    )}
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={disconnect}
                className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold text-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
                <LogOut size={20} />
                Log Out
            </button>
        </div>
    );
};

export default Profile;
