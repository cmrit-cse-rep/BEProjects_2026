// scripts/seedSubject.js
// Usage:
// node scripts/seedSubject.js --subject "Machine Learning" --file data/ml_subject.md
// or
// node scripts/seedSubject.js --subject "Name" --desc "Long description..."

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

  const argv = require('process').argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--subject') args.subject = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--desc') args.desc = argv[++i];
  }

  if (!args.subject) {
    console.error('Please provide --subject "Subject Name"');
    process.exit(1);
  }

  let description = '';
  if (args.file) {
    const filePath = path.isAbsolute(args.file) ? args.file : path.join(__dirname, '..', args.file);
    try {
      description = await fs.readFile(filePath, 'utf8');
    } catch (e) {
      console.error('Failed to read file:', filePath, e.message);
      process.exit(1);
    }
  } else if (args.desc) {
    description = args.desc;
  } else {
    console.error('Please provide either --file path or --desc "description"');
    process.exit(1);
  }

  await mongoose.connect(MONGO, { });
  const Content = require('../models/Content');

  // Build transcript and chunks
  const transcript = description;
  let chunks = [];
  // split into paragraphs first
  const paras = transcript.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paras.length > 1) chunks = paras;
  else {
    // split into sentences
    chunks = transcript.split(/(?<=[\.\?\!])\s+/).map(s => s.trim()).filter(Boolean);
  }

  const title = args.subject;
  const doc = {
    subject: args.subject,
    title,
    description,
    transcript,
    chunks,
    source: 'seed_manual'
  };

  try {
    const filter = { subject: args.subject, title };
    const update = { $set: doc };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    await Content.findOneAndUpdate(filter, update, opts);
    console.log(`Upserted subject: ${args.subject} (chunks: ${chunks.length})`);
  } catch (e) {
    console.error('Failed to upsert subject:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
