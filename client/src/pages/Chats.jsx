import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosInstance';
import ChatWindow from '../components/Chat/ChatWindow';
import ChatInput from '../components/Chat/ChatInput';
import { MessageSquare, ArrowLeft } from 'lucide-react';

const getRoomId = (id1, id2) => [id1, id2].sort().join('_');

const Chats = () => {
  const { receiverId } = useParams();
  const { user } = useAuth();
  const { socket, msgNotifications, clearMsgNotifications } = useSocket();
  const navigate = useNavigate();

  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);

  const roomId = user && receiverId ? getRoomId(user._id, receiverId) : null;

  // 1. Fetch Connections
  useEffect(() => {
    if (!user) return;
    const fetchConnections = async () => {
      try {
        const [incomingRes, outgoingRes] = await Promise.all([
          api.get('/requests/incoming'),
          api.get('/requests/outgoing')
        ]);

        const incoming = incomingRes.data.filter(r => r.status === 'accepted');
        const outgoing = outgoingRes.data.filter(r => r.status === 'accepted');

        const seen = new Set();
        const merged = [];

        incoming.forEach(r => {
          const otherId = r.fromUser._id;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            merged.push(r.fromUser);
          }
        });

        outgoing.forEach(r => {
          const otherId = r.toUser._id;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            merged.push(r.toUser);
          }
        });

        setConnections(merged);
      } catch (err) {
        console.error('Failed to fetch connections:', err);
      } finally {
        setLoadingConnections(false);
      }
    };
    fetchConnections();
  }, [user]);

  // 2. Chat Logic (when a receiverId is present)
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    setLoadingChat(true);

    const handleOnlineList = (onlineList) => {
      setOnlineUsers(onlineList);
    };

    const handleUserOnline = (onlineUserId) => {
      setOnlineUsers(prev => [...new Set([...prev, onlineUserId])]);
    };

    const handleUserOffline = (offlineUserId) => {
      setOnlineUsers(prev => prev.filter(id => id !== offlineUserId));
    };
    //duplicate messages 
    const handleMessage = (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      socket.emit('mark_seen', { roomId, readerId: user._id });
    };

    const handleSeen = ({ readerId }) => {
      if (readerId === user._id?.toString()) return;
      setMessages(prev =>
        prev.map(msg => {
          const msgSenderId = msg.senderId?._id?.toString() ?? msg.senderId?.toString();
          return msgSenderId === user._id?.toString()
            ? { ...msg, seen: true }
            : msg;
        })
      );
    };

    const handleDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    socket.on('online_users_list', handleOnlineList);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('receive_message', handleMessage);
    socket.on('messages_seen', handleSeen);
    socket.on('message_deleted', handleDeleted);

    socket.emit('join_room', roomId);
    socket.emit('mark_seen', { roomId, readerId: user._id });

    // Fetch chat history
    api.get(`/messages/${roomId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Messages fetch failed:', err))
      .finally(() => setLoadingChat(false));

    // Fetch receiver profile
    api.get(`/users/${receiverId}`)
      .then(res => setReceiver(res.data))
      .catch(err => console.error('Receiver fetch failed:', err));

    return () => {
      socket.off('online_users_list', handleOnlineList);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('receive_message', handleMessage);
      socket.off('messages_seen', handleSeen);
      socket.off('message_deleted', handleDeleted);
    };
  }, [socket, user, roomId, receiverId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim() || !socket || !user || !receiverId) return;
    socket.emit('send_message', {
      roomId,
      senderId: user._id,
      receiverId,
      text: text.trim(),
    });
  };

  const deleteMessage = (messageId) => {
    socket.emit('delete_message', { roomId, messageId });
    setMessages(prev => prev.filter(m => m._id !== messageId));
  };

  const isReceiverOnline = onlineUsers?.some(
    id => id.toString() === receiverId?.toString()
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center flex-1 bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-white">
      {/* Sidebar - Contacts */}
      <div className={`${receiverId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-gray-200 bg-gray-50/50`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Messages
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingConnections ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center p-6 text-gray-500">
              <p>No conversations yet.</p>
              <p className="text-sm mt-2">Connect with others to start chatting!</p>
            </div>
          ) : (
            connections.map(contact => {
              const isActive = contact._id === receiverId;
              const isOnline = onlineUsers?.some(        // prevent online crash 
                id => id.toString() === contact._id.toString()
              );
              // Check if there's an unread notification for this user
              const hasUnread = msgNotifications.some(n => n.senderId === contact._id);

              return (
                <Link
                  key={contact._id}
                  to={`/chats/${contact._id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                      ? 'bg-primary-50 border border-primary-100 shadow-sm'
                      : 'hover:bg-white hover:shadow-sm border border-transparent'
                    }`}
                >
                  <div className="relative">
                    {contact.photoUrl ? (
                      <img src={contact.photoUrl} alt={contact.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {contact.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isActive ? 'text-primary-800' : 'text-gray-800'}`}>
                      {contact.name}
                    </p>
                    <p className={`text-xs truncate ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  {hasUnread && !isActive && (
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!receiverId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-950 relative`}>
        {!receiverId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="w-16 h-16 text-gray-800 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">Your Messages</h3>
            <p className="text-sm mt-2 text-gray-600">Select a conversation from the sidebar to start chatting</p>
          </div>
        ) : loadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-md">
              <button
                onClick={() => navigate('/chats')}
                className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-800 text-gray-400 transition"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="relative">
                {receiver?.photoUrl ? (
                  <img src={receiver.photoUrl} alt={receiver.name} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center text-primary-400 font-bold text-sm border border-primary-800/50">
                    {receiver?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {isReceiverOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
                )}
              </div>

              <div>
                <p className="text-white font-semibold text-sm">
                  {receiver?.name || 'Loading...'}
                </p>
                <p className={`text-xs ${isReceiverOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {isReceiverOnline ? 'Online now' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto">
              <ChatWindow
                messages={messages}
                currentUserId={user._id}
                onDelete={deleteMessage}
              />
              <div ref={bottomRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-gray-900 p-2">
              <ChatInput onSend={sendMessage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chats;
