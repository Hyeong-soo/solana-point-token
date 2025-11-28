import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Navigate } from 'react-router-dom';
import { auth } from '../utils/firebase';

const AdminRoute = ({ children }) => {
    const { connected, loading } = useWallet();
    const user = auth.currentUser;

    if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-gray-600">Loading Admin...</div>;

    if (!connected || !user || user.email !== 'admin@point.app') {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;
