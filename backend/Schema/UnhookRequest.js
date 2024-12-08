const mongoose = require("mongoose");

const UnhookRequestSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: "BookInfo", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "returned"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    unHookedAt: { type: Date }
}, {
    collection: "UnhookRequests"
});

const UnhookRequest = mongoose.model("UnhookRequests", UnhookRequestSchema);

module.exports = UnhookRequest;
