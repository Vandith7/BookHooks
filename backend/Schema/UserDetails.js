const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: { type: String, unique: true },
    email: { type: String, unique: true },
    contactNumber: { type: String, unique: true },
    password: String,
    profileImage: String,
    joiningDate: { type: Date, default: Date.now }
}, {
    collection: "UserInfo"
});

const User = mongoose.model("UserInfo", UserDetailsSchema);

module.exports = User;
