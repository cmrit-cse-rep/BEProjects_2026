import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon, TrendingUp as TrendingUpIcon, ModelTraining as ModelTrainingIcon } from '@mui/icons-material';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function Predictions() {
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historical, setHistorical] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [trainingSymbol, setTrainingSymbol] = useState('');
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);

  const buildChartData = (histData, preds) => {
    const lastDays = histData.slice(-60); // show last 60 days
    const histLabels = lastDays.map(d => new Date(d.date));
    const histPrices = lastDays.map(d => d.close);

    const predLabels = preds.map(p => new Date(p.date));
    const labels = [...histLabels, ...predLabels];

    const actualSeries = [...histPrices, ...Array(preds.length).fill(null)];
    const forecastSeries = [...Array(histPrices.length).fill(null), ...preds.map(p => p.predictedPrice)];

    setChartData({
      labels: labels.map(d => d.toLocaleDateString()),
      datasets: [
        {
          label: 'Actual Close',
          data: actualSeries,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.15)',
          tension: 0.25,
          pointRadius: 0,
        },
        {
          label: 'Forecast',
          data: forecastSeries,
          borderColor: '#f50057',
          backgroundColor: 'rgba(245, 0, 87, 0.15)',
          borderDash: [6, 4],
          tension: 0.25,
          pointRadius: 3,
        }
      ]
    });
  };

  const handlePredict = async () => {
    if (!symbol) return;

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/api/predictions/${symbol}`, {
        params: { exchange }
      });
      const data = response.data;
      setPredictionData(data);

      // Fetch historical for chart context
      const histRes = await axios.get(`${API_URL}/api/stocks/historical/${symbol}`, {
        params: { exchange }
      });
      const histData = histRes.data || [];
      setHistorical(histData);
      if (Array.isArray(histData) && Array.isArray(data?.predictions)) {
        buildChartData(histData, data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setError('Error fetching predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (!trainingSymbol) return;

    setTrainingLoading(true);
    setError('');
    setTrainingResult(null);
    try {
      const trainSym = exchange === 'BSE'
        ? (trainingSymbol.includes('.BO') ? trainingSymbol : `${trainingSymbol}.BO`)
        : trainingSymbol;
      const response = await axios.post(`${API_URL}/api/predictions/train/${trainSym}`);
      
      // Check if the response indicates success or failure
      if (response.data && response.data.success === false) {
        setTrainingResult({
          success: false,
          message: response.data.error || `Training failed for ${trainingSymbol}. Please try a different symbol.`
        });
      } else {
        setTrainingResult({
          success: true,
          message: response.data.message || `Model training completed for ${trainingSymbol}.`,
          data: response.data
        });
      }
    } catch (error) {
      console.error('Error training model:', error);
      setTrainingResult({
        success: false,
        message: error.response?.data?.error || 'Error training model. Please try again.'
      });
    } finally {
      setTrainingLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Stock Price Predictions & Model Training
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="prediction tabs">
          <Tab label="Get Predictions" icon={<SearchIcon />} />
          <Tab label="Train Model" icon={<ModelTrainingIcon />} />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {tabValue === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' } }}>
              <TextField
                fullWidth
                label="Enter Stock Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., RELIANCE"
              />
              <TextField
                select
                label="Exchange"
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 140 } }}
              >
                <MenuItem value="NSE">NSE</MenuItem>
                <MenuItem value="BSE">BSE</MenuItem>
              </TextField>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                onClick={handlePredict}
                disabled={loading || !symbol}
                fullWidth={true}
              >
                Predict
              </Button>
            </Paper>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Train LSTM Model
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Train a new LSTM model for a stock symbol. This process may take several minutes.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <strong>Note:</strong> Currently works best with Indian stock symbols (e.g., RELIANCE, TCS, INFY). 
                The system automatically adds .NS suffix for Indian stocks.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Enter Stock Symbol to Train"
                  value={trainingSymbol}
                  onChange={(e) => setTrainingSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., RELIANCE"
                />
                <TextField
                  select
                  label="Exchange"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="NSE">NSE</MenuItem>
                  <MenuItem value="BSE">BSE</MenuItem>
                </TextField>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={trainingLoading ? <CircularProgress size={20} color="inherit" /> : <ModelTrainingIcon />}
                  onClick={handleTrain}
                  disabled={trainingLoading || !trainingSymbol}
                >
                  Train Model
                </Button>
              </Box>
              {trainingResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={trainingResult.success ? "success" : "error"} sx={{ mb: 2 }}>
                    {trainingResult.message}
                  </Alert>
                  
                  {trainingResult.success && trainingResult.data && (
                    <Grid container spacing={2}>
                      {/* Training Metrics */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom color="primary">
                            Training Metrics
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Training MSE:</Typography>
                              <Chip label={trainingResult.data.result?.train_mse?.toFixed(6) || 'N/A'} size="small" color="primary" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Test MSE:</Typography>
                              <Chip label={trainingResult.data.result?.test_mse?.toFixed(6) || 'N/A'} size="small" color="secondary" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Training MAE:</Typography>
                              <Chip label={trainingResult.data.result?.train_mae?.toFixed(6) || 'N/A'} size="small" color="primary" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Test MAE:</Typography>
                              <Chip label={trainingResult.data.result?.test_mae?.toFixed(6) || 'N/A'} size="small" color="secondary" />
                            </Box>
                          </Box>
                        </Card>
                      </Grid>

                      {/* Data Statistics */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom color="primary">
                            Data Statistics
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Total Data Points:</Typography>
                              <Chip label={trainingResult.data.result?.data_points || 'N/A'} size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Training Samples:</Typography>
                              <Chip label={trainingResult.data.result?.training_samples || 'N/A'} size="small" color="success" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Test Samples:</Typography>
                              <Chip label={trainingResult.data.result?.test_samples || 'N/A'} size="small" color="warning" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Current Price:</Typography>
                              <Chip 
                                label={`₹${(trainingResult.data.currentPrice ?? trainingResult.data.result?.current_price)?.toFixed(2) || 'N/A'}`} 
                                size="small" 
                                color="info" 
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Grid>

                      {/* Sample Predictions */}
                      {trainingResult.data.result?.sample_predictions && trainingResult.data.result?.sample_predictions.length > 0 && (
                        <Grid item xs={12}>
                          <Card sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                              Sample Predictions
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {trainingResult.data.result.sample_predictions.map((prediction, index) => (
                                <Card key={index} sx={{ p: 1, minWidth: 200, backgroundColor: 'action.hover' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {prediction.date}
                                  </Typography>
                                  <Typography variant="h6" color="primary">
                                    ₹{prediction.price?.toFixed(2)}
                                  </Typography>
                                </Card>
                              ))}
                            </Box>
                          </Card>
                        </Grid>
                      )}

                      {/* 7-Day Price Predictions */}
                      {trainingResult.data.sevenDayPredictions && trainingResult.data.sevenDayPredictions.length > 0 && (
                        <Grid item xs={12}>
                          <Card sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                              7-Day Price Forecast
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {trainingResult.data.sevenDayPredictions.map((prediction, index) => (
                                <Card key={index} sx={{ p: 2, backgroundColor: 'action.hover' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Day {index + 1} - {new Date(prediction.date).toLocaleDateString()}
                                      </Typography>
                                      <Typography variant="h6" color="primary">
                                        ₹{prediction.predictedPrice?.toFixed(2)}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Range: ₹{prediction.confidenceInterval?.lower?.toFixed(2)} - ₹{prediction.confidenceInterval?.upper?.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Card>
                              ))}
                            </Box>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {error && tabValue === 0 && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {predictionData && predictionData.predictions && tabValue === 0 && (
          <>
            {chartData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      {predictionData.symbol} Forecast
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Model: ${predictionData.modelType || 'LSTM'}`} color="primary" variant="outlined" />
                      <Chip label={`Accuracy: ${(predictionData.modelAccuracy * 100).toFixed(2)}%`} color="secondary" variant="outlined" />
                    </Box>
                  </Box>
                  <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          intersect: false,
                          mode: 'index',
                        },
                        plugins: {
                          legend: { 
                            position: 'top',
                            labels: {
                              usePointStyle: true,
                              padding: 20
                            }
                          },
                          tooltip: { 
                            mode: 'index', 
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255,255,255,0.2)',
                            borderWidth: 1
                          },
                        },
                        scales: {
                          x: { 
                            grid: { display: false },
                            ticks: {
                              maxTicksLimit: 10,
                              autoSkip: true
                            }
                          },
                          y: { 
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            beginAtZero: false,
                            ticks: {
                              callback: function(value) {
                                return '₹' + value.toFixed(0);
                              }
                            }
                          },
                        },
                        elements: {
                          point: {
                            radius: 3,
                            hoverRadius: 6
                          },
                          line: {
                            tension: 0.3
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Next 7 Days Forecast
                </Typography>
                <Grid container spacing={2}>
                  {predictionData.predictions.map((prediction, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            {new Date(prediction.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="h4" color="primary" sx={{ my: 2 }}>
                            ₹{prediction.predictedPrice.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Range: ₹{prediction.confidenceInterval.lower.toFixed(2)} - ₹{prediction.confidenceInterval.upper.toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {predictionData.technicalIndicators && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Technical Indicators
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          SMA (14-day)
                        </Typography>
                        <Typography variant="h6">
                          {predictionData.technicalIndicators.lastSMA?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          RSI (14-day)
                        </Typography>
                        <Typography variant="h6">
                          {predictionData.technicalIndicators.lastRSI?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          MACD
                        </Typography>
                        <Typography variant="h6">
                          {predictionData.technicalIndicators.lastMACD?.macdLine?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </>
        )}

        {loading && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4, gap: 2 }}>
              <CircularProgress />
              <Alert severity="info" sx={{ maxWidth: 520 }}>
                Generating predictions. This can take up to 10–20 seconds on free instances.
              </Alert>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default Predictions;
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;
