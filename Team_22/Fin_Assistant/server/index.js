
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fetch from 'node-fetch';
dotenv.config();

import authRouter from './routes/auth.js';
import txRouter from './routes/transactions.js';
import budgetRouter from './routes/budgets.js';
import chatRouter from './routes/chat.js';
import pdfRouter from './routes/pdf.js';
import reportsRouter from './routes/reports.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fin_assistant';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

app.get('/', (_, res) => res.json({ ok: true, service: 'fin-assistant-api' }));

app.use('/api/auth', authRouter);
app.use('/api/transactions', txRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/chat', chatRouter);
app.use('/api/transactions', pdfRouter);
app.use('/api/reports', reportsRouter);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err?.message || 'Server error' });
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

// Nightly cron: retrain ML and regenerate budgets for active users
cron.schedule('0 2 * * *', async () => {
  try {
    const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    await fetch(`${ML_URL}/train`, { method: 'POST', timeout: 5000 });
    // Regenerate budgets for users who have a budget config or income
    const User = (await import('./models/User.js')).default;
    const BudgetConfig = (await import('./models/BudgetConfig.js')).default;
    const { monthKey } = await import('./utils/nlp.js');
    const { generateDynamicBudget } = await import('./services/budget.js');
    const month = monthKey.default ? monthKey.default() : monthKey();
    const users = await User.find({});
    for (const u of users) {
      if (!u.monthlyIncome) continue;
      const caps = await generateDynamicBudget(u._id, u.monthlyIncome, month);
      await BudgetConfig.findOneAndUpdate(
        { userId: u._id, month },
        { userId: u._id, month, income: u.monthlyIncome, caps },
        { upsert: true, new: true }
      );
    }
    console.log('[CRON] Retrain + Budgets regenerated');
  } catch (e) {
    console.error('[CRON] error:', e?.message || e);
  }
});
