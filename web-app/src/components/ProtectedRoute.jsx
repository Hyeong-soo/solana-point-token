import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { connected, loading } = useWallet();

    if (!connected) {
        if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-postech-600">Loading Wallet...</div>;
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
