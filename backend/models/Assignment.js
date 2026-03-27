import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    raw_content: {
      type: String,
      required: true,
    },
    cleaned_content: {
      type: String,
      required: true,
    },
    source_type: {
      type: String,
      enum: ['text', 'pdf', 'image'],
      required: true,
    },
    source_file_name: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'submitted'],
      default: 'queued',
      index: true,
    },
    submitted_at: {
      type: Date,
      default: null,
    },
    reminder_last_sent_at: {
      type: Date,
      default: null,
    },
    error_message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
