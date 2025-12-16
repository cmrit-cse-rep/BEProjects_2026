
import mongoose from 'mongoose';

const BudgetConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  month: { type: String, required: true }, // e.g., "2025-09"
  income: { type: Number, default: 0 },
  caps: { type: Map, of: Number, default: {} }, // category -> cap
}, { timestamps: true });

export default mongoose.model('BudgetConfig', BudgetConfigSchema);
