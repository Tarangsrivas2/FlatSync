const Message = require('../models/Message');

// GET /api/messages/:roomId — fetch chat history
// Hides messages deleted by the requesting user
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id.toString();

    const all = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .populate('senderId',   'name photoUrl')
      .populate('receiverId', 'name photoUrl');

    // Filter out messages this user deleted from their side
    const filtered = all.filter(msg => {
      const isSender   = msg.senderId?._id?.toString() === userId;
      const isReceiver = msg.receiverId?._id?.toString() === userId;
      if (isSender   && msg.deletedBySender)   return false;
      if (isReceiver && msg.deletedByReceiver) return false;
      return true;
    });

    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
};

// PUT /api/messages/:messageId/seen — mark all messages in room as seen
const markAsSeen = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user._id;

    // Mark all unseen messages sent TO this user in this room as seen
    await Message.updateMany(
      { roomId, receiverId: userId, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark seen', error: err.message });
  }
};

// DELETE /api/messages/:messageId — soft delete for requesting user
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const isSender   = msg.senderId.toString()   === userId;
    const isReceiver = msg.receiverId.toString()  === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isSender)   msg.deletedBySender   = true;
    if (isReceiver) msg.deletedByReceiver = true;

    await msg.save();

    res.status(200).json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete message', error: err.message });
  }
};

module.exports = { getMessages, markAsSeen, deleteMessage };