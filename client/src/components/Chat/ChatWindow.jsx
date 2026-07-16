import { useState } from 'react';
import { Trash2, Check, CheckCheck } from 'lucide-react';

const SeenTick = ({ seen }) => {
  if (seen) return <CheckCheck size={12} className="text-emerald-400" />;
  return <Check size={12} className="text-gray-500" />;
};

const ChatWindow = ({ messages, currentUserId, onDelete }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // messageId waiting confirm

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-500 text-sm">No messages yet. Say hello!</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (msgId) => {
    setConfirmDelete(msgId); // show confirm popup
  };

  const handleConfirmDelete = (msgId) => {
    onDelete(msgId);
    setConfirmDelete(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-950">
      {messages.map((msg) => {
        const senderId = msg.senderId?._id
          ? msg.senderId._id.toString()
          : msg.senderId?.toString();

        const isMine = senderId === currentUserId?.toString();
        const senderPhoto = msg.senderId?.photoUrl;
        const senderName = msg.senderId?.name;
        const time = new Date(msg.createdAt).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit',
        });

        return (
          <div key={msg._id}
            className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setHoveredId(msg._id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Avatar — received only */}
            {!isMine && (
              senderPhoto ? (
                <img src={senderPhoto} alt={senderName}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-5" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300 flex-shrink-0 mb-5">
                  {senderName?.[0]?.toUpperCase() || '?'}
                </div>
              )
            )}

            {/* ✅ Delete button — hover on YOUR messages only */}
            {isMine && hoveredId === msg._id && (
              <button
                onClick={() => handleDeleteClick(msg._id)}
                className="p-1.5 rounded-full bg-gray-800 hover:bg-red-900/50 text-gray-500 hover:text-red-400 transition-all mb-5 flex-shrink-0"
                title="Delete for everyone"
              >
                <Trash2 size={12} />
              </button>
            )}

            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
              {/* Confirm delete popup */}
              {confirmDelete === msg._id && (
                <div className="mb-1 flex items-center gap-2 bg-gray-800 border border-red-500/30 rounded-xl px-3 py-2 text-xs">
                  <span className="text-gray-300">Delete for everyone?</span>
                  <button
                    onClick={() => handleConfirmDelete(msg._id)}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >Yes</button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-gray-500 hover:text-gray-300"
                  >No</button>
                </div>
              )}

              {/* Bubble */}
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isMine
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                }`}>
                {msg.text}
              </div>

              {/* Time + tick */}
              <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[10px] text-gray-600">{time}</span>
                {isMine && <SeenTick seen={msg.seen} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatWindow;