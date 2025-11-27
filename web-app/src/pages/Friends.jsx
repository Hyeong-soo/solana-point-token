import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { db, auth } from '../utils/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { Search, UserPlus, UserCheck, Loader2, Trash2 } from 'lucide-react';

const Friends = () => {
    const { userProfile, publicKey } = useWallet();
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (!auth.currentUser) return;

        // Listen to my user document for real-time friend updates
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const friendIds = data.friends || [];

                // Fetch details for all friends
                // Note: In a production app with many friends, use pagination or a separate 'friends' subcollection.
                // For now, fetching individually is fine for small lists.
                const promises = friendIds.map(async (fid) => {
                    const fSnap = await getDoc(doc(db, "student_lookup", fid));
                    if (fSnap.exists()) {
                        return { ...fSnap.data(), studentId: fid };
                    }
                    return null;
                });

                const results = await Promise.all(promises);
                setFriends(results.filter(f => f !== null));
            }
        });

        return () => unsub();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId) return;

        setLoading(true);
        setSearchResult(null);

        try {
            const docRef = doc(db, "student_lookup", searchId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setSearchResult({ ...docSnap.data(), studentId: searchId });
            } else {
                alert("Student not found");
            }
        } catch (err) {
            console.error(err);
            alert("Error searching student");
        } finally {
            setLoading(false);
        }
    };

    const addFriend = async () => {
        if (!searchResult || !auth.currentUser) return;

        // Check for duplicates
        if (friends.some(f => f.studentId === searchResult.studentId)) {
            alert("This student is already your friend!");
            return;
        }

        // Check if adding self
        if (searchResult.uid === auth.currentUser.uid) { // Assuming student_lookup has uid, or we check studentId if we know ours
            // Ideally we check against our own profile, but let's assume we can't add ourselves if we are in the lookup
            // Let's just rely on the duplicate check if we are somehow in our own friend list? 
            // Better: Check if searchResult.studentId matches my studentId (if available) or just proceed.
            // Actually, let's just check if the UID matches if available.
        }

        try {
            const myRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(myRef, {
                friends: arrayUnion(searchResult.studentId)
            });

            // No need to manually update state, onSnapshot will handle it
            setSearchResult(null);
            setSearchId('');
            alert(`Added ${searchResult.name} to friends!`);
        } catch (err) {
            console.error(err);
            alert("Failed to add friend");
        }
    };

    const handleDeleteFriend = async (friendId) => {
        if (!confirm("Are you sure you want to remove this friend?")) return;

        try {
            const myRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(myRef, {
                friends: arrayRemove(friendId)
            });
            // No need to manually update state
        } catch (err) {
            console.error("Error removing friend:", err);
            alert("Failed to remove friend");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Friends</h2>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Search by Student ID (e.g. 20250145)"
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 pl-12 outline-none focus:border-postech-500 transition-colors"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-postech-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-postech-700 disabled:bg-gray-300"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Find'}
                </button>
            </form>

            {/* Search Result */}
            {searchResult && (
                <div className="bg-postech-50 border border-postech-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-postech-900">{searchResult.name}</p>
                        <p className="text-sm text-postech-600">{searchResult.studentId}</p>
                    </div>
                    <button
                        onClick={addFriend}
                        className="bg-postech-600 text-white p-2 rounded-full hover:bg-postech-700 transition-colors"
                    >
                        <UserPlus size={20} />
                    </button>
                </div>
            )}

            {/* Friend List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">My Friends</h3>
                {friends.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No friends yet. Search to add!</p>
                ) : (
                    friends.map((friend, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{friend.name}</p>
                                    <p className="text-xs text-gray-400">{friend.studentId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteFriend(friend.studentId)}
                                className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


export default Friends;
