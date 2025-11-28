import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { Building2, CreditCard, Wallet, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TREASURY_ADDRESS, MINT_ADDRESS } from '../utils/constants';
import { Keypair } from '@solana/web3.js';

const AdminDashboard = () => {
    const [balances, setBalances] = useState({ krw: 0, usd: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin Wallet Address
    const adminAddress = TREASURY_ADDRESS.toBase58();

    useEffect(() => {
        // 1. Listen to Balances
        const unsubBalances = onSnapshot(doc(db, 'admin_stats', 'balances'), (doc) => {
            if (doc.exists()) {
                setBalances(doc.data());
            } else {
                // Initialize if not exists (handled in Buy.jsx usually, but good to have default)
                setBalances({ krw: 0, usd: 0 });
            }
        });

        // 2. Listen to Recent Transactions
        const q = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubTransactions = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(txs);
            setLoading(false);
        });

        return () => {
            unsubBalances();
            unsubTransactions();
        };
    }, []);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>

            {/* Admin Wallet Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Admin Treasury Wallet</p>
                        <p className="font-mono text-sm text-gray-800 break-all">{adminAddress}</p>
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 pl-14">
                    Token Mint: {MINT_ADDRESS.toBase58()}
                </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* KRW Account */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Building2 size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-500 uppercase mb-1">KRW Account Balance</p>
                        <h2 className="text-3xl font-bold text-gray-800">
                            ₩ {balances.krw?.toLocaleString() || 0}
                        </h2>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <RefreshCw size={12} /> Live Updates
                        </p>
                    </div>
                </div>

                {/* USD Account */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CreditCard size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-500 uppercase mb-1">Foreign Account Balance (USD)</p>
                        <h2 className="text-3xl font-bold text-gray-800">
                            $ {balances.usd?.toLocaleString() || 0}
                        </h2>
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <RefreshCw size={12} /> Live Updates
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Recent Buy Transactions</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-4 font-medium">Time</th>
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Method</th>
                                <th className="p-4 font-medium text-right">Amount</th>
                                <th className="p-4 font-medium text-right">Minted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">Loading transactions...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">No transactions yet.</td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-gray-500 whitespace-nowrap">
                                            {tx.createdAt?.toDate().toLocaleString()}
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {tx.userEmail || tx.userId?.slice(0, 8) + '...'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.method === 'card'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {tx.method === 'card' ? 'Credit Card' : 'Bank Account'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-600">
                                            {tx.method === 'card'
                                                ? `$ ${tx.usdAmount?.toLocaleString() || '0.00'}`
                                                : `₩ ${tx.amount?.toLocaleString()}`
                                            }
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-postech-600">
                                            +{tx.mintAmount?.toLocaleString()} P
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
