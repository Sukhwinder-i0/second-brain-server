import mongoose, { Schema } from "mongoose";

const contentSchema = new Schema(
    {
        title: String,
        link: String,
        tags: {
            type: mongoose.Types.ObjectId,
            ref: 'Tag'
        },
        userId: {
            type:  mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }, {timestamps: true}
)

export const Content = mongoose.model("content", contentSchema)