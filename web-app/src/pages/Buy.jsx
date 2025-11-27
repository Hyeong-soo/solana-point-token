import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '../context/WalletContext';
import { Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { MINT_ADDRESS, DEMO_TREASURY_SECRET } from '../utils/constants';
import { ArrowLeft, CreditCard, Loader2, Building2, Lock, Plus, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const Buy = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('account'); // 'account' | 'card'

    // Card State
    const [savedCards, setSavedCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState('new');
    const [saveCard, setSaveCard] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    // Fetch Saved Cards
    useEffect(() => {
        const fetchSavedCards = async () => {
            if (!auth.currentUser) return;
            try {
                const q = query(
                    collection(db, 'users', auth.currentUser.uid, 'cards'),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const cards = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSavedCards(cards);
                if (cards.length > 0) {
                    setSelectedCardId(cards[0].id);
                }
            } catch (error) {
                console.error("Error fetching cards:", error);
            }
        };

        fetchSavedCards();
    }, []);

    // Format Card Number
    const handleCardNumberChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        val = val.substring(0, 16);
        val = val.replace(/(\d{4})/g, '$1 ').trim();
        setCardNumber(val);
    };

    // Format Expiry
    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        setExpiry(val);
    };

    const handleBuy = async (e) => {
        e.preventDefault();
        if (!publicKey || !amount) return;

        setLoading(true);

        try {
            // Simulation Delay for Card Payment
            if (paymentMethod === 'card') {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay

                // Save Card Logic (Simulation)
                if (selectedCardId === 'new' && saveCard && auth.currentUser) {
                    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
                    await addDoc(collection(db, 'users', auth.currentUser.uid, 'cards'), {
                        last4: last4,
                        brand: 'Visa', // Mock brand
                        createdAt: serverTimestamp()
                    });
                }
            }

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

    const isCardValid = () => {
        if (selectedCardId !== 'new') return true;
        return cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvc.length === 3;
    };

    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/" className="text-gray-500 hover:text-gray-800">
                    <ArrowLeft size={24} />
                </Link>
                <h2 className="text-xl font-bold text-gray-800">Buy POINT</h2>
            </div>

            {/* Payment Method Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button
                    onClick={() => setPaymentMethod('account')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'account' ? 'bg-white text-postech-600 shadow-sm' : 'text-gray-500'}`}
                >
                    Linked Account
                </button>
                <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'card' ? 'bg-white text-postech-600 shadow-sm' : 'text-gray-500'}`}
                >
                    Credit Card
                </button>
            </div>

            {paymentMethod === 'account' ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-postech-100 rounded-full flex items-center justify-center text-postech-600">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">Linked Account</p>
                            <p className="text-xs text-gray-500">Shinhan Bank 110-***-******</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 mb-6">
                    {/* Saved Cards List */}
                    {savedCards.length > 0 && (
                        <div className="space-y-2">
                            {savedCards.map(card => (
                                <div
                                    key={card.id}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all flex items-center justify-between ${selectedCardId === card.id ? 'border-postech-600 ring-1 ring-postech-600' : 'border-gray-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                                {card.brand} <span className="text-gray-400 font-normal">•••• {card.last4}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {selectedCardId === card.id && <Check size={20} className="text-postech-600" />}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Card Option */}
                    <div
                        onClick={() => setSelectedCardId('new')}
                        className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all flex items-center gap-3 ${selectedCardId === 'new' ? 'border-postech-600 ring-1 ring-postech-600' : 'border-gray-100'}`}
                    >
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                            <Plus size={20} />
                        </div>
                        <p className="font-medium text-gray-600">Use a new card</p>
                    </div>

                    {/* New Card Form */}
                    {selectedCardId === 'new' && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-gray-800 font-bold">
                                    <CreditCard size={20} className="text-postech-600" />
                                    <span>Card Details</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-4 w-8 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-8 bg-gray-200 rounded"></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:border-postech-500 outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry</label>
                                        <input
                                            type="text"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:border-postech-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVC</label>
                                        <input
                                            type="text"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            placeholder="123"
                                            maxLength="3"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:border-postech-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="saveCard"
                                        checked={saveCard}
                                        onChange={(e) => setSaveCard(e.target.checked)}
                                        className="w-4 h-4 text-postech-600 rounded border-gray-300 focus:ring-postech-500"
                                    />
                                    <label htmlFor="saveCard" className="text-sm text-gray-600 select-none cursor-pointer">Save this card for future use</label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                                <Lock size={12} />
                                <span>Payments are secure and encrypted</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                    disabled={loading || !amount || (paymentMethod === 'card' && !isCardValid())}
                    className="w-full bg-postech-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-postech-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-postech-200"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (paymentMethod === 'card' ? 'Pay & Buy' : 'Buy Now')}
                </button>
            </form>
        </div>
    );
};

export default Buy;
