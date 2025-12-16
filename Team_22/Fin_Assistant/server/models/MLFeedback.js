import mongoose from 'mongoose';

const MLFeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  text: { type: String, required: true },
  label: { type: String, required: true },
  amount: { type: Number, default: null },
  merchant: { type: String, default: '' },
  previousCategory: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('MLFeedback', MLFeedbackSchema);


