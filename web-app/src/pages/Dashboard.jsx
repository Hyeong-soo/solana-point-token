import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '../context/WalletContext';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { PublicKey, Keypair } from '@solana/web3.js';
import { MINT_ADDRESS, TREASURY_ADDRESS } from '../utils/constants';

import { Plus, Send, ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, AlertCircle, Calculator, CreditCard, ScanBarcode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { isChatUnread } from '../utils/unreadUtils';

const Dashboard = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lock to prevent double fetching
    const isFetching = useRef(false);

    // Real Pending Requests from Firebase
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]); // [NEW] Sent Requests
    const [pendingSettlements, setPendingSettlements] = useState([]);
    const [activeSettlementChats, setActiveSettlementChats] = useState([]); // [NEW] Active Settlement Chats

    // Listen for pending requests & settlements
    useEffect(() => {
        if (!publicKey) return;

        // 1. Incoming Requests (To Me)
        const qRequests = query(
            collection(db, "requests"),
            where("toUid", "==", auth.currentUser.uid), // [FIX] Use UID
            where("status", "==", "pending")
        );

        const unsubRequests = onSnapshot(qRequests, (snapshot) => {
            const requests = [];
            snapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            setPendingRequests(requests);
        }, (error) => console.error("Firestore Error (Requests):", error));

        // 2. Outgoing Requests (From Me) [NEW]
        const qSentRequests = query(
            collection(db, "requests"),
            where("fromUid", "==", auth.currentUser.uid) // [FIX] Use UID
        );

        const unsubSentRequests = onSnapshot(qSentRequests, (snapshot) => {
            const requests = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status !== 'archived') {
                    requests.push({ id: doc.id, ...data });
                }
            });
            // Client-side sort
            requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setSentRequests(requests);
        }, (error) => console.error("Firestore Error (Sent Requests):", error));

        // 3. Settlements (via Chats)
        const qChats = query(
            collection(db, "chats"),
            where("participants", "array-contains", auth.currentUser.uid),
            where("status", "==", "active")
        );

        const unsubChats = onSnapshot(qChats, async (snapshot) => {
            const settlements = [];
            const activeChats = []; // [NEW]

            for (const chatDoc of snapshot.docs) {
                const chatData = chatDoc.data();

                // [NEW] Collect Active Settlement Chats
                if (chatData.settlementId) {
                    try {
                        const settlementDoc = await getDocs(query(collection(db, "settlements"), where("__name__", "==", chatData.settlementId)));
                        if (!settlementDoc.empty) {
                            const settlementData = settlementDoc.docs[0].data();
                            const myParticipant = settlementData.participants.find(p => p.uid === auth.currentUser.uid);

                            // 1. Pending Payment (I owe money)
                            if (myParticipant && myParticipant.status === 'pending') {
                                settlements.push({
                                    chatId: chatDoc.id,
                                    chatTitle: chatData.title,
                                    myAmount: myParticipant.amount,
                                    settlementId: chatData.settlementId,
                                    lastMessageAt: chatData.lastMessageAt,
                                    lastSenderId: chatData.lastSenderId, // [NEW] Needed for unread check
                                    readStatus: chatData.readStatus // [NEW] Needed for unread check
                                });
                            }
                            // 2. Active Settlement (I am the Creator)
                            else if (settlementData.creatorId === auth.currentUser.uid) {
                                activeChats.push({
                                    id: chatDoc.id,
                                    title: chatData.title,
                                    settlementId: chatData.settlementId,
                                    lastMessageAt: chatData.lastMessageAt,
                                    lastSenderId: chatData.lastSenderId, // [NEW] Needed for unread check
                                    readStatus: chatData.readStatus // [NEW] Needed for unread check
                                });
                            }
                            // 3. Paid Participant (Hide from Dashboard)
                        }
                    } catch (err) {
                        console.error("Error fetching settlement:", err);
                    }
                }
            }
            // Filter out active chats that are already in pending settlements (redundant check but safe)
            const filteredActiveChats = activeChats.filter(chat =>
                !settlements.some(s => s.settlementId === chat.settlementId)
            );

            setPendingSettlements(settlements);
            setActiveSettlementChats(filteredActiveChats);
        }, (error) => console.error("Firestore Error (Chats):", error));

        return () => {
            unsubRequests();
            unsubSentRequests();
            unsubChats();
        };
    }, [publicKey]);

    // Helper to mark request as complete
    const handleMarkComplete = async (requestId) => {
        if (!window.confirm("Mark this request as completed?")) return;
        try {
            await updateDoc(doc(db, "requests", requestId), {
                status: 'completed'
            });
        } catch (err) {
            console.error("Failed to update request:", err);
            alert("Failed to update status");
        }
    };

    // Helper to archive request (hide from view)
    const handleArchive = async (requestId) => {
        try {
            await updateDoc(doc(db, "requests", requestId), {
                status: 'archived'
            });
        } catch (err) {
            console.error("Failed to archive request:", err);
            alert("Failed to archive");
        }
    };

    // Helper to add friend
    const handleAddFriend = async (e, name, studentId) => {
        e.stopPropagation(); // Prevent triggering parent click if any
        if (!studentId || !auth.currentUser) return;

        if (!window.confirm(`Add ${name} (${studentId}) as friend?`)) return;

        try {
            const myRef = doc(db, "users", auth.currentUser.uid);

            // Check if already friends
            const myDoc = await getDoc(myRef);
            if (myDoc.exists()) {
                const myData = myDoc.data();
                if (myData.friends && myData.friends.includes(studentId)) {
                    alert("This user is already your friend!");
                    return;
                }
            }

            await updateDoc(myRef, {
                friends: arrayUnion(studentId)
            });
            alert(`Added ${name} to friends!`);
        } catch (err) {
            console.error("Failed to add friend:", err);
            alert("Failed to add friend");
        }
    };

    const fetchData = useCallback(async () => {
        if (!publicKey || isFetching.current) return;

        isFetching.current = true;
        setLoading(true);
        setHistoryLoading(true);
        setError(null);

        try {
            const userTokenAddress = await getAssociatedTokenAddress(new PublicKey(MINT_ADDRESS), publicKey);

            // 1. Fetch Balance
            try {
                const info = await getAccount(connection, userTokenAddress, 'confirmed');
                setBalance(Number(info.amount) / 100);
            } catch (e) {
                setBalance(0);
            }

            // 2. Fetch History
            // We need to fetch signatures for BOTH the User's Wallet AND the User's ATA.
            // "Buy" transactions (Treasury -> UserATA) only reference the ATA, not the Wallet.

            const [walletSignatures, ataSignatures] = await Promise.all([
                connection.getSignaturesForAddress(publicKey, { limit: 5 }, 'confirmed'),
                connection.getSignaturesForAddress(userTokenAddress, { limit: 5 }, 'confirmed')
            ]);

            // Merge and Deduplicate
            const allSignatures = [...walletSignatures, ...ataSignatures];
            const uniqueSignaturesMap = new Map();
            allSignatures.forEach(sig => {
                uniqueSignaturesMap.set(sig.signature, sig);
            });

            // Sort by blockTime desc
            const sortedSignatures = Array.from(uniqueSignaturesMap.values())
                .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
                .slice(0, 5);

            if (sortedSignatures.length > 0) {
                const tempHistory = [];
                const otherPartyAddresses = new Set();

                // SEQUENTIAL FETCHING (Required for Public Devnet to avoid 429)
                for (let i = 0; i < sortedSignatures.length; i++) {
                    const sig = sortedSignatures[i];
                    try {
                        const tx = await connection.getParsedTransaction(
                            sig.signature,
                            { maxSupportedTransactionVersion: 0, commitment: 'confirmed' }
                        );

                        if (!tx) continue;

                        const mintAddressString = MINT_ADDRESS.toBase58();
                        const signature = sig.signature;
                        // Format date to include time (e.g., 2023. 11. 27. 14:30)
                        const dateObj = new Date(tx.blockTime * 1000);
                        const date = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        let type = 'Unknown';
                        let amount = 0;
                        let isOutgoing = false;
                        let otherParty = null;

                        const preBalance = tx.meta.preTokenBalances?.find(b => b.mint === mintAddressString && b.owner === publicKey.toBase58());
                        const postBalance = tx.meta.postTokenBalances?.find(b => b.mint === mintAddressString && b.owner === publicKey.toBase58());

                        const pre = preBalance ? Number(preBalance.uiTokenAmount.amount) : 0;
                        const post = postBalance ? Number(postBalance.uiTokenAmount.amount) : 0;
                        const diff = post - pre;

                        if (diff > 0) {
                            // Received
                            amount = diff / 100;
                            isOutgoing = false;

                            let senderOwner = null;

                            // Strategy 1: Instruction Parsing (Prioritized)
                            // The authority of the transfer instruction is definitively the sender.
                            const instructions = tx.transaction.message.instructions;
                            for (const ix of instructions) {
                                if (ix.program === 'spl-token') {
                                    if (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked') {
                                        senderOwner = ix.parsed.info.authority;
                                        break;
                                    } else if (ix.parsed?.type === 'mintTo') {
                                        type = 'Buy';
                                        break;
                                    }
                                }
                            }

                            // Strategy 2: Find who lost money (Balance Change) - Fallback
                            if (!senderOwner && tx.meta.preTokenBalances) {
                                // Helper to find balance change for an account index
                                const getBalanceChange = (index) => {
                                    const pre = tx.meta.preTokenBalances?.find(b => b.accountIndex === index);
                                    const post = tx.meta.postTokenBalances?.find(b => b.accountIndex === index);
                                    if (!pre || !post) return 0;
                                    return Number(post.uiTokenAmount.amount) - Number(pre.uiTokenAmount.amount);
                                };

                                for (const pre of tx.meta.preTokenBalances) {
                                    if (pre.mint === mintAddressString) {
                                        const change = getBalanceChange(pre.accountIndex);
                                        if (change < 0) {
                                            senderOwner = pre.owner;
                                            break;
                                        }
                                    }
                                }
                            }

                            // Known Treasury Addresses
                            const KNOWN_TREASURY_ADDRESSES = [
                                TREASURY_ADDRESS
                            ];

                            if (type === 'Buy') {
                                // Already identified as Buy via mintTo
                            } else if (KNOWN_TREASURY_ADDRESSES.includes(senderOwner)) {
                                type = 'Buy';
                            } else {
                                type = 'Received';
                                otherParty = senderOwner;
                            }
                        } else if (diff < 0) {
                            // Sent
                            amount = Math.abs(diff) / 100;
                            isOutgoing = true;
                            type = 'Sent';

                            // Find recipient
                            const recipientBalance = tx.meta.postTokenBalances?.find(b => b.mint === mintAddressString && b.owner !== publicKey.toBase58());
                            if (recipientBalance) {
                                otherParty = recipientBalance.owner;
                            }
                        } else {
                            type = 'Interaction';
                            amount = 0;
                            isOutgoing = true;
                        }

                        if (otherParty) {
                            otherPartyAddresses.add(otherParty);
                        }

                        tempHistory.push({
                            signature,
                            date,
                            type,
                            amount,
                            isOutgoing,
                            otherParty
                        });

                    } catch (innerErr) {
                        console.error(`Failed to fetch tx ${sig.signature}:`, innerErr);
                    }
                }

                // Batch fetch names for other parties
                const addressToNameMap = {};
                if (otherPartyAddresses.size > 0) {
                    try {
                        const addresses = Array.from(otherPartyAddresses);
                        // Firestore 'in' query supports up to 10
                        const chunks = [];
                        for (let i = 0; i < addresses.length; i += 10) {
                            chunks.push(addresses.slice(i, i + 10));
                        }

                        for (const chunk of chunks) {
                            const q = query(collection(db, "users"), where("walletAddress", "in", chunk));
                            const querySnapshot = await getDocs(q);
                            querySnapshot.forEach((doc) => {
                                const data = doc.data();
                                addressToNameMap[data.walletAddress] = { name: data.name, studentId: data.studentId };
                            });
                        }
                    } catch (err) {
                        console.error("Error fetching user names:", err);
                    }
                }

                // Finalize history with names
                const finalHistory = tempHistory.map(item => {
                    let displayType = item.type;
                    let description = item.date;

                    let otherPartyName = 'Unknown';
                    let otherPartyStudentId = null;

                    if (item.type === 'Buy') {
                        displayType = 'Buy POINT';
                        description = `Charged • ${item.date}`;
                    } else if (item.type === 'Sent') {
                        const info = addressToNameMap[item.otherParty];
                        otherPartyName = info?.name || (item.otherParty ? `${item.otherParty.slice(0, 4)}...${item.otherParty.slice(-4)}` : 'Unknown');
                        otherPartyStudentId = info?.studentId;
                        displayType = 'To ';
                    } else if (item.type === 'Received') {
                        const info = addressToNameMap[item.otherParty];
                        otherPartyName = info?.name || (item.otherParty ? `${item.otherParty.slice(0, 4)}...${item.otherParty.slice(-4)}` : 'Unknown');
                        otherPartyStudentId = info?.studentId;
                        displayType = 'From ';
                    }

                    return {
                        ...item,
                        displayType,
                        otherPartyName,
                        otherPartyStudentId,
                        description
                    };
                });

                setHistory(finalHistory);
            } else {
                setHistory([]);
            }

        } catch (e) {
            console.error('Error fetching data:', e);
            if (e.message.includes('429')) {
                setError("Network busy. Retrying later.");
            } else {
                setError("Failed to fetch data.");
            }
        } finally {
            setLoading(false);
            setHistoryLoading(false);
            setTimeout(() => {
                isFetching.current = false;
            }, 1000);
        }
    }, [publicKey, connection]);

    // Initial fetch only
    useEffect(() => {
        if (publicKey && !isFetching.current) {
            fetchData();
        }
    }, [publicKey]);

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-postech-600 to-orange-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-postech-100 font-medium mb-1">Total Balance</p>
                            <h1 className="text-5xl font-bold tracking-tight">
                                {loading ? '...' : balance.toLocaleString()} <span className="text-2xl font-normal text-postech-200">P</span>
                            </h1>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-postech-600 font-bold">P</div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/buy" className="flex-1 bg-white text-postech-600 py-3 rounded-xl font-bold text-center hover:bg-postech-50 transition-colors flex items-center justify-center gap-2">
                            <Plus size={20} />
                            Buy
                        </Link>
                        <Link to="/payment" className="flex-1 bg-white text-postech-600 py-3 rounded-xl font-bold text-center hover:bg-postech-50 transition-colors flex items-center justify-center gap-2">
                            <ScanBarcode size={20} />
                            My Code
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
                <Link to="/send" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-postech-100 rounded-full flex items-center justify-center text-postech-600">
                        <ArrowUpRight size={20} />
                    </div>
                    <span className="font-medium text-gray-700 text-xs">Send</span>
                </Link>
                <Link to="/request" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <ArrowDownLeft size={20} />
                    </div>
                    <span className="font-medium text-gray-700 text-xs">Request</span>
                </Link>
                <Link to="/split" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Calculator size={20} />
                    </div>
                    <span className="font-medium text-gray-700 text-xs">Split Bill</span>
                </Link>
            </div>

            {/* Pending Requests & Chats */}
            {(pendingRequests.length > 0 || pendingSettlements.length > 0) && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Pending Chats</h3>
                    <div className="space-y-3">
                        {/* Direct Requests */}
                        {pendingRequests.map((req, i) => (
                            <div key={`req-${i}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                        <ArrowDownLeft size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{req.fromName || 'Someone'} requested</p>
                                        <p className="text-xs text-gray-400">{req.createdAt?.toDate().toLocaleDateString() || 'Today'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">{req.amount.toLocaleString()} P</span>
                                    <button
                                        onClick={() => navigate('/send', {
                                            state: {
                                                contact: { name: req.fromName || 'Unknown', address: req.from },
                                                amount: req.amount,
                                                requestId: req.id
                                            }
                                        })}
                                        className="bg-postech-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-postech-700 transition-colors"
                                    >
                                        Pay
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Pending Settlements */}
                        {pendingSettlements.map((item, i) => (
                            <div key={`set-${i}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 relative">
                                        <Calculator size={20} />
                                        {isChatUnread(item, auth.currentUser?.uid) && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{item.chatTitle}</p>
                                        <p className="text-xs text-gray-400">Chat</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">{item.myAmount.toLocaleString()} P</span>
                                    <button
                                        onClick={() => navigate(`/chat/${item.chatId}`, { state: { from: 'dashboard' } })}
                                        className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                                    >
                                        Chat
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* [NEW] Active Chats (Quick Access) */}
            {activeSettlementChats.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Active Chats</h3>
                    <div className="space-y-3">
                        {activeSettlementChats.map((chat, i) => (
                            <div key={`active-${i}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 relative">
                                        <Calculator size={20} />
                                        {isChatUnread(chat, auth.currentUser?.uid) && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{chat.title}</p>
                                        <p className="text-xs text-gray-400">Ongoing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/settlements/${chat.id}`, { state: { from: 'dashboard' } })}
                                    className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Go
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* [NEW] Sent Requests */}
            {sentRequests.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Sent Requests</h3>
                    <div className="space-y-3">
                        {sentRequests.map((req, i) => (
                            <div key={`sent-${i}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">To {req.toName || 'Someone'}</p>
                                        <p className={`text-xs ${req.status === 'completed' ? 'text-green-500 font-bold' : 'text-orange-500'}`}>
                                            {req.status === 'completed' ? 'Completed' : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">{req.amount.toLocaleString()} P</span>
                                    {req.status === 'pending' && (
                                        <button
                                            onClick={() => handleMarkComplete(req.id)}
                                            className="text-xs text-gray-400 underline hover:text-gray-600"
                                        >
                                            Mark Done
                                        </button>
                                    )}
                                    {req.status === 'completed' && (
                                        <button
                                            onClick={() => handleArchive(req.id)}
                                            className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity (Real) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <div className="flex items-center gap-2">
                        {error && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {error}</span>}
                        <button
                            onClick={fetchData}
                            disabled={historyLoading}
                            className={`p-2 rounded-full transition-colors ${historyLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-postech-600 hover:bg-postech-50'}`}
                        >
                            <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            {historyLoading ? 'Loading...' : 'No transactions yet'}
                        </div>
                    ) : (
                        history.map((tx, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Buy' ? 'bg-blue-100 text-blue-600' : (tx.isOutgoing ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600')}`}>
                                        {tx.type === 'Buy' ? <CreditCard size={20} /> : (tx.isOutgoing ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            {tx.type === 'Buy' ? tx.displayType : (
                                                <span>
                                                    {tx.displayType}
                                                    {tx.otherPartyStudentId ? (
                                                        <button
                                                            onClick={(e) => handleAddFriend(e, tx.otherPartyName, tx.otherPartyStudentId)}
                                                            className="hover:text-postech-600 hover:underline transition-colors"
                                                        >
                                                            {tx.otherPartyName}
                                                        </button>
                                                    ) : (
                                                        tx.otherPartyName
                                                    )}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-400">{tx.description}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${tx.isOutgoing ? 'text-gray-800' : 'text-green-600'}`}>
                                    {tx.isOutgoing ? '-' : '+'}{tx.amount.toLocaleString()} P
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
