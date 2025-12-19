const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const yahooFinance = require('yahoo-finance2').default;
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

const originFn = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
};
const io = socketIo(server, {
    cors: {
        origin: originFn,
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: originFn,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Routes
const stockRoutes = require('./routes/stocks');
const predictionRoutes = require('./routes/predictions');
const newsRoutes = require('./routes/news');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');

app.get('/api', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve test HTML file
app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/test.html');
});

// Serve built React app
app.use(express.static(require('path').join(__dirname, '../frontend/build')));

app.use('/api/stocks', stockRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// MongoDB connection with error handling
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockprediction';
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => {
    console.log("MongoDB connection failed, continuing without database:", err.message);
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});

connection.on('error', (err) => {
    console.log("MongoDB connection error:", err.message);
});

// WebSocket functionality for real-time stock updates
const watchedStocks = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'ITC.NS', 'SBIN.NS', 'HINDUNILVR.NS'];
let stockUpdateInterval;

// Function to format Indian stock symbols
const formatIndianStockSymbol = (symbol) => {
    if (symbol.includes('.')) return symbol;
    
    // Common Indian stock mappings
    const stockMappings = {
        'RELIANCE': 'RELIANCE.NS',
        'TCS': 'TCS.NS',
        'INFY': 'INFY.NS',
        'INFOSYS': 'INFY.NS',
        'HDFCBANK': 'HDFCBANK.NS',
        'HDFC': 'HDFCBANK.NS',
        'ICICIBANK': 'ICICIBANK.NS',
        'ICICI': 'ICICIBANK.NS',
        'ITC': 'ITC.NS',
        'SBIN': 'SBIN.NS',
        'SBI': 'SBIN.NS',
        'HINDUNILVR': 'HINDUNILVR.NS',
        'HUL': 'HINDUNILVR.NS'
    };
    
    return stockMappings[symbol.toUpperCase()] || `${symbol.toUpperCase()}.NS`;
};

// Function to fetch real-time stock data
const fetchRealTimeStockData = async (symbols) => {
    try {
        const stockData = [];
        
        for (const symbol of symbols) {
            try {
                const formattedSymbol = formatIndianStockSymbol(symbol);
                const quote = await yahooFinance.quote(formattedSymbol);
                
                if (quote && quote.regularMarketPrice) {
                    stockData.push({
                        symbol: symbol,
                        fullSymbol: formattedSymbol,
                        name: quote.shortName || quote.longName || symbol,
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                        volume: quote.regularMarketVolume || 0,
                        marketCap: quote.marketCap || 0,
                        currency: quote.currency || 'INR',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.log(`Error fetching data for ${symbol}:`, error.message);
            }
        }
        
        return stockData;
    } catch (error) {
        console.error('Error fetching real-time stock data:', error);
        return [];
    }
};

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected for real-time updates');
    
    // Send initial stock data
    fetchRealTimeStockData(watchedStocks).then(data => {
        socket.emit('stockUpdate', data);
    });
    
    // Handle client requesting to watch specific stocks
    socket.on('watchStocks', (stocks) => {
        console.log('Client requested to watch stocks:', stocks);
        if (Array.isArray(stocks) && stocks.length > 0) {
            fetchRealTimeStockData(stocks).then(data => {
                socket.emit('stockUpdate', data);
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected from real-time updates');
    });
});

// Start real-time stock updates every 30 seconds
const startRealTimeUpdates = () => {
    stockUpdateInterval = setInterval(async () => {
        const stockData = await fetchRealTimeStockData(watchedStocks);
        if (stockData.length > 0) {
            io.emit('stockUpdate', stockData);
        }
    }, 30000); // Update every 30 seconds
};

// Start the real-time updates
startRealTimeUpdates();

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port: ${port}`);
    console.log('WebSocket server is ready for real-time stock updates');
});
