import React, { useState } from 'react';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { db, auth } from '../utils/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useWallet } from '../context/WalletContext';

const Request = () => {
    const navigate = useNavigate();
    const { publicKey } = useWallet();
    const [selectedContact, setSelectedContact] = useState(null);
    const [amount, setAmount] = useState('');
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

    const handleRequest = async (e) => {
        e.preventDefault();
        if (!selectedContact || !amount) return;

        setLoading(true);


        try {


            // Create a promise that rejects after 5 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Check your network or Firebase Console.")), 5000)
            );

            // Resolve sender name
            const senderAddress = publicKey ? publicKey.toBase58() : "Unknown";
            // Use userProfile from context if available, otherwise fallback
            // We can't easily access userProfile here without importing it from context, 
            // but we can rely on the fact that we are logged in.
            // For now, let's just use "Me" or fetch from auth.currentUser if we stored name there.
            // Better: use the name from the wallet context if we exposed it.
            // Let's assume we can get it from the sender's profile in Firestore if needed, 
            // but for speed, let's just send the address and let the receiver resolve it or send a generic name.
            // Actually, we can fetch our own profile.

            let senderName = "Unknown Student";
            if (auth.currentUser) {
                const myProfileSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (myProfileSnap.exists()) {
                    senderName = myProfileSnap.data().name;
                }
            }

            const addDocPromise = addDoc(collection(db, "requests"), {
                from: senderAddress,
                fromUid: auth.currentUser.uid, // [NEW] Store Sender UID
                fromName: senderName,
                to: selectedContact.address,
                toUid: selectedContact.uid, // [NEW] Store Recipient UID
                toName: selectedContact.name,
                amount: Number(amount),
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // Race between addDoc and timeout
            await Promise.race([addDocPromise, timeoutPromise]);


            alert(`Requested ${Number(amount).toLocaleString()} POINT from ${selectedContact.name}!`);
            navigate('/');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to send request: " + error.message);
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
                <h2 className="text-xl font-bold text-gray-800">Request POINT</h2>
            </div>



            {!selectedContact ? (
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Select Friend</h3>
                    <div className="space-y-2">
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
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
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
                </div>
            ) : (
                <form onSubmit={handleRequest} className="space-y-6">
                    <div className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-orange-500 font-bold">From</p>
                                <p className="font-bold text-orange-900">{selectedContact.name}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedContact(null)}
                            className="text-xs text-orange-500 underline"
                        >
                            Change
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount to request</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full text-2xl font-bold p-4 border-b-2 border-gray-200 focus:border-orange-600 outline-none bg-transparent transition-colors placeholder-gray-300"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">POINT</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !amount}
                        className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Request Now'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default Request;
