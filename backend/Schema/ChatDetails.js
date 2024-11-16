const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
    },
    { _id: false }
);

const ChatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "UserInfo",
                required: true,
            },
        ],
        messages: [MessageSchema],
        lastMessage: {
            text: { type: String },
            timestamp: { type: Date },
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
        collection: "Chats",
    }
);

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
