import mongoose, { Schema } from "mongoose";

const shareLinkSchema = new Schema({
    hash: String,
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

export const ShareLink = mongoose.model("ShareLink", shareLinkSchema)