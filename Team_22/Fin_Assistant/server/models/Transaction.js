
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  merchant: { type: String, default: '' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['expense', 'income'], default: 'expense' },
  paymentMode: { type: String, enum: ['UPI','Card','Cash','NetBanking','Wallet','Other'], default: 'UPI' },
  category: { type: String, default: 'Uncategorized' },
  subcategory: { type: String, default: '' },
  confidence: { type: Number, default: 0.5 },
  raw: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('Transaction', TransactionSchema);
