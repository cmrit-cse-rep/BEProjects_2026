import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  PauseOutlined as PauseIcon,
  PlayArrowOutlined as PlayIcon,
  RefreshOutlined as RefreshIcon,
  NotificationsActiveOutlined as NotificationIcon,
  ShowChartOutlined as ChartIcon,
  VolumeUpOutlined as VolumeIcon,
  FlashOnOutlined as FlashIcon,
} from '@mui/icons-material';

const RealTimeUpdates = ({ darkMode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [stockUpdates, setStockUpdates] = useState([]);
  const [watchlist, setWatchlist] = useState(['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFC.NS', 'ICICI.NS']);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const stockData = {
    'TCS.NS': { name: 'Tata Consultancy Services', price: 3245.50, color: '#2196F3' },
    'RELIANCE.NS': { name: 'Reliance Industries', price: 2456.75, color: '#4CAF50' },
    'INFY.NS': { name: 'Infosys Limited', price: 1678.90, color: '#FF9800' },
    'HDFC.NS': { name: 'HDFC Bank', price: 1534.25, color: '#9C27B0' },
    'ICICI.NS': { name: 'ICICI Bank', price: 987.60, color: '#F44336' },
    'SBI.NS': { name: 'State Bank of India', price: 543.80, color: '#00BCD4' },
    'ITC.NS': { name: 'ITC Limited', price: 234.15, color: '#795548' },
    'WIPRO.NS': { name: 'Wipro Limited', price: 456.30, color: '#607D8B' },
  };

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return () => stopRealTimeUpdates();
  }, [autoRefresh, watchlist]);

  const startRealTimeUpdates = () => {
    setIsConnected(true);
    intervalRef.current = setInterval(() => {
      generateStockUpdate();
    }, 2000); // Update every 2 seconds
  };

  const stopRealTimeUpdates = () => {
    setIsConnected(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const generateStockUpdate = () => {
    const randomStock = watchlist[Math.floor(Math.random() * watchlist.length)];
    const basePrice = stockData[randomStock]?.price || 1000;
    
    // Generate realistic price change (-2% to +2%)
    const changePercent = (Math.random() - 0.5) * 4;
    const changeAmount = basePrice * (changePercent / 100);
    const newPrice = basePrice + changeAmount;
    
    // Generate volume
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    const update = {
      id: Date.now() + Math.random(),
      symbol: randomStock,
      name: stockData[randomStock]?.name || randomStock,
      price: newPrice.toFixed(2),
      change: changeAmount.toFixed(2),
      changePercent: changePercent.toFixed(2),
      volume: volume,
      timestamp: new Date(),
      isPositive: changeAmount >= 0,
    };

    setStockUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
    setUpdateCount(prev => prev + 1);

    // Play notification sound for significant changes
    if (notifications && Math.abs(changePercent) > 1) {
      playNotificationSound();
    }

    // Update the base price for next calculation
    if (stockData[randomStock]) {
      stockData[randomStock].price = newPrice;
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const manualRefresh = () => {
    generateStockUpdate();
  };

  const clearUpdates = () => {
    setStockUpdates([]);
    setUpdateCount(0);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getUpdateIcon = (update) => {
    if (Math.abs(parseFloat(update.changePercent)) > 2) {
      return <FlashIcon sx={{ color: '#FFD700' }} />;
    }
    return update.isPositive ? (
      <TrendingUpIcon sx={{ color: '#4CAF50' }} />
    ) : (
      <TrendingDownIcon sx={{ color: '#F44336' }} />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Real-Time Stock Updates
      </Typography>

      {/* Control Panel */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge
                  variant="dot"
                  color={isConnected ? 'success' : 'error'}
                  sx={{
                    '& .MuiBadge-dot': {
                      animation: isConnected ? 'pulse 2s infinite' : 'none',
                    },
                  }}
                >
                  <Typography variant="h6">
                    Connection Status
                  </Typography>
                </Badge>
                <Chip
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={toggleAutoRefresh}
                      color="primary"
                    />
                  }
                  label="Auto Refresh"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Sound Alerts"
                />

                <Tooltip title="Manual Refresh">
                  <IconButton onClick={manualRefresh} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="outlined"
                  onClick={clearUpdates}
                  size="small"
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Updates received: {updateCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Watching: {watchlist.length} stocks
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Live Updates Feed */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Live Updates Feed
                </Typography>
                <Chip
                  icon={<FlashIcon />}
                  label={`${stockUpdates.length} updates`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {stockUpdates.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No updates yet. {autoRefresh ? 'Waiting for real-time data...' : 'Enable auto-refresh to start receiving updates.'}
                </Alert>
              ) : (
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {stockUpdates.map((update, index) => (
                    <React.Fragment key={update.id}>
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              backgroundColor: stockData[update.symbol]?.color || '#757575',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getUpdateIcon(update)}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {update.symbol}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {update.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                ₹{update.price}
                              </Typography>
                              <Chip
                                label={`${update.isPositive ? '+' : ''}${update.change} (${update.changePercent}%)`}
                                size="small"
                                color={update.isPositive ? 'success' : 'error'}
                                variant="outlined"
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <VolumeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatVolume(update.volume)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          {formatTime(update.timestamp)}
                        </Typography>
                      </ListItem>
                      {index < stockUpdates.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Watchlist */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Watchlist
              </Typography>
              
              <List>
                {watchlist.map((symbol) => {
                  const data = stockData[symbol];
                  const latestUpdate = stockUpdates.find(update => update.symbol === symbol);
                  
                  return (
                    <ListItem key={symbol} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: data?.color || '#757575',
                            width: 32,
                            height: 32,
                          }}
                        >
                          <ChartIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={symbol}
                        secondary={data?.name}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      
                      {latestUpdate && (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            ₹{latestUpdate.price}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={latestUpdate.isPositive ? 'success.main' : 'error.main'}
                          >
                            {latestUpdate.isPositive ? '+' : ''}{latestUpdate.changePercent}%
                          </Typography>
                        </Box>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default RealTimeUpdates;