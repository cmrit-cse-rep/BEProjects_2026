const router = require('express').Router();
const yahooFinance = require('yahoo-finance2').default;

// Helper function to format symbol for Indian stocks
const formatIndianStockSymbol = (symbol) => {
  // Check if it's already formatted
  if (symbol.includes('.NS') || symbol.includes('.BO')) {
    return symbol;
  }
  
  // Default to NSE if not specified
  return `${symbol}.NS`;
};

// Get stock data
router.get('/:symbol', async (req, res) => {
    try {
        let { symbol } = req.params;
        const { exchange } = req.query;
        
        // Format symbol for Indian exchanges
        if (exchange === 'BSE') {
            symbol = symbol.includes('.BO') ? symbol : `${symbol}.BO`;
        } else {
            // Default to NSE
            symbol = formatIndianStockSymbol(symbol);
        }
        
        const result = await yahooFinance.quote(symbol);
        res.json(result);
    } catch (error) {
        res.status(400).json('Error: ' + error);
    }
});

// Get historical data
router.get('/historical/:symbol', async (req, res) => {
    try {
        let { symbol } = req.params;
        const { exchange } = req.query;
        
        // Format symbol for Indian exchanges
        if (exchange === 'BSE') {
            symbol = symbol.includes('.BO') ? symbol : `${symbol}.BO`;
        } else {
            // Default to NSE
            symbol = formatIndianStockSymbol(symbol);
        }
        
        const queryOptions = {
            period1: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)), // 1 year ago
            period2: new Date(),
            interval: '1d'
        };
        const result = await yahooFinance.historical(symbol, queryOptions);
        res.json(result);
    } catch (error) {
        res.status(400).json('Error: ' + error);
    }
});

// Get popular Indian stocks
router.get('/', async (req, res) => {
    try {
        // List of popular Indian stocks on NSE
        const popularStocks = [
            'RELIANCE.NS', // Reliance Industries
            'TCS.NS',      // Tata Consultancy Services
            'HDFCBANK.NS', // HDFC Bank
            'INFY.NS',     // Infosys
            'ICICIBANK.NS' // ICICI Bank
        ];
        
        const results = await Promise.all(
            popularStocks.map(async (symbol) => {
                try {
                    const data = await yahooFinance.quote(symbol);
                    return data;
                } catch (error) {
                    console.error(`Error fetching ${symbol}:`, error);
                    return null;
                }
            })
        );
        
        res.json(results.filter(result => result !== null));
    } catch (error) {
        res.status(400).json('Error: ' + error);
    }
});

module.exports = router; 