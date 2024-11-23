const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" },
        text: { type: String },
        timestamp: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt fields
    }
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
        lastMessage: { type: MessageSchema, default: {} },
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

ChatSchema.pre('save', function (next) {
    if (this.messages && this.messages.length > 0) {
        // Get the last message from the messages array
        const lastMsg = this.messages[this.messages.length - 1];

        // Make sure all required fields of lastMessage (e.g., sender) are populated
        if (lastMsg && lastMsg.sender) {
            this.lastMessage = lastMsg; // Set lastMessage with the full message
        } else {
            // If any required fields are missing, set lastMessage to a default empty object
            this.lastMessage = {};
        }
    }
    next();
});


const Chat = mongoose.model("Chat", ChatSchema);
const Message = mongoose.model("Message", MessageSchema);

module.exports = Chat;
