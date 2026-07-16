const { Server } = require('socket.io');
const Message = require('./models/Message');

let io;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // ✅ Match exactly what server.js allows — all three ports
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== 'undefined') {
      onlineUsers.set(userId, socket.id);

      // Tell everyone this user is now online
      io.emit('user_online', userId);

      // Send full online list to the newly connected user
      socket.emit('online_users_list', Array.from(onlineUsers.keys()));

      console.log(`✅ Online: ${userId}`);
      console.log(`🗺 Online users:`, Array.from(onlineUsers.keys()));
    }

    // When user opens chat page — send fresh online list to entire room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`🚪 ${userId} joined room: ${roomId}`);

      // ✅ Both users in the room get the fresh online list
      io.to(roomId).emit('online_users_list', Array.from(onlineUsers.keys()));
    });

    // Send message — save to DB then emit to room
    socket.on('send_message', async (data) => {
      try {
        const saved = await Message.create({
          roomId:     data.roomId,
          senderId:   data.senderId,
          receiverId: data.receiverId,
          text:       data.text,
        });

        const populated = await Message.findById(saved._id)
          .populate('senderId',   'name photoUrl')
          .populate('receiverId', 'name photoUrl');

        io.to(data.roomId).emit('receive_message', populated);

        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message_notification', {
            roomId:     data.roomId,
            senderId:   data.senderId,
            senderName: populated.senderId.name,
            text:       data.text.length > 40
                          ? data.text.substring(0, 40) + '...'
                          : data.text,
          });
        }

        console.log(`💬 [${data.roomId}]: ${data.text}`);
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('message_error', { error: 'Message failed' });
      }
    });

    // Mark seen
    socket.on('mark_seen', async ({ roomId, readerId }) => {
      try {
        await Message.updateMany(
          { roomId, receiverId: readerId, seen: false },
          { seen: true, seenAt: new Date() }
        );
        io.to(roomId).emit('messages_seen', { roomId, readerId });
        console.log(`👁 Seen in room: ${roomId} by ${readerId}`);
      } catch (err) {
        console.error('mark_seen error:', err.message);
      }
    });

    // Delete message
    socket.on('delete_message', async ({ roomId, messageId }) => {
      try {
        await Message.findByIdAndDelete(messageId);
        io.to(roomId).emit('message_deleted', { messageId });
        console.log(`🗑 Deleted: ${messageId}`);
      } catch (err) {
        console.error('delete_message error:', err.message);
      }
    });

    // Flatmate request notification
    socket.on('request_notification', ({ toUserId, notification }) => {
      const sid = onlineUsers.get(toUserId);
      if (sid) io.to(sid).emit('incoming_request', notification);
    });

    // Disconnect — remove from Map and broadcast offline
    socket.on('disconnect', () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit('user_offline', userId);
        console.log(`❌ Offline: ${userId}`);
        console.log(`🗺 Online users:`, Array.from(onlineUsers.keys()));
      }
    });
  });
};

const getIo = () => {
  if (!io) throw new Error('Socket not initialized');
  return io;
};

const getOnlineUsers = () => onlineUsers;

module.exports = { initSocket, getIo, getOnlineUsers };