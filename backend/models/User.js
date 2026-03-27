import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    display_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firebase_uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    telegram_id: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    telegram_username: {
      type: String,
      trim: true,
    },
    telegram_linked_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const User = mongoose.model('User', userSchema);
