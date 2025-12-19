const router = require('express').Router();
const axios = require('axios');
const sentiment = require('sentiment');
const natural = require('natural');
require('dotenv').config();


const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const analyzer = new sentiment();


const advancedSentimentAnalysis = (text) => {
  
  const basicResult = analyzer.analyze(text);
  
  
  const tokens = tokenizer.tokenize(text);
  const stems = tokens.map(token => stemmer.stem(token));
  
  
  const financialPositiveTerms = [
    'growth', 'profit', 'surge', 'rally', 'gain', 'positive', 'bullish',
    'outperform', 'exceed', 'rise', 'uptrend', 'upgrade', 'recovery',
    'opportunity', 'strong', 'robust', 'dividend', 'beat', 'soar'
  ];
  
  // Financial terms enhancement (negative)
  const financialNegativeTerms = [
    'loss', 'decline', 'drop', 'fall', 'bearish', 'downgrade', 'underperform',
    'weak', 'risk', 'debt', 'concern', 'volatile', 'warning', 'miss', 'plunge',
    'tumble', 'crash', 'bankruptcy', 'investigation', 'lawsuit', 'scandal', 'crisis'
  ];
  
  // Enhanced scoring for financial terms
  let additionalScore = 0;
  
  // Check for financial terms in the stems
  stems.forEach(stem => {
    if (financialPositiveTerms.some(term => stem.includes(stemmer.stem(term)))) {
      additionalScore += 1.5;
    }
    if (financialNegativeTerms.some(term => stem.includes(stemmer.stem(term)))) {
      additionalScore -= 1.5;
    }
  });
  
  // Check for specific financial phrases
  const lowerText = text.toLowerCase();
  
  // Check for positive phrases
  if (lowerText.includes('stock surge') || lowerText.includes('stock rally')) additionalScore += 2;
  if (lowerText.includes('earnings beat') || lowerText.includes('exceeds expectations')) additionalScore += 2;
  if (lowerText.includes('bullish outlook') || lowerText.includes('positive guidance')) additionalScore += 2;
  if (lowerText.includes('growth prospects') || lowerText.includes('promising future')) additionalScore += 1.5;
  if (lowerText.includes('dividend increase') || lowerText.includes('share buyback')) additionalScore += 1.5;
  
  // Check for negative phrases
  if (lowerText.includes('stock plunge') || lowerText.includes('stock tumble')) additionalScore -= 2;
  if (lowerText.includes('earnings miss') || lowerText.includes('below expectations')) additionalScore -= 2;
  if (lowerText.includes('bearish outlook') || lowerText.includes('negative guidance')) additionalScore -= 2;
  if (lowerText.includes('cutting jobs') || lowerText.includes('layoffs')) additionalScore -= 1.5;
  if (lowerText.includes('debt concern') || lowerText.includes('financial trouble')) additionalScore -= 1.5;
  
  // Calculate final enhanced score and comparative
  const finalScore = basicResult.score + additionalScore;
  const finalComparative = finalScore / tokens.length;
  
  return {
    score: finalScore,
    comparative: finalComparative,
    tokens: tokens.length,
    details: {
      basicScore: basicResult.score,
      financialContextScore: additionalScore
    }
  };
};

// Helper function to format symbol for Indian stocks
const formatIndianStockSymbol = (symbol) => {
  // Check if it's already formatted
  if (symbol.includes('.NS') || symbol.includes('.BO')) {
    return symbol;
  }
  
  // Default to NSE if not specified
  return `${symbol}.NS`;
};

// Get news and sentiment for an Indian stock
router.get('/:symbol', async (req, res) => {
    try {
        let { symbol } = req.params;
        const { days = 7, exchange } = req.query; // Default to 7 days
        
        // Format symbol for Indian exchanges
        if (exchange === 'BSE') {
            symbol = symbol.includes('.BO') ? symbol : `${symbol}.BO`;
        } else {
            // Default to NSE
            symbol = formatIndianStockSymbol(symbol);
        }
        
        // Get company name without exchange suffix
        const companySymbol = symbol.split('.')[0];
        
        // Calculate date range
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - parseInt(days));
        
        // Format dates for NewsAPI
        const from = fromDate.toISOString().split('T')[0];
        const to = toDate.toISOString().split('T')[0];
        
        // Use NewsAPI to get articles
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey || apiKey === 'your_news_api_key_here') {
            // Return mock data if API key is not set
            return res.json(generateMockIndianNews(companySymbol, parseInt(days)));
        }
        
        // Include 'India' in the search query to focus on Indian stock news
        const newsApiUrl = `https://newsapi.org/v2/everything?q=${companySymbol}+stock+india&from=${from}&to=${to}&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
        
        const response = await axios.get(newsApiUrl);
        
        if (response.data.status !== 'ok') {
            throw new Error('Failed to fetch news from API');
        }
        
        // Process news articles with advanced sentiment analysis
        const news = response.data.articles.map(article => {
            // Combine title and description for better analysis
            const content = article.title + ' ' + (article.description || '');
            const sentimentResult = advancedSentimentAnalysis(content);
            
            return {
                title: article.title,
                description: article.description || 'No description available',
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                sentiment: {
                    score: sentimentResult.score,
                    comparative: sentimentResult.comparative,
                    details: sentimentResult.details
                }
            };
        });
        
        res.json(news);
    } catch (error) {
        console.error('News API Error:', error.message);
        const rawSymbol = (req.params && req.params.symbol) ? req.params.symbol : '';
        const companySymbol = rawSymbol.split('.')[0] || 'MARKET';
        const daysNum = parseInt((req.query && req.query.days) ? req.query.days : 7);
        res.json(generateMockIndianNews(companySymbol, daysNum));
    }
});

// Get general Indian market news
router.get('/', async (req, res) => {
    try {
        const { days = 7 } = req.query; // Default to 7 days
        
        // Calculate date range
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - parseInt(days));
        
        // Format dates for NewsAPI
        const from = fromDate.toISOString().split('T')[0];
        const to = toDate.toISOString().split('T')[0];
        
        // Use NewsAPI to get articles
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey || apiKey === 'your_news_api_key_here') {
            // Return mock data if API key is not set
            return res.json(generateMockIndianMarketNews(parseInt(days)));
        }
        
        const newsApiUrl = `https://newsapi.org/v2/everything?q=Indian+stock+market+NSE+BSE&from=${from}&to=${to}&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
        
        const response = await axios.get(newsApiUrl);
        
        if (response.data.status !== 'ok') {
            throw new Error('Failed to fetch news from API');
        }
        
        // Process news articles with advanced sentiment analysis
        const news = response.data.articles.map(article => {
            // Combine title and description for better analysis
            const content = article.title + ' ' + (article.description || '');
            const sentimentResult = advancedSentimentAnalysis(content);
            
            return {
                title: article.title,
                description: article.description || 'No description available',
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                sentiment: {
                    score: sentimentResult.score,
                    comparative: sentimentResult.comparative,
                    details: sentimentResult.details
                }
            };
        });
        
        res.json(news);
    } catch (error) {
        console.error('News API Error:', error.message);
        const daysNum = parseInt((req.query && req.query.days) ? req.query.days : 7);
        res.json(generateMockIndianMarketNews(daysNum));
    }
});

// Helper function to generate mock news when API key is not available
function generateMockIndianNews(symbol, days) {
    const mockNews = [];
    const today = new Date();
    
    const headlines = [
        `${symbol} Reports Strong Quarterly Earnings in Indian Market`,
        `Analysts Upgrade ${symbol} Stock Rating on NSE`,
        `${symbol} Announces New Business Expansion in India`,
        `Market Reactions to ${symbol}'s Strategic Partnership with Indian Tech Firm`,
        `${symbol} Stock Rises Amid Indian Market Volatility`,
        `Investors Optimistic About ${symbol}'s Future Growth in Indian Market`,
        `${symbol} Expands into New Markets Across India`
    ];
    
    const descriptions = [
        `The company reported earnings that exceeded analyst expectations on the NSE, driving stock price higher.`,
        `Several prominent Indian analysts have upgraded their outlook on the company's performance.`,
        `A new innovative product could open revenue streams for the company in the Indian market.`,
        `The strategic partnership is expected to strengthen the company's position in the Indian market.`,
        `Despite market uncertainty in India, the stock shows resilience and potential for growth.`,
        `Long-term growth prospects in Indian markets look promising based on recent developments.`,
        `Expansion into emerging Indian markets could drive future revenue growth.`
    ];
    
    const sources = [
        'Economic Times', 
        'Business Standard', 
        'Mint', 
        'Financial Express', 
        'Moneycontrol', 
        'CNBC-TV18',
        'Bloomberg Quint'
    ];
    
    // Generate mock news for each day
    for (let i = 0; i < Math.min(days, 7); i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const sentimentScore = Math.random() * 8 - 4; // Random score between -4 and 4
        
        mockNews.push({
            title: headlines[i % headlines.length],
            description: descriptions[i % descriptions.length],
            url: `https://example.com/news/${symbol}/${i}`,
            source: sources[i % sources.length],
            publishedAt: date.toISOString(),
            sentiment: {
                score: sentimentScore,
                comparative: sentimentScore / 10,
                details: {
                    basicScore: sentimentScore * 0.7,
                    financialContextScore: sentimentScore * 0.3
                }
            }
        });
    }
    
    return mockNews;
}

// Helper function to generate mock general Indian market news
function generateMockIndianMarketNews(days) {
    const mockNews = [];
    const today = new Date();
    
    const headlines = [
        'Sensex Climbs 500 Points as Foreign Investors Return to Indian Markets',
        'NSE Nifty Reaches New All-Time High Amid Strong Economic Data',
        'Indian Stock Markets React to RBI Policy Announcement',
        'IT Stocks Lead Gains in BSE Sensex Today',
        'Indian Markets Outperform Global Peers This Quarter',
        'FII Activity Boosts Indian Stock Market Sentiment',
        'Banking and Financial Stocks Rally on NSE'
    ];
    
    const descriptions = [
        'Foreign institutional investors have shown renewed interest in Indian equities, helping the Sensex climb significantly.',
        'Strong corporate earnings and positive economic indicators push the Nifty to record levels.',
        'The Reserve Bank of Indias latest policy decisions have triggered market-wide movements.',
        'Technology companies outperformed other sectors today on the back of strong global cues.',
        'Despite global volatility, Indian market indices have shown remarkable resilience and growth.',
        'Latest data shows substantial foreign investment inflows into Indian equities.',
        'Financial sector stocks gain as banking reforms and credit growth contribute to positive sentiment.'
    ];
    
    const sources = [
        'Economic Times', 
        'Business Standard', 
        'Mint', 
        'Financial Express', 
        'Moneycontrol', 
        'CNBC-TV18',
        'Bloomberg Quint'
    ];
    
    // Generate mock news for each day
    for (let i = 0; i < Math.min(days, 7); i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const sentimentScore = Math.random() * 8 - 4; // Random score between -4 and 4
        
        mockNews.push({
            title: headlines[i % headlines.length],
            description: descriptions[i % descriptions.length],
            url: `https://example.com/market-news/india/${i}`,
            source: sources[i % sources.length],
            publishedAt: date.toISOString(),
            sentiment: {
                score: sentimentScore,
                comparative: sentimentScore / 10,
                details: {
                    basicScore: sentimentScore * 0.7,
                    financialContextScore: sentimentScore * 0.3
                }
            }
        });
    }
    
    return mockNews;
}

module.exports = router;