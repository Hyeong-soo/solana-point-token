import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, User, Calculator, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useWallet } from '../context/WalletContext';

const Split = () => {
    const navigate = useNavigate();
    const { publicKey } = useWallet();

    // Steps: 0 = Select Friends, 1 = Enter Amount & Adjust
    const [step, setStep] = useState(0);

    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [totalAmount, setTotalAmount] = useState('');
    const [shares, setShares] = useState({}); // { friendId: amount }
    const [loading, setLoading] = useState(false);

    // Fetch Friends
    useEffect(() => {
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

    const toggleFriend = (friend) => {
        if (selectedFriends.find(f => f.studentId === friend.studentId)) {
            setSelectedFriends(selectedFriends.filter(f => f.studentId !== friend.studentId));
        } else {
            setSelectedFriends([...selectedFriends, friend]);
        }
    };

    const handleTotalChange = (e) => {
        const total = e.target.value;
        setTotalAmount(total);

        // Distribute equally (including self)
        if (selectedFriends.length > 0 && total) {
            const count = selectedFriends.length + 1; // +1 for Me
            const perPerson = Math.floor(Number(total) / count);
            const newShares = {};
            selectedFriends.forEach(f => {
                newShares[f.studentId] = perPerson;
            });
            // We also track "my share" internally or just derive it
            setShares(newShares);
        }
    };

    const handleShareChange = (studentId, amount) => {
        const newShares = { ...shares, [studentId]: Number(amount) };
        setShares(newShares);

        // Update total: Sum of friends' shares + My share (assumed equal to average of others or remainder? 
        // Actually, if user edits a friend's share, we should probably just update the total to be "Sum of Friends + My Share".
        // But "My Share" is implicit. Let's keep it simple: 
        // If user edits a share, we assume they are customizing. 
        // Let's recalculate Total = Sum(Friends) + (Average of Friends or Remainder).
        // Better: Let's just sum the friends' shares and add an implied "My Share" equal to the average?
        // No, that's confusing. 
        // Let's change the UI to show "My Share" explicitly so the math is clear.
    };

    // Calculate My Share for display
    const myShare = totalAmount ? (Number(totalAmount) - Object.values(shares).reduce((a, b) => a + b, 0)) : 0;

    const handleSplitRequest = async () => {
        if (selectedFriends.length === 0 || !totalAmount) return;

        setLoading(true);
        try {
            let senderName = "Unknown Student";
            if (auth.currentUser) {
                const myProfileSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (myProfileSnap.exists()) {
                    senderName = myProfileSnap.data().name;
                }
            }
            const senderAddress = publicKey ? publicKey.toBase58() : "Unknown";

            // Create requests for each selected friend
            const promises = selectedFriends.map(friend => {
                const amount = shares[friend.studentId];
                if (!amount || amount <= 0) return Promise.resolve();

                return addDoc(collection(db, "requests"), {
                    from: senderAddress,
                    fromName: senderName,
                    to: friend.address,
                    toName: friend.name,
                    amount: Number(amount),
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    type: 'split'
                });
            });

            await Promise.all(promises);

            alert(`Split request sent to ${selectedFriends.length} friends!`);
            navigate('/');
        } catch (error) {
            console.error("Error sending split requests:", error);
            alert("Failed to send requests: " + error.message);
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
                <h2 className="text-xl font-bold text-gray-800">Split Bill</h2>
            </div>

            {step === 0 ? (
                // Step 1: Select Friends
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Select Friends to Split With</h3>
                    <div className="space-y-2 mb-20">
                        {friends.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <p>No friends added yet.</p>
                                <Link to="/friends" className="text-postech-600 font-bold hover:underline">Find Friends</Link>
                            </div>
                        ) : (
                            friends.map((friend, i) => {
                                const isSelected = selectedFriends.find(f => f.studentId === friend.studentId);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => toggleFriend(friend)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-xl shadow-sm border transition-colors ${isSelected ? 'bg-postech-50 border-postech-500 ring-1 ring-postech-500' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isSelected ? 'bg-postech-600 border-postech-600 text-white' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <Check size={14} />}
                                        </div>
                                        <div className="w-10 h-10 bg-postech-100 rounded-full flex items-center justify-center text-postech-600">
                                            <User size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800">{friend.name}</p>
                                            <p className="text-xs text-gray-400 truncate w-48">{friend.studentId}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {selectedFriends.length > 0 && (
                        <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center">
                            <button
                                onClick={() => setStep(1)}
                                className="w-full max-w-md bg-postech-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-postech-700 transition-colors shadow-lg shadow-postech-200"
                            >
                                Next ({selectedFriends.length})
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // Step 2: Enter Amount
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={totalAmount}
                                onChange={handleTotalChange}
                                placeholder="0"
                                className="w-full text-2xl font-bold p-4 border-b-2 border-gray-200 focus:border-postech-600 outline-none bg-transparent transition-colors placeholder-gray-300"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">POINT</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Individual Shares</h3>

                        {/* My Share (Read-only calculation) */}
                        <div className="flex items-center justify-between bg-postech-50 p-3 rounded-xl border border-postech-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-postech-200 rounded-full flex items-center justify-center text-postech-700">
                                    <User size={16} />
                                </div>
                                <span className="font-bold text-postech-900 text-sm">Me (You)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-postech-900">{myShare.toLocaleString()}</span>
                                <span className="text-xs text-postech-400">P</span>
                            </div>
                        </div>

                        {selectedFriends.map((friend) => (
                            <div key={friend.studentId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                        <User size={16} />
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm">{friend.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={shares[friend.studentId] || ''}
                                        onChange={(e) => handleShareChange(friend.studentId, e.target.value)}
                                        className="w-24 text-right font-bold bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-postech-500 outline-none"
                                    />
                                    <span className="text-xs text-gray-400">P</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center gap-3">
                        <div className="w-full max-w-md flex gap-3">
                            <button
                                onClick={() => setStep(0)}
                                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSplitRequest}
                                disabled={loading || !totalAmount}
                                className="flex-[2] bg-postech-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-postech-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-postech-200"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Send Requests'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Split;
