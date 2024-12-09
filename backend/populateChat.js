const mongoose = require("mongoose");
const Chat = require("./Schema/ChatDetails");  // Adjust path if necessary
const User = require("./Schema/UserDetails"); // Adjust path if necessary
const Book = require("./Schema/BookDetails")

require("dotenv").config();

// MongoDB connection URL
const mongoUrl = process.env.MONGO_URL;

mongoose.connect(mongoUrl)
    .then(async () => {
        console.log("Database connected");

        // // Find some users to chat with (ensure these users exist in your database)
        // const user1 = await User.findOne({ userName: "VandithK7" }); // Replace with actual username
        // const user2 = await User.findOne({ userName: "Vk7" }); // Replace with actual username

        // if (!user1 || !user2) {
        //     console.log("Users not found");
        //     return;
        // }

        // // Create a new chat document
        // const newChat = new Chat({
        //     participants: [user1._id, user2._id],
        //     messages: [
        //         { sender: user1._id, text: "Hey, Vk! How's it going?" },
        //         { sender: user2._id, text: "Hi, Van! All good, how about you?" }
        //     ],
        //     lastMessage: { text: "Hi, Van! All good, how about you?", timestamp: new Date() },
        //     unreadCount: {
        //         [user1._id]: 1, // User1 has 1 unread message
        //         [user2._id]: 0  // User2 has no unread messages
        //     }
        // });

        // await newChat.save();
        // console.log("Chat created");
        const result = await Book.updateMany(
            {
                $or: [
                    { returnStatus: { $exists: false } },
                    { returnConfirmation: { $exists: false } },
                ]
            },
            {
                $set: {
                    returnStatus: "none",
                    returnConfirmation: {
                        requesterConfirmed: false,
                        ownerConfirmed: false,
                    },
                },
            }
        );

        console.log(`${result.modifiedCount} books updated.`);

        mongoose.disconnect();  // Disconnect after script finishes
    })
    .catch((error) => {
        console.error("Error connecting to the database:", error);
    });
