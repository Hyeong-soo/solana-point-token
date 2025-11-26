import React, { useState } from 'react';
import { useConnection, useWallet } from '../context/WalletContext';
import { Transaction, PublicKey, Keypair } from '@solana/web3.js';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountIdempotentInstruction
} from '@solana/spl-token';
import { MINT_ADDRESS, MOCK_CONTACTS, DEMO_TREASURY_SECRET } from '../utils/constants';
import { ArrowLeft, Send as SendIcon, Loader2, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const Send = () => {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedContact, setSelectedContact] = useState(location.state?.contact || null);
    const [amount, setAmount] = useState(location.state?.amount || '');
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([]);

    // Fetch Friends
    React.useEffect(() => {
        const fetchFriends = async () => {
            if (!auth.currentUser) return;
            try {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userDoc.exists() && userDoc.data().friends) {
                    const friendIds = userDoc.data().friends;
                    const friendList = [];
                    for (const id of friendIds) {
                        const friendSnap = await getDoc(doc(db, "student_lookup", id));
                        if (friendSnap.exists()) {
                            friendList.push({ ...friendSnap.data(), studentId: id });
                        }
                    }
                    setFriends(friendList);
                }
            } catch (err) {
                console.error("Error fetching friends:", err);
            }
        };
        fetchFriends();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!publicKey || !selectedContact || !amount) return;

        setLoading(true);
        try {
            // DEMO ONLY: Use Treasury as Fee Payer (Gasless for User)
            const treasuryKeypair = Keypair.fromSecretKey(DEMO_TREASURY_SECRET);

            const transaction = new Transaction();
            const recipientPublicKey = new PublicKey(selectedContact.address);

            // 1. Get Addresses
            const senderTokenAddress = await getAssociatedTokenAddress(MINT_ADDRESS, publicKey);
            const recipientTokenAddress = await getAssociatedTokenAddress(MINT_ADDRESS, recipientPublicKey);

            // 2. Add Instruction: Create Recipient ATA (Idempotent - succeeds if exists)
            // Payer is Treasury (Admin) so user doesn't need SOL for rent
            transaction.add(
                createAssociatedTokenAccountIdempotentInstruction(
                    treasuryKeypair.publicKey, // Payer
                    recipientTokenAddress,     // ATA
                    recipientPublicKey,        // Owner
                    MINT_ADDRESS               // Mint
                )
            );

            // 3. Add Instruction: Transfer Points
            const transferAmount = BigInt(Math.floor(Number(amount) * 100));
            transaction.add(
                createTransferInstruction(
                    senderTokenAddress,    // Source
                    recipientTokenAddress, // Destination
                    publicKey,             // Owner (Signer)
                    transferAmount
                )
            );

            // 4. Configure Transaction for Multi-sig (User + Treasury)
            transaction.feePayer = treasuryKeypair.publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            // 5. User Signs (Primary Signer for Transfer)
            if (!signTransaction) throw new Error('Wallet does not support transaction signing!');
            const signedTx = await signTransaction(transaction);

            // 6. Treasury Signs (Fee Payer & Rent Payer)
            signedTx.partialSign(treasuryKeypair);

            // 7. Send Raw Transaction
            const signature = await connection.sendRawTransaction(signedTx.serialize());

            // 8. Confirm
            await connection.confirmTransaction(signature, 'confirmed');

            console.log('Transfer signature:', signature);
            console.log('Transfer signature:', signature);

            // If this was a request payment, mark it as completed
            if (location.state?.requestId) {
                try {
                    await updateDoc(doc(db, "requests", location.state.requestId), {
                        status: 'completed'
                    });
                } catch (err) {
                    console.error("Failed to update request status:", err);
                }
            }

            alert(`Sent ${Number(amount).toLocaleString()} POINT to ${selectedContact.name}!`);
            navigate('/');
        } catch (error) {
            console.error('Error sending points:', error);
            alert('Transfer Failed: ' + error.message);
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
                <h2 className="text-xl font-bold text-gray-800">Send POINT</h2>
            </div>

            {!selectedContact ? (
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Select Recipient</h3>
                    <div className="space-y-2">
                        {friends.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <p>No friends added yet.</p>
                                <Link to="/friends" className="text-postech-600 font-bold hover:underline">Find Friends</Link>
                            </div>
                        ) : (
                            friends.map((contact, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedContact(contact)}
                                    className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-postech-100 rounded-full flex items-center justify-center text-postech-600">
                                        <User size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-800">{contact.name}</p>
                                        <p className="text-xs text-gray-400 truncate w-48">{contact.studentId}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="flex items-center justify-between bg-postech-50 p-4 rounded-xl border border-postech-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-postech-100 rounded-full flex items-center justify-center text-postech-600">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-postech-500 font-bold">To</p>
                                <p className="font-bold text-postech-900">{selectedContact.name}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedContact(null)}
                            className="text-xs text-postech-500 underline"
                        >
                            Change
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount to send</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full text-2xl font-bold p-4 border-b-2 border-gray-200 focus:border-postech-600 outline-none bg-transparent transition-colors placeholder-gray-300"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">POINT</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !amount}
                        className="w-full bg-postech-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-postech-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Send Now'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default Send;
