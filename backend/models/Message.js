const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        // Match reference
        match: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Match",
            required: true,
        },

        // Sender (can be seeker or hirer)
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Receiver
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Message content
        text: {
            type: String,
            required: true,
        },

        // Attachment (optional)
        attachmentUrl: { type: String },
        attachmentType: { type: String }, // "pdf", "image", "document"

        // Read status
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: { type: Date },

        // Message type
        type: {
            type: String,
            enum: ["text", "system", "interview_link", "offer"],
            default: "text",
        },

        // Metadata for system messages
        metadata: {
            interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
            actionType: { type: String }, // "interview_scheduled", "offer_sent", etc.
        },
    },
    { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ match: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);
