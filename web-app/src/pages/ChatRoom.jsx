import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth, storage } from '../utils/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Send, Image as ImageIcon, Loader2, X } from 'lucide-react';
import SettlementStatus from '../components/SettlementStatus';

const ChatRoom = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [chatInfo, setChatInfo] = useState(null);
    const [senderName, setSenderName] = useState("Unknown");
    const [selectedImage, setSelectedImage] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const currentUser = auth.currentUser;

    // Fetch Current User Name
    useEffect(() => {
        const fetchUserName = async () => {
            if (currentUser) {
                const docSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (docSnap.exists()) {
                    setSenderName(docSnap.data().name);
                }
            }
        };
        fetchUserName();
    }, [currentUser]);

    // Fetch Chat Info
    useEffect(() => {
        const fetchChatInfo = async () => {
            const docRef = doc(db, "chats", chatId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setChatInfo(docSnap.data());
            }
        };
        fetchChatInfo();
    }, [chatId]);

    // Listen for Messages
    useEffect(() => {
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [chatId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !uploading) || !currentUser) return;

        try {
            await addDoc(collection(db, "chats", chatId, "messages"), {
                text: newMessage,
                senderId: currentUser.uid,
                senderName: senderName, // Use fetched name
                createdAt: serverTimestamp(),
                type: 'text'
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `chat_images/${chatId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            await addDoc(collection(db, "chats", chatId, "messages"), {
                imageUrl: url,
                senderId: currentUser.uid,
                senderName: senderName, // Use fetched name
                createdAt: serverTimestamp(),
                type: 'image'
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative -mx-4 -mt-4 -mb-4">
            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 text-white p-2">
                        <X size={32} />
                    </button>
                    <img src={selectedImage} alt="Full size" className="max-w-full max-h-full rounded-lg" />
                </div>
            )}

            {/* Header */}
            <div className="fixed top-[61px] left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-4 shadow-sm flex items-center gap-4 z-40 border-b border-gray-100">
                <Link to="/chats" className="text-gray-500 hover:text-gray-800">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="font-bold text-gray-800">
                        {chatInfo ? chatInfo.title : 'Chat Room'}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {chatInfo ? `${chatInfo.participants?.length} participants` : 'Loading...'}
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 pt-24 pb-32 space-y-4 min-h-0">
                {/* Settlement Status Card */}
                {chatInfo?.settlementId && (
                    <SettlementStatus
                        settlementId={chatInfo.settlementId}
                        chatId={chatId}
                        chatStatus={chatInfo.status}
                    />
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.uid;
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-4">
                                <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                                    {msg.text}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-3 ${isMe ? 'bg-postech-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-sm rounded-tl-none'}`}>
                                {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.senderName}</p>}

                                {msg.type === 'image' ? (
                                    <img
                                        src={msg.imageUrl}
                                        alt="Shared receipt"
                                        className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setSelectedImage(msg.imageUrl)}
                                    />
                                ) : (
                                    <p className="text-sm">{msg.text}</p>
                                )}
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-postech-200' : 'text-gray-400'}`}>
                                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-4 border-t border-gray-100 z-40">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-postech-600 hover:bg-postech-50 rounded-full transition-colors"
                    >
                        <ImageIcon size={24} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:border-postech-500 transition-colors"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !uploading}
                        className="p-3 bg-postech-600 text-white rounded-full hover:bg-postech-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-postech-200"
                    >
                        {uploading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoom;
