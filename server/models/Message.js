const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId:    { type: String, required: true },
    senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:      { type: String, required: true, trim: true },

    // ✅ SEEN RECEIPT
    seen:   { type: Boolean, default: false },
    seenAt: { type: Date,    default: null  },

    // ✅ SOFT DELETE — each user can delete from their own side
    deletedBySender:   { type: Boolean, default: false },
    deletedByReceiver: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);