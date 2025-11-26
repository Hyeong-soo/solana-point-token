import React, { useState } from 'react';
import { useConnection, useWallet } from '../context/WalletContext';
import { Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { MINT_ADDRESS, DEMO_TREASURY_SECRET } from '../utils/constants';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Buy = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBuy = async (e) => {
        e.preventDefault();
        if (!publicKey || !amount) return;

        setLoading(true);
        try {
            // DEMO ONLY: Load the Admin/Treasury Keypair
            const adminKeypair = Keypair.fromSecretKey(DEMO_TREASURY_SECRET);

            // 1. Get Admin's Token Account (Source)
            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeypair, // Payer
                MINT_ADDRESS,
                adminKeypair.publicKey
            );

            // 2. Get/Create User's Token Account (Destination)
            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeypair, // Payer (Admin pays for user's account creation in this demo)
                MINT_ADDRESS,
                publicKey
            );

            // 3. Transfer Tokens from Admin to User
            const transferAmount = BigInt(Math.floor(Number(amount) * 100));

            const transaction = new Transaction().add(
                createTransferInstruction(
                    adminTokenAccount.address, // Source
                    userTokenAccount.address,  // Destination
                    adminKeypair.publicKey,    // Owner (Signer)
                    transferAmount
                )
            );

            // Sign and send (Admin signs)
            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [adminKeypair] // Signer
            );

            console.log('Transfer signature:', signature);
            alert(`${Number(amount).toLocaleString()} POINT Purchased!`);
            navigate('/');
        } catch (error) {
            console.error('Error buying points:', error);
            alert('Purchase Failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/" className="text-gray-500 hover:text-gray-800">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-xl font-bold text-gray-800">Buy POINT</h2>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-postech-100 rounded-full flex items-center justify-center text-postech-600">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">Linked Account</p>
                        <p className="text-xs text-gray-500">Shinhan Bank 110-***-******</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleBuy} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount to charge</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full text-2xl font-bold p-4 border-b-2 border-gray-200 focus:border-postech-600 outline-none bg-transparent transition-colors placeholder-gray-300"
                            autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">KRW</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">1 KRW = 1 POINT</p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-postech-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-postech-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Buy Now'}
                </button>
            </form>
        </div>
    );
};

export default Buy;
