import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Navigate } from 'react-router-dom';
import { auth } from '../utils/firebase';

const ProtectedRoute = ({ children }) => {
    const { connected, loading } = useWallet();

    if (!connected) {
        if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-postech-600">Loading Wallet...</div>;
        return <Navigate to="/login" replace />;
    }

    // Redirect Admin to Admin Dashboard if they try to access User pages
    if (auth.currentUser?.email === 'admin@point.app') {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
