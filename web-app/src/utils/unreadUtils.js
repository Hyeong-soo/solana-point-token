export const isChatUnread = (chat, currentUserId) => {
    if (!chat || !currentUserId) return false;
    if (!chat.lastMessageAt) return false;

    // If I sent the last message, it's read
    if (chat.lastSenderId === currentUserId) return false;

    // Get my last read timestamp from the chat document
    const myReadTime = chat.readStatus?.[currentUserId];

    // If I haven't read it yet (no timestamp), it's unread
    if (!myReadTime) return true;

    // Compare timestamps
    // Firestore timestamps need to be converted to millis for comparison
    const messageTime = chat.lastMessageAt.toDate().getTime();
    const readTime = myReadTime.toDate().getTime();

    return messageTime > readTime;
};
