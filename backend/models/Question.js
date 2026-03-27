import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    question_text: {
      type: String,
      required: true,
    },
    ai_solution: {
      type: String,
      default: '',
    },
    hash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['queued', 'completed'],
      default: 'queued',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const Question = mongoose.model('Question', questionSchema);

