const express = require("express");
const Chat = require("../Schema/ChatDetails");
const authenticateToken = require("../middleWare/authMiddleWare");

const router = express.Router();

// Create or Get Chat Between Two Users


router.post("/chat", authenticateToken, async (req, res) => {
    const { recipientId } = req.body;
    const userId = req.userId;

    try {
        // Check if a chat between the participants already exists
        let chat = await Chat.findOne({ participants: { $all: [userId, recipientId] } });

        if (!chat) {
            chat = new Chat({
                participants: [userId, recipientId],
                unreadCount: { [userId]: 0, [recipientId]: 0 },
            });

            await chat.save();
        }

        res.status(200).send({ status: "Success", data: chat });
    } catch (error) {
        console.error("Error creating or retrieving chat:", error);
        res.status(500).send({ status: "Error", message: "Internal server error" });
    }
});

// Send a Message
router.post("/chat/message", authenticateToken, async (req, res) => {
    const { chatId, text } = req.body;
    const userId = req.userId;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).send({ status: "Error", message: "Chat not found" });
        }

        chat.messages.push({ sender: userId, text });
        chat.lastMessage = { text, timestamp: new Date() };
        chat.unreadCount.set(chat.participants.find((id) => id.toString() !== userId), (chat.unreadCount.get(userId) || 0) + 1);

        await chat.save();

        res.status(200).send({ status: "Success", message: "Message sent" });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send({ status: "Error", message: "Internal server error" });
    }
});

// Get Chat Messages
router.get("/chat/:chatId", authenticateToken, async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId).populate("participants", "userName profileImage");

        if (!chat) {
            return res.status(404).send({ status: "Error", message: "Chat not found" });
        }

        res.status(200).send({ status: "Success", data: chat });
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).send({ status: "Error", message: "Internal server error" });
    }
});


// Endpoint to fetch all chats for the user
router.get('/api/chats', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'firstName lastName userName profileImage') // Get user details
            .select('lastMessage participants unreadCount');

        if (!chats.length) {
            return res.status(200).send({ status: 'Success', data: [], message: 'No chats found.' });
        }

        res.status(200).send({ status: 'Success', data: chats });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).send({ status: 'Error', data: 'Internal server error' });
    }
});


module.exports = router;
