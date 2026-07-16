import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket]                     = useState(null);
  const [notifications, setNotifications]       = useState(0);
  const [msgNotifications, setMsgNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {

      // ✅ Fixed to connect to backend server on port 5000
      const newSocket = io('http://localhost:5001', {
        query: { userId: user._id },
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket error:', err.message);
      });

      // Flatmate request notification
      newSocket.on('incoming_request', () => {
        setNotifications(prev => prev + 1);
        toast('New Flatmate Request!', { icon: '🔔' });
      });

      // ✅ FIXED — only show toast if NOT in that specific sender's chat
      newSocket.on('new_message_notification', (data) => {
        const isOnThisChat = window.location.pathname.includes(`/chat/${data.senderId}`);
        if (!isOnThisChat) {
          toast(`💬 ${data.senderName}: ${data.text}`, {
            duration: 4000,
            style: {
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-accent)',
            },
          });
          setMsgNotifications(prev => [...prev, data]);
        }
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [isAuthenticated, user]);

  const clearMsgNotifications = () => setMsgNotifications([]);

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      setNotifications,
      msgNotifications,
      clearMsgNotifications,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);