const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    presentClasses: Number,
    totalClasses: Number,
    imageUploaded: Boolean,
    presentClassesDates: [Date]
});
const User = mongoose.model("User", userSchema);

module.exports = User;