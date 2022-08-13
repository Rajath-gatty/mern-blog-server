const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        posts: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "Post",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);