import React, { createContext, useState, useContext } from 'react';

// Create the context
const ChatContext = createContext();

// Create a provider to manage joined chats state
export const ChatProvider = ({ children }) => {
    const [joinedChats, setJoinedChats] = useState([]);

    const addChatToJoined = (chatId) => {
        setJoinedChats((prevChats) => [...prevChats, chatId]);
    };

    const removeChatFromJoined = (chatId) => {
        setJoinedChats((prevChats) => prevChats.filter((id) => id !== chatId));
    };

    return (
        <ChatContext.Provider value={{ joinedChats, addChatToJoined, removeChatFromJoined }}>
            {children}
        </ChatContext.Provider>
    );
};

// Custom hook to use the ChatContext
export const useChatContext = () => {
    return useContext(ChatContext);
};
