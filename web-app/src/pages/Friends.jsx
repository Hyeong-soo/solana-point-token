import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { db, auth } from '../utils/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Search, UserPlus, UserCheck, Loader2 } from 'lucide-react';

const Friends = () => {
    const { userProfile, publicKey } = useWallet();
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (userProfile && userProfile.friends) {
            // In a real app, we'd fetch full friend profiles here
            // For now, we'll just use the list from the profile if it exists
            // Or fetch them if they are stored as IDs
            // Let's assume userProfile.friends contains { name, studentId, address } objects for simplicity
            // But Firestore arrayUnion usually stores simple objects.
            // Let's implement fetching friend details.
            fetchFriendsDetails();
        }
    }, [userProfile]);

    const fetchFriendsDetails = async () => {
        if (!userProfile?.friends) return;
        // This is a naive implementation. In production, use a query with 'in' clause or separate collection
        const friendList = [];
        for (const friendId of userProfile.friends) {
            const docRef = doc(db, "student_lookup", friendId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                friendList.push({ ...snap.data(), studentId: friendId });
            }
        }
        setFriends(friendList);
    };

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
        if (!searchResult || !userProfile) return;

        try {
            // Add to my friend list (stored as Student IDs)
            const myRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(myRef, {
                friends: arrayUnion(searchResult.studentId)
            });

            // Reload profile/friends (Context might need a refresh mechanism, but for now we manually update local state)
            setFriends([...friends, searchResult]);
            setSearchResult(null);
            setSearchId('');
            alert(`Added ${searchResult.name} to friends!`);
        } catch (err) {
            console.error(err);
            alert("Failed to add friend");
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
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{friend.name}</p>
                                <p className="text-xs text-gray-400">{friend.studentId}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


export default Friends;
