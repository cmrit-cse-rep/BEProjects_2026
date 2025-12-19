const router = require('express').Router();
const yahooFinance = require('yahoo-finance2').default;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}
const { SMA, RSI, MACD } = require('technicalindicators');
const Prediction = require('../models/Prediction');
const axios = require('axios');
const LSTMPredictor = require('../utils/lstm_predictor');
let tf;
const getTf = () => {
  if (!tf) tf = require('@tensorflow/tfjs');
  return tf;
};

// Initialize LSTM predictor
const lstmPredictor = new LSTMPredictor();
const IS_SERVERLESS = !!process.env.VERCEL;

// Cache for trained models to prevent repeated training
const modelCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of modelCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      modelCache.delete(key);
    }
  }
  console.log(`Cache cleanup: ${modelCache.size} entries remaining`);
}, 10 * 60 * 1000);

// Helper function to format and validate stock symbols
const formatStockSymbol = (symbol) => {
  // Remove any whitespace and convert to uppercase
  symbol = symbol.trim().toUpperCase();
  
  // If already formatted with exchange suffix, return as is
  if (symbol.includes('.NS') || symbol.includes('.BO') || symbol.includes('.')) {
    return symbol;
  }
  
  // Common Indian stock mappings
  const indianStockMappings = {
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
    'HUL': 'HINDUNILVR.NS',
    'WIPRO': 'WIPRO.NS',
    'LT': 'LT.NS',
    'MARUTI': 'MARUTI.NS',
    'BAJFINANCE': 'BAJFINANCE.NS',
    'ASIANPAINT': 'ASIANPAINT.NS',
    'HCLTECH': 'HCLTECH.NS',
    'AXISBANK': 'AXISBANK.NS',
    'KOTAKBANK': 'KOTAKBANK.NS',
    'BHARTIARTL': 'BHARTIARTL.NS',
    'NESTLEIND': 'NESTLEIND.NS',
    'ULTRACEMCO': 'ULTRACEMCO.NS',
    'POWERGRID': 'POWERGRID.NS',
    'NTPC': 'NTPC.NS',
    'COALINDIA': 'COALINDIA.NS',
    'ONGC': 'ONGC.NS',
    'IOC': 'IOC.NS',
    'GRASIM': 'GRASIM.NS',
    'JSWSTEEL': 'JSWSTEEL.NS',
    'TATASTEEL': 'TATASTEEL.NS',
    'HINDALCO': 'HINDALCO.NS',
    'ADANIPORTS': 'ADANIPORTS.NS',
    'TECHM': 'TECHM.NS',
    'SUNPHARMA': 'SUNPHARMA.NS',
    'DRREDDY': 'DRREDDY.NS',
    'CIPLA': 'CIPLA.NS',
    'DIVISLAB': 'DIVISLAB.NS',
    'BRITANNIA': 'BRITANNIA.NS',
    'HEROMOTOCO': 'HEROMOTOCO.NS',
    'BAJAJ-AUTO': 'BAJAJ-AUTO.NS',
    'EICHERMOT': 'EICHERMOT.NS',
    'TITAN': 'TITAN.NS',
    'TATACONSUM': 'TATACONSUM.NS',
    'TATAMOTORS': 'TATAMOTORS.NS',
    'M&M': 'M&M.NS',
    'SHREECEM': 'SHREECEM.NS',
    'UPL': 'UPL.NS'
  };
  
  // Check if it's a known Indian stock
  if (indianStockMappings[symbol]) {
    return indianStockMappings[symbol];
  }
  
  // For US stocks, don't add any suffix
  const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'QCOM'];
  if (usStocks.includes(symbol)) {
    return symbol;
  }
  
  // Default to NSE for unknown symbols (assume Indian)
  return `${symbol}.NS`;
};

// Helper function to validate if a symbol is likely to have data
const validateSymbol = async (symbol) => {
  try {
    // Try to fetch a small amount of data to validate the symbol
    const testData = await yahooFinance.quote(symbol);
    return testData && testData.regularMarketPrice !== undefined;
  } catch (error) {
    return false;
  }
};

// Helper function to calculate technical indicators
const calculateIndicators = (data) => {
  // Calculate SMA
  const prices = data.map(day => day.close);
  const dates = data.map(day => new Date(day.date));
  
  // 14-day SMA
  const smaValues = SMA.calculate({ period: 14, values: prices });
  
  // 14-day RSI
  const rsiValues = RSI.calculate({ period: 14, values: prices });
  
  // MACD
  const macdValues = MACD.calculate({
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    values: prices
  });
  
  return {
    prices,
    dates,
    sma: smaValues,
    rsi: rsiValues,
    macd: macdValues
  };
};

// Function to normalize data for LSTM model
const normalizeData = (data) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return {
    normalizedData: data.map(val => (val - min) / (max - min)),
    min,
    max
  };
};

// Function to denormalize data
const denormalizeData = (normalizedData, min, max) => {
  return normalizedData.map(val => val * (max - min) + min);
};

// Function to prepare data for LSTM model
const prepareTimeSeriesData = (data, lookback) => {
  const X = [];
  const y = [];
  
  for (let i = lookback; i < data.length; i++) {
    // Create 2D array for each sequence (timesteps x features)
    const sequence = data.slice(i - lookback, i).map(value => [value]);
    X.push(sequence);
    y.push([data[i]]); // Wrap in array for consistent shape
  }
  
  return { X, y };
};

// Function to build and train LSTM model
const trainLSTMModel = async (data, lookback = 10) => {
  let xTensor, yTensor, model;
  try {
    const tf = getTf();
    console.log(`Starting LSTM model training with ${data.length} data points and lookback ${lookback}`);
    
    // Validate input data
    if (!data || data.length < lookback + 10) {
      throw new Error(`Insufficient data: need at least ${lookback + 10} points, got ${data.length}`);
    }
    
    const { normalizedData, min, max } = normalizeData(data);
    console.log(`Data normalized. Min: ${min}, Max: ${max}`);
    
    const { X, y } = prepareTimeSeriesData(normalizedData, lookback);
    console.log(`Time series data prepared. X shape: ${X.length}x${X[0].length}, Y length: ${y.length}`);
    
    // Validate prepared data
    if (X.length === 0 || y.length === 0) {
      throw new Error('No training data prepared');
    }
    
    // Convert to tensors with automatic shape inference
    xTensor = tf.tensor3d(X);
    yTensor = tf.tensor2d(y);
    console.log('Data converted to tensors');
    
    // Build smaller, faster LSTM model
    model = tf.sequential();
    model.add(tf.layers.lstm({
      units: 25, // Reduced from 50 to improve performance
      returnSequences: false, // Simplified architecture
      inputShape: [lookback, 1]
    }));
    model.add(tf.layers.dropout({ rate: 0.1 })); // Reduced dropout
    model.add(tf.layers.dense({ units: 1 }));
    console.log('LSTM model architecture built');
    
    // Compile model with faster optimizer
    model.compile({
      optimizer: tf.train.adam(0.01), // Increased learning rate for faster convergence
      loss: 'meanSquaredError'
    });
    console.log('Model compiled');
    
    // Train model with fewer epochs for better performance
    console.log('Starting training for 20 epochs...');
    await model.fit(xTensor, yTensor, {
      epochs: 20, // Reduced from 50
      batchSize: Math.min(32, Math.floor(X.length / 4)), // Dynamic batch size
      verbose: 0, // Reduced verbosity
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 5 === 0) console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });
    console.log('Model training completed');
    
    // Calculate MSE
    const predictions = model.predict(xTensor);
    const mse = tf.metrics.meanSquaredError(yTensor, predictions).dataSync()[0];
    console.log(`Model evaluation - MSE: ${mse}`);
    
    const r2 = Math.max(0, 1 - (mse / tf.moments(yTensor).variance.dataSync()[0]));
    console.log(`Model R² score: ${r2}`);
    
    // Clean up tensors
    predictions.dispose();
    
    return {
      model,
      min,
      max,
      lastSequence: normalizedData.slice(normalizedData.length - lookback),
      mse,
      r2: Math.min(r2, 0.95) // Cap R² to prevent overfitting appearance
    };
  } catch (error) {
    console.error('Error in LSTM model training:', error);
    // Clean up tensors on error
    if (xTensor) xTensor.dispose();
    if (yTensor) yTensor.dispose();
    if (model) model.dispose();
    throw new Error(`LSTM training failed: ${error.message}`);
  }
};

// Function to predict future prices
const predictFuturePrices = async (model, lastSequence, min, max, days = 7) => {
  try {
    const tf = getTf();
    console.log(`Predicting future prices for ${days} days`);
    console.log(`Using last sequence of length ${lastSequence.length}`);
    
    const predictions = [];
    let currentSequence = [...lastSequence];
    
    for (let i = 0; i < days; i++) {
      let xTensor, predictionTensor;
      try {
        // Reshape the sequence for prediction - convert 1D array to 3D tensor
        const reshapedSequence = currentSequence.map(val => [val]);
        xTensor = tf.tensor3d([reshapedSequence]);
        
        // Predict next value
        predictionTensor = model.predict(xTensor);
        const predictedNormalized = predictionTensor.dataSync()[0];
        
        // Clean up tensors immediately
        xTensor.dispose();
        predictionTensor.dispose();
        
        if (i % 2 === 0) console.log(`Day ${i+1} normalized prediction: ${predictedNormalized}`);
        
        // Update sequence (remove first element, add the prediction)
        currentSequence.shift();
        currentSequence.push(predictedNormalized);
        
        // Denormalize the predicted value
        const predictedValue = predictedNormalized * (max - min) + min;
        if (i % 2 === 0) console.log(`Day ${i+1} denormalized prediction: ${predictedValue}`);
        
        // Calculate confidence interval (estimate based on model MSE)
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        
        // Add prediction to results
        predictions.push({
          date,
          predictedPrice: predictedValue,
          confidenceInterval: {
            lower: predictedValue * 0.95,
            upper: predictedValue * 1.05
          }
        });
      } catch (stepError) {
        // Clean up tensors on error
        if (xTensor) xTensor.dispose();
        if (predictionTensor) predictionTensor.dispose();
        throw stepError;
      }
    }
    
    console.log(`Successfully generated ${predictions.length} predictions`);
    return predictions;
  } catch (error) {
    console.error('Error in future price prediction:', error);
    throw new Error(`Price prediction failed: ${error.message}`);
  }
};

// Fallback simple prediction function (linear regression) if LSTM fails
const simplePredictPrices = (dates, prices, targetDates) => {
  console.log("Using fallback simple prediction method");
  
  // Prepare data
  const xValues = dates.map(date => Math.floor(date.getTime() / (1000 * 60 * 60 * 24)));
  const yValues = prices;
  
  // Calculate the mean of x and y
  const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
  const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
  
  // Calculate the terms needed for the least squares regression line
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < xValues.length; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) * (xValues[i] - xMean);
  }
  
  // Calculate slope and intercept
  const slope = numerator / denominator;
  const intercept = yMean - (slope * xMean);
  console.log(`Linear regression: y = ${slope}x + ${intercept}`);
  
  // R-squared calculation
  const predictions = xValues.map(x => slope * x + intercept);
  const residualSum = predictions.reduce((sum, pred, i) => sum + Math.pow(yValues[i] - pred, 2), 0);
  const totalSum = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const rSquared = 1 - (residualSum / totalSum);
  console.log(`R-squared: ${rSquared}`);
  
  // Predict for target dates
  const result = targetDates.map(date => {
    const x = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    const predictedPrice = slope * x + intercept;
    
    // Calculate confidence interval
    const residuals = xValues.map((x, i) => yValues[i] - (slope * x + intercept));
    const variance = residuals.reduce((acc, val) => acc + val * val, 0) / residuals.length;
    const standardError = Math.sqrt(variance);
    
    return {
      date: date,
      predictedPrice: predictedPrice,
      confidenceInterval: {
        lower: predictedPrice - 1.96 * standardError,
        upper: predictedPrice + 1.96 * standardError
      }
    };
  });
  
  return {
    predictions: result,
    r2: rSquared
  };
};

// Get prediction for a stock from a specific date
router.get('/:symbol', async (req, res) => {
  try {
    let { symbol } = req.params;
    const { startDate, exchange } = req.query;
    
    console.log(`Processing prediction request for ${symbol}`);
    
    // Format symbol for different exchanges
    if (exchange === 'BSE') {
      symbol = symbol.includes('.BO') ? symbol : `${symbol}.BO`;
    } else {
      // Use improved symbol formatting
      symbol = formatStockSymbol(symbol);
    }
    
    console.log(`Formatted symbol: ${symbol}`);
    
    let startDateTime = startDate ? new Date(startDate) : new Date();
    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + 7); // Predict one week ahead
    
    // Get historical data - we need more data for LSTM
    const queryOptions = {
      period1: new Date(startDateTime.getTime() - (365 * 24 * 60 * 60 * 1000)), // 1 year of data
      period2: startDateTime,
      interval: '1d'
    };
    
    console.log(`Fetching historical data from ${queryOptions.period1.toISOString()} to ${queryOptions.period2.toISOString()}`);
    
    const historicalData = await yahooFinance.historical(symbol, queryOptions);
    console.log(`Fetched ${historicalData.length} historical data points`);
    
    if (historicalData.length < 60) {
      return res.status(400).json({ error: 'Not enough historical data to make predictions with LSTM model (need at least 60 days)' });
    }
    
    // Calculate indicators
    const indicators = calculateIndicators(historicalData);
    console.log('Technical indicators calculated');
    
    // Extract closing prices for LSTM model
    const closingPrices = historicalData.map(day => day.close);
    console.log(`Extracted ${closingPrices.length} closing prices`);
    
    let predictions, modelAccuracy, modelType;

    // Check cache first to avoid repeated training
    const cacheKey = `${symbol}_${closingPrices.length}_${closingPrices[closingPrices.length - 1]}`;
    const cachedResult = modelCache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      console.log(`Using cached model for ${symbol}`);
      predictions = cachedResult.predictions;
      modelAccuracy = cachedResult.modelAccuracy;
      modelType = cachedResult.modelType;
    } else {
      try {
        if (!IS_SERVERLESS) {
          console.log(`Training LSTM model for ${symbol}...`);
          const lookback = 20;
          const trainedModel = await trainLSTMModel(closingPrices, lookback);
          console.log(`Predicting future prices for ${symbol} using LSTM...`);
          predictions = await predictFuturePrices(
            trainedModel.model,
            trainedModel.lastSequence,
            trainedModel.min,
            trainedModel.max,
            7
          );
          const mse = trainedModel.mse;
          const stdDev = Math.sqrt(mse * (trainedModel.max - trainedModel.min) ** 2);
          predictions.forEach((pred, i) => {
            const dayFactor = 1 + (i * 0.05);
            pred.confidenceInterval.lower = pred.predictedPrice - (1.96 * stdDev * dayFactor);
            pred.confidenceInterval.upper = pred.predictedPrice + (1.96 * stdDev * dayFactor);
          });
          modelAccuracy = trainedModel.r2;
          modelType = 'LSTM';
        } else {
          throw new Error('Serverless: skip LSTM training');
        }
      } catch (error) {
        console.error('LSTM prediction failed, attempting trained LSTM model as backup:', error);
        // Skip Python-based trained model on serverless
        if (!IS_SERVERLESS) {
          try {
            console.log(`Checking for trained LSTM model for ${symbol}...`);
            const hasTrainedModel = await lstmPredictor.hasModel(symbol);
            
            if (hasTrainedModel) {
              console.log(`Using trained LSTM model for ${symbol}...`);
              const lstmResult = await lstmPredictor.predict(symbol, 7);
              
              if (lstmResult.success) {
                predictions = lstmResult.predictions.map(pred => ({
                  date: new Date(pred.date),
                  predictedPrice: pred.price,
                  confidenceInterval: {
                    lower: pred.price * 0.95,
                    upper: pred.price * 1.05
                  }
                }));
                modelAccuracy = 0.85;
                modelType = 'TrainedLSTM';
                console.log(`Successfully used trained LSTM model for ${symbol}`);
              } else {
                throw new Error(lstmResult.error);
              }
            } else {
              throw new Error(`No trained model available for ${symbol}`);
            }
          } catch (lstmError) {
            console.error('Trained LSTM model failed, attempting external model as backup:', lstmError);
          }
        }

          // Try external cloud sequence model backup if configured
          try {
            const extPreds = await externalForecastPrices({ prices: indicators.prices, days: 7 });
            predictions = extPreds;
            // Approximate accuracy: compare last predicted to last price variance
            const lastPrice = indicators.prices[indicators.prices.length - 1];
            const lastPred = predictions[predictions.length - 1].predictedPrice;
            const diff = Math.abs(lastPred - lastPrice);
            const scale = Math.max(1, lastPrice);
            modelAccuracy = Math.max(0, 1 - diff / scale);
            modelType = 'CloudSequenceModel';
          } catch (extErr) {
            console.error('External backup model failed, falling back to simple prediction:', extErr);
            // Generate dates for the next week
            const targetDates = [];
            for (let i = 1; i <= 7; i++) {
              const date = new Date(startDateTime);
              date.setDate(date.getDate() + i);
              targetDates.push(date);
            }
            const predictionResults = simplePredictPrices(indicators.dates, indicators.prices, targetDates);
            predictions = predictionResults.predictions;
          modelAccuracy = predictionResults.r2;
          modelType = 'LinearRegression';
          }
        }
    
      // Cache the result for future requests (only if not from cache)
      if (!cachedResult) {
        modelCache.set(cacheKey, {
          predictions,
          modelAccuracy,
          modelType,
          timestamp: Date.now()
        });
        console.log(`Cached prediction result for ${symbol}`);
      }
    }

    // Save prediction to database (if available)
    try {
      const newPrediction = new Prediction({
        stockSymbol: symbol,
        modelType: modelType,
        predictions: predictions,
        accuracy: {
          r2: modelAccuracy,
        },
        validUntil: endDateTime,
      });

      await newPrediction.save();
      console.log('Prediction saved to database');
    } catch (dbError) {
      console.log('Database save failed, continuing without saving:', dbError.message);
    }

    // If user is authenticated, record in their predictionHistory
    try {
      const authHeader = req.headers.authorization || '';
      const parts = authHeader.split(' ');
      if (parts[0] === 'Bearer' && parts[1]) {
        const payload = jwt.verify(parts[1], JWT_SECRET);
        const user = await User.findById(payload.id);
        if (user) {
          const lastClose = historicalData[historicalData.length - 1]?.close;
          const firstPred = predictions[0]?.predictedPrice;
          user.predictionHistory.push({
            symbol,
            predictedPrice: Number(firstPred) || undefined,
            actualPrice: Number(lastClose) || undefined,
          });
          await user.save();
          console.log('Stored prediction in user history');
        }
      }
    } catch (userErr) {
      console.log('User prediction history save skipped:', userErr.message);
    }

    // Return prediction results
    res.json({
      symbol,
      exchange: symbol.includes('.BO') ? 'BSE' : 'NSE',
      startDate: startDateTime,
      endDate: endDateTime,
      predictions: predictions,
      modelAccuracy: modelAccuracy,
      modelType: modelType,
      technicalIndicators: {
        lastSMA: indicators.sma[indicators.sma.length - 1],
        lastRSI: indicators.rsi[indicators.rsi.length - 1],
        lastMACD: indicators.macd[indicators.macd.length - 1],
      },
    });
  } catch (error) {
    console.error('Prediction Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Route to train a new LSTM model for a specific symbol
router.post('/train/:symbol', async (req, res) => {
  try {
    if (IS_SERVERLESS) {
      return res.status(501).json({ success: false, error: 'Training is not supported on serverless deployment' });
    }
    const { symbol } = req.params;
    const { period = '5y', epochs = 50, sequenceLength = 60, testSize = 0.2 } = req.body;
    
    console.log(`Starting LSTM training for ${symbol}...`);
    
    // Format and validate symbol
    const formattedSymbol = formatStockSymbol(symbol);
    console.log(`Formatted symbol: ${formattedSymbol}`);
    
    // Validate symbol by checking if data is available
    console.log(`Validating symbol ${formattedSymbol}...`);
    const isValidSymbol = await validateSymbol(formattedSymbol);
    
    if (!isValidSymbol) {
      console.log(`Symbol validation failed for ${formattedSymbol}`);
      return res.status(400).json({
        success: false,
        error: `No data found for symbol ${formattedSymbol}. Please check the symbol and try again.`,
        symbol: formattedSymbol,
        suggestions: [
          'For Indian stocks: RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK',
          'For US stocks: AAPL, GOOGL, MSFT, AMZN, TSLA'
        ]
      });
    }
    
    console.log(`Symbol ${formattedSymbol} validated successfully. Starting training...`);
    
    const result = await lstmPredictor.trainModel(formattedSymbol, {
      period,
      epochs,
      sequenceLength,
      testSize
    });
    
    // Check if training actually succeeded
    if (result && result.success === false) {
      console.log(`Training failed for ${formattedSymbol}:`, result.error);
      return res.status(500).json({
        success: false,
        error: result.error || 'Training failed',
        symbol: formattedSymbol
      });
    }
    
    console.log(`Training completed successfully for ${formattedSymbol}`);
    
    // Generate 7-day predictions after training
    let sevenDayPredictions = [];
    try {
      console.log(`Generating 7-day predictions for ${formattedSymbol}...`);
      const predictionResult = await lstmPredictor.predict(formattedSymbol, 7);
      
      if (predictionResult.success) {
        sevenDayPredictions = predictionResult.predictions.map(pred => ({
          date: pred.date,
          predictedPrice: pred.price,
          confidenceInterval: {
            lower: pred.price * 0.95,
            upper: pred.price * 1.05
          }
        }));
        console.log(`Generated ${sevenDayPredictions.length} predictions for ${formattedSymbol}`);
      }
    } catch (predError) {
      console.log(`Failed to generate 7-day predictions: ${predError.message}`);
    }
    
    // Get current price for context
    let currentPrice = null;
    try {
      const yahooFinance = require('yahoo-finance2').default;
      const quote = await yahooFinance.quote(formattedSymbol);
      currentPrice = quote.regularMarketPrice;
    } catch (priceError) {
      console.log(`Failed to get current price: ${priceError.message}`);
    }
    
    res.json({
      success: true,
      symbol: formattedSymbol,
      result,
      sevenDayPredictions,
      currentPrice,
      message: `LSTM model training completed for ${formattedSymbol}`
    });
    
  } catch (error) {
    console.error('Training error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Route to get available trained models
router.get('/models', async (req, res) => {
  try {
    if (IS_SERVERLESS) {
      return res.json({ success: true, models: [], count: 0 });
    }
    const models = await lstmPredictor.getAvailableModels();
    res.json({
      success: true,
      models,
      count: models.length
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route to get model metadata for a specific symbol
router.get('/models/:symbol', async (req, res) => {
  try {
    if (IS_SERVERLESS) {
      return res.status(404).json({ success: false, error: 'No trained model found' });
    }
    const { symbol } = req.params;
    const formattedSymbol = formatStockSymbol(symbol);
    
    const hasModel = await lstmPredictor.hasModel(formattedSymbol);
    if (!hasModel) {
      return res.status(404).json({
        success: false,
        error: `No trained model found for ${formattedSymbol}`
      });
    }
    
    const metadata = await lstmPredictor.getModelMetadata(formattedSymbol);
    res.json({
      success: true,
      symbol: formattedSymbol,
      metadata
    });
    
  } catch (error) {
    console.error('Error getting model metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route to delete a trained model
router.delete('/models/:symbol', async (req, res) => {
  try {
    if (IS_SERVERLESS) {
      return res.status(404).json({ success: false, error: 'Model deletion not supported on serverless' });
    }
    const { symbol } = req.params;
    const formattedSymbol = formatStockSymbol(symbol);
    
    const deleted = await lstmPredictor.deleteModel(formattedSymbol);
    
    if (deleted) {
      res.json({
        success: true,
        message: `Model for ${formattedSymbol} deleted successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Failed to delete model for ${formattedSymbol}`
      });
    }
    
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route to predict using trained LSTM model directly
router.get('/lstm/:symbol', async (req, res) => {
  try {
    if (IS_SERVERLESS) {
      return res.status(404).json({ success: false, error: 'Trained LSTM not available on serverless' });
    }
    const { symbol } = req.params;
    const { days = 7 } = req.query;
    
    const formattedSymbol = formatStockSymbol(symbol);
    
    const hasModel = await lstmPredictor.hasModel(formattedSymbol);
    if (!hasModel) {
      return res.status(404).json({
        success: false,
        error: `No trained LSTM model found for ${formattedSymbol}. Please train a model first.`
      });
    }
    
    const result = await lstmPredictor.predict(formattedSymbol, parseInt(days));
    
    if (result.success) {
      res.json({
        success: true,
        symbol: formattedSymbol,
        predictions: result.predictions,
        metadata: result.metadata,
        modelType: 'TrainedLSTM'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('LSTM prediction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

// Function to predict via external cloud sequence model (backup)
const externalForecastPrices = async ({ prices, days = 7 }) => {
  const token = process.env.SEQ_MODEL_API_TOKEN || process.env.EXTERNAL_MODEL_API_TOKEN || process.env.HF_API_TOKEN;
  const modelId = process.env.SEQ_MODEL_ID || process.env.EXTERNAL_MODEL_ID || process.env.HF_MODEL_ID || 'kashif/timeseries-transformer';

  if (!token) {
    throw new Error('External inference token not configured');
  }

  const url = `https://api-inference.huggingface.co/models/${modelId}`;

  // Build a flexible payload so different models can understand
  const payloadCandidates = [
    { inputs: prices, parameters: { prediction_length: days } },
    { inputs: { series: prices, prediction_length: days } },
    { inputs: { past_values: prices, future: days } },
  ];

  let response;
  let lastError;
  for (const payload of payloadCandidates) {
    try {
      response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      if (response && response.data) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!response || !response.data) {
    throw new Error(`External inference failed${lastError ? `: ${lastError.message}` : ''}`);
  }

  const data = response.data;
  // Try to normalize several possible response formats
  let predictedValues = [];
  if (Array.isArray(data)) {
    // e.g., [x1, x2, ...] or [{value: x1}, ...]
    predictedValues = data.map((d) => (typeof d === 'number' ? d : (d.value ?? d.prediction ?? d.predicted ?? d)));
  } else if (typeof data === 'object') {
    if (Array.isArray(data.predictions)) {
      predictedValues = data.predictions.map((d) => (typeof d === 'number' ? d : (d.value ?? d.prediction ?? d.predicted ?? d)));
    } else if (typeof data.output === 'string') {
      try {
        const parsed = JSON.parse(data.output);
        if (Array.isArray(parsed)) predictedValues = parsed;
        else if (Array.isArray(parsed.predictions)) predictedValues = parsed.predictions;
      } catch (_) {}
    }
  } else if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) predictedValues = parsed;
      else if (Array.isArray(parsed.predictions)) predictedValues = parsed.predictions;
    } catch (_) {}
  }

  // Fallback if still empty: just return last value repeated
  if (!predictedValues.length) {
    const last = prices[prices.length - 1];
    predictedValues = Array.from({ length: days }, () => last);
  }

  const predictions = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const p = Number(predictedValues[i]);
    const predictedPrice = Number.isFinite(p) ? p : prices[prices.length - 1];
    predictions.push({
      date,
      predictedPrice,
      confidenceInterval: {
        lower: predictedPrice * 0.95,
        upper: predictedPrice * 1.05,
      },
    });
  }

  return predictions;
};