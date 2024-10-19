const mongoose = require("mongoose");

const BookDetailsSchema = new mongoose.Schema({
    title: String,
    author: String,
    description: String,
    condition: String,
    isFetchedFromGoogle: String,
    isbn10: String,
    isbn13: String,
    bookThumbnail: String,
    categories: String,
    images: [String],
    latitude: Number,
    longitude: Number,
    HookStatus: { type: String, enum: ["hooked", "unhooked"], default: "hooked" },
    createdAt: { type: Date, default: Date.now },
    owner: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }
}, {
    collection: "BookInfo"
});

const Book = mongoose.model("BookInfo", BookDetailsSchema);

module.exports = Book;
