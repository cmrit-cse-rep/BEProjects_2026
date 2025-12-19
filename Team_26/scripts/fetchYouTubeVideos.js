const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchEducationalVideos(query) {
  const apiKey = 'YOUR_API_KEY'; // 🔑 Replace this with your real YouTube API key

  const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      q: query,
      maxResults: 30,
      type: 'video',
      key: apiKey
    }
  });

  const videos = res.data.items.map(item => ({
    title: item.snippet.title,
    description: item.snippet.description,
    image: item.snippet.thumbnails.high.url,
    link: `https://www.youtube.com/watch?v=${item.id.videoId}`
  }));

  const outputPath = path.join(__dirname, '..', 'data', 'sampleContent.json');
  fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));

  console.log('✅ Video data saved to data/sampleContent.json');
}

fetchEducationalVideos('data structures and algorithms');
