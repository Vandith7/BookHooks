const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema(
    {
        firstName: String,
        lastName: String,
        userName: { type: String, unique: true },
        email: { type: String, unique: true },
        contactNumber: { type: String, unique: true },
        bio: String,
        password: String,
        profileImage: String,
        joiningDate: { type: Date, default: Date.now },
        buddies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "UserInfo",
                required: false,
            },
        ],
        buddyRequests: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true }, // Reference to user
                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected"],
                    default: "pending",
                },
                direction: { type: String, enum: ["sent", "received"], required: true },
                sentAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        collection: "UserInfo",
    }
);

const User = mongoose.model("UserInfo", UserDetailsSchema);

module.exports = User;
