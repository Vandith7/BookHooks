const mongoose = require("mongoose");

const TrackBookSchema = new mongoose.Schema({
    title: String,
    author: String,
    isbn10: String,
    isbn13: String,
    bookThumbnail: String,
    categories: String,

    readCount: { type: Number, default: 0 },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "BookInfo" },
    BookStatus: {
        type: String,
        enum: ['unhooked', 'to read', 'reading', 'reading again', 'on hold', 'completed', 'dropped', 'wishlisted'],
        default: 'reading'
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    createdAt: { type: Date, default: Date.now },
    startDate: { type: Date },
    pageCount: { type: Number },
    dateCompleted: { type: Date },
    updatedAt: { type: Date, default: Date.now },
    source: { type: String },
    owner: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    review: { type: String }
}, {
    collection: "TrackBookInfo"
});

const TrackBook = mongoose.model("TrackBookInfo", TrackBookSchema);

module.exports = TrackBook;
