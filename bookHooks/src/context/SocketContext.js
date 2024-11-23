import React, { createContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { ipv4 } from '../assets/others/constants';

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const socketConnection = io(`${ipv4}`);
        socketRef.current = socketConnection;
        setSocket(socketConnection);

        // Cleanup on unmount
        return () => {
            socketConnection.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
