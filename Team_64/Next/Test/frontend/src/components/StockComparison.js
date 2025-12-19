import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Autocomplete,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ShowChartOutlined as ChartIcon,
  BarChartOutlined as BarChartIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];

const StockComparison = () => {
  const [selectedStocks, setSelectedStocks] = useState(['TCS.NS', 'RELIANCE.NS']);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('1M');
  const [showPercentage, setShowPercentage] = useState(false);

  const availableStocks = [
    'TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFC.NS', 'ICICI.NS',
    'SBI.NS', 'ITC.NS', 'WIPRO.NS', 'HDFCBANK.NS', 'LT.NS',
    'BHARTIARTL.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'KOTAKBANK.NS', 'HCLTECH.NS'
  ];

  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchStockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStocks, timeRange]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const promises = selectedStocks.map(async (stock) => {
        try {
          const response = await axios.get(`${API_URL}/api/stocks/historical/${stock}`);
          const historicalData = response.data || [];

          const transformedData = historicalData.map((item) => ({
            date: new Date(item.date).toLocaleDateString(),
            price: item.close,
            volume: item.volume,
            high: item.high,
            low: item.low,
            open: item.open,
            change: item.change ?? null,
            marketCap: item.marketCap ?? null,
            pe: item.pe ?? null,
            dividend: item.dividend ?? null,
          }));

          let filteredData = transformedData;
          if (timeRange === '1D') {
            filteredData = transformedData.slice(-1);
          } else if (timeRange === '1W') {
            filteredData = transformedData.slice(-7);
          } else if (timeRange === '1M') {
            filteredData = transformedData.slice(-30);
          } else if (timeRange === '3M') {
            filteredData = transformedData.slice(-90);
          }

          return { stock, data: filteredData };
        } catch (error) {
          console.error(`Error fetching data for ${stock}:`, error);
          return { stock, data: [] };
        }
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(({ stock, data }) => {
        dataMap[stock] = data;
      });
      setStockData(dataMap);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStock = (stock) => {
    if (stock && !selectedStocks.includes(stock) && selectedStocks.length < 5) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const removeStock = (stock) => {
    setSelectedStocks(selectedStocks.filter((s) => s !== stock));
  };

  const getChartData = () => {
    if (Object.keys(stockData).length === 0) return [];

    const dates = stockData[selectedStocks[0]]?.map((item) => item.date) || [];

    return dates.map((date) => {
      const dataPoint = { date };
      selectedStocks.forEach((stock) => {
        const stockItem = stockData[stock]?.find((item) => item.date === date);
        if (stockItem) {
          dataPoint[stock] = showPercentage
            ? ((stockItem.price - stockData[stock][0].price) / stockData[stock][0].price) * 100
            : Number(stockItem.price);
        }
      });
      return dataPoint;
    });
  };

  const getComparisonData = () => {
    return selectedStocks
      .map((stock) => {
        const data = stockData[stock];
        if (!data || data.length === 0) return null;
        const latest = data[data.length - 1];
        const previous = data[data.length - 2] || latest;
        const changePct = (Number(latest.price) && Number(previous.price))
          ? (((Number(latest.price) - Number(previous.price)) / Number(previous.price)) * 100)
          : null;
        return {
          stock,
          price: Number(latest.price) || null,
          change: changePct,
          volume: Number(latest.volume) || null,
          marketCap: Number(latest.marketCap) || null,
          pe: Number(latest.pe) || null,
          dividend: Number(latest.dividend) || null,
          trend: (Number(latest.price) && Number(previous.price) && Number(latest.price) > Number(previous.price)) ? 'up' : 'down',
        };
      })
      .filter(Boolean);
  };

  const getRadarData = () => {
    const comparison = getComparisonData();
    const metrics = ['Performance', 'Volume', 'P/E Ratio', 'Market Cap', 'Dividend'];

    return metrics.map((metric) => {
      const dataPoint = { subject: metric };
      comparison.forEach((stock) => {
        const stockName = stock.stock.replace('.NS', '');
        switch (metric) {
          case 'Performance':
            dataPoint[stockName] = Math.min(Math.abs(stock.change || 0) * 10, 100);
            break;
          case 'Volume':
            dataPoint[stockName] = Math.min((stock.volume || 0) / 1_000_000, 100);
            break;
          case 'P/E Ratio':
            dataPoint[stockName] = Math.min((stock.pe || 0) * 2, 100);
            break;
          case 'Market Cap':
            dataPoint[stockName] = Math.min((stock.marketCap || 0) / 100_000_000, 100);
            break;
          case 'Dividend':
            dataPoint[stockName] = Math.min((stock.dividend || 0) * 15, 100);
            break;
          default:
            dataPoint[stockName] = 0;
        }
      });
      return dataPoint;
    });
  };

  const chartData = getChartData();
  const comparisonData = getComparisonData();
  const radarData = getRadarData();

  return (
    <Box
      sx={{
        width: '100%',
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ width: '100%', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Stock Comparison Tool
        </Typography>

        {/* Stock Selection */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Stocks to Compare
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Autocomplete
                options={availableStocks.filter((stock) => !selectedStocks.includes(stock))}
                renderInput={(params) => (
                  <TextField {...params} label="Add Stock" placeholder="Search for stocks..." variant="outlined" size="small" />
                )}
                onChange={(event, value) => {
                  if (value) addStock(value);
                }}
                sx={{ maxWidth: 300 }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {selectedStocks.map((stock, index) => (
                <Chip
                  key={stock}
                  label={stock}
                  onDelete={() => removeStock(stock)}
                  color="primary"
                  variant="outlined"
                  sx={{ borderColor: colors[index % colors.length], color: colors[index % colors.length] }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time Range
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['1D', '1W', '1M', '3M'].map((range) => (
                    <Button key={range} size="small" variant={timeRange === range ? 'contained' : 'outlined'} onClick={() => setTimeRange(range)}>
                      {range}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Chart Type
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton color={chartType === 'line' ? 'primary' : 'default'} onClick={() => setChartType('line')}>
                    <ChartIcon />
                  </IconButton>
                  <IconButton color={chartType === 'bar' ? 'primary' : 'default'} onClick={() => setChartType('bar')}>
                    <BarChartIcon />
                  </IconButton>
                </Box>
              </Box>

              <FormControlLabel
                control={<Switch checked={showPercentage} onChange={(e) => setShowPercentage(e.target.checked)} />}
                label="Show as %"
              />
            </Box>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && selectedStocks.length > 0 && (
          <Grid container spacing={4}>
            {/* Price Chart */}
            <Grid item xs={12} md={8} lg={8}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Price Comparison {showPercentage ? '(%)' : '(₹)'}
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 300, md: 380, lg: 450 } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          {selectedStocks.map((stock, index) => (
                            <Line key={stock} type="monotone" dataKey={stock} stroke={colors[index % colors.length]} dot={false} />
                          ))}
                        </LineChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          {selectedStocks.map((stock, index) => (
                            <Bar key={stock} dataKey={stock} fill={colors[index % colors.length]} />
                          ))}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Radar Chart */}
            <Grid item xs={12} md={4} lg={4}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Radar
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 300, md: 380, lg: 450 } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="85%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        {selectedStocks.map((stock, index) => (
                          <Radar key={stock} name={stock.replace('.NS', '')} dataKey={stock.replace('.NS', '')} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.4} />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Comparison */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detailed Comparison
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stock</TableCell>
                          <TableCell>Price (₹)</TableCell>
                          <TableCell>Change (%)</TableCell>
                          <TableCell>Volume</TableCell>
                          <TableCell>Market Cap (₹)</TableCell>
                          <TableCell>P/E Ratio</TableCell>
                          <TableCell>Dividend (%)</TableCell>
                          <TableCell>Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comparisonData.map((row) => (
                          <TableRow key={row.stock}>
                            <TableCell>{row.stock}</TableCell>
                            <TableCell>{row.price !== null ? row.price.toLocaleString() : '—'}</TableCell>
                            <TableCell>{row.change !== null ? row.change.toFixed(2) : '—'}</TableCell>
                            <TableCell>{row.volume !== null ? row.volume.toLocaleString() : '—'}</TableCell>
                            <TableCell>{row.marketCap !== null ? `₹${row.marketCap.toLocaleString()}` : '—'}</TableCell>
                            <TableCell>{row.pe !== null ? row.pe.toFixed(2) : '—'}</TableCell>
                            <TableCell>{row.dividend !== null ? row.dividend.toFixed(2) : '—'}</TableCell>
                            <TableCell>
                              {row.trend === 'up' ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default StockComparison;
const API_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5001`;
