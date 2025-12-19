// scripts/seedSubjectsContent.js
// Upsert subject content documents from data/subjectContents.json into the Content collection

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

async function main() {
  const MONGO = process.env.MONGO_URI;
  if (!MONGO) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const Content = require('../models/Content');

  const filePath = path.join(__dirname, '..', 'data', 'subjectContents.json');
  const raw = await fs.readFile(filePath, 'utf8');
  const docs = JSON.parse(raw);

  for (const doc of docs) {
    try {
      // Ensure a title exists (use subject as title when missing)
      const title = doc.title || doc.subject || 'Untitled';

      // Build a richer document: copy description to transcript if not provided
      const transcript = doc.transcript || doc.description || '';

      // Create simple chunks by splitting on double-newlines or sentence-like breaks
      let chunks = [];
      if (doc.chunks && Array.isArray(doc.chunks) && doc.chunks.length) {
        chunks = doc.chunks;
      } else if (transcript) {
        // split by paragraph first
        const paras = transcript.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
        if (paras.length > 1) {
          chunks = paras;
        } else {
          // fallback: split into sentences (simple punctuation-based)
          chunks = transcript.split(/(?<=[\.\?\!])\s+/).map(s => s.trim()).filter(Boolean);
        }
      }

      // Upsert by subject + title
      const filter = { subject: doc.subject, title };
      const update = { $set: Object.assign({}, doc, { title, transcript, chunks, source: doc.source || 'seed' }) };
      const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
      await Content.findOneAndUpdate(filter, update, opts);
      console.log(`Upserted content for subject: ${doc.subject} (title: ${title}, chunks: ${chunks.length})`);
    } catch (e) {
      console.error('Failed to upsert', doc.subject, e.message);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete');
}

main().catch(err => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
