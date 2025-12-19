// Seed Content collection from data/sampleContent.json
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Content = require('../models/Content');

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/majorproject';
  await mongoose.connect(mongoUri, { autoIndex: true });

  const dataPath = path.join(__dirname, '..', 'data', 'sampleContent.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found at ${dataPath}`);
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  /** @type {Array<{subject:string,title:string,description:string,image:string,link:string,tags:string[]}>} */
  const items = JSON.parse(raw);

  // Use bulk upsert keyed by unique video link to avoid duplicates
  const ops = items.map((item) => ({
    updateOne: {
      filter: { link: item.link },
      update: {
        $setOnInsert: {
          subject: item.subject || 'General',
          title: item.title,
          description: item.description,
          image: item.image,
          link: item.link,
          tags: item.tags || [],
        },
      },
      upsert: true,
    },
  }));

  const result = await Content.bulkWrite(ops, { ordered: false });

  // Count totals by subject for quick visibility
  const counts = await Content.aggregate([
    { $group: { _id: '$subject', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log('✅ Seeding complete');
  console.log(`Upserts: ${result.upsertedCount ?? 0}, Modified: ${result.modifiedCount ?? 0}`);
  console.table(counts.map((c) => ({ subject: c._id, count: c.count })));
}

main()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });


