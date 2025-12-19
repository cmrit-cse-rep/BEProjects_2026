import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  Fab,
  Slide,
  Zoom,
} from '@mui/material';
import {
  NotificationsOutlined as NotificationsIcon,
  CloseOutlined as CloseIcon,
  TrendingUpOutlined as TrendingUpIcon,
  TrendingDownOutlined as TrendingDownIcon,
  InfoOutlined as InfoIcon,
  WarningOutlined as WarningIcon,
  CheckCircleOutlined as SuccessIcon,
  ErrorOutlined as ErrorIcon,
  ClearAllOutlined as ClearAllIcon,
} from '@mui/icons-material';

const NotificationSystem = ({ darkMode }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentSnackbar, setCurrentSnackbar] = useState(null);

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    // Simulate real-time notifications
    const interval = setInterval(() => {
      generateRandomNotification();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Save notifications to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const generateRandomNotification = () => {
    const stocks = ['TCS', 'RELIANCE', 'INFY', 'HDFC', 'ICICI', 'SBI', 'ITC', 'WIPRO'];
    const types = ['price_alert', 'volume_spike', 'news_update', 'prediction_update'];
    const stock = stocks[Math.floor(Math.random() * stocks.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let notification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    switch (type) {
      case 'price_alert':
        const change = (Math.random() - 0.5) * 10; // -5% to +5%
        notification = {
          ...notification,
          type: 'price_alert',
          title: `${stock} Price Alert`,
          message: `${stock} has ${change > 0 ? 'gained' : 'lost'} ${Math.abs(change).toFixed(2)}% in the last hour`,
          severity: change > 0 ? 'success' : 'warning',
          icon: change > 0 ? 'trending_up' : 'trending_down',
          stock,
        };
        break;
      case 'volume_spike':
        notification = {
          ...notification,
          type: 'volume_spike',
          title: `${stock} Volume Spike`,
          message: `Unusual trading volume detected for ${stock}`,
          severity: 'info',
          icon: 'info',
          stock,
        };
        break;
      case 'news_update':
        notification = {
          ...notification,
          type: 'news_update',
          title: `${stock} News Update`,
          message: `Breaking news may impact ${stock} stock price`,
          severity: 'info',
          icon: 'info',
          stock,
        };
        break;
      case 'prediction_update':
        notification = {
          ...notification,
          type: 'prediction_update',
          title: `${stock} Prediction Updated`,
          message: `New AI prediction available for ${stock}`,
          severity: 'success',
          icon: 'success',
          stock,
        };
        break;
      default:
        return;
    }

    addNotification(notification);
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only 50 notifications
    
    // Show snackbar for new notification
    setCurrentSnackbar(notification);
    setSnackbarOpen(true);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'trending_up':
        return <TrendingUpIcon />;
      case 'trending_down':
        return <TrendingDownIcon />;
      case 'info':
        return <InfoIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <IconButton
        onClick={handleMenuOpen}
        sx={{
          position: 'relative',
          color: darkMode ? '#ffffff' : '#000000',
          '&:hover': {
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            borderRadius: 2,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            <Box>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  sx={{ mr: 1, fontSize: '0.75rem' }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton size="small" onClick={clearAllNotifications}>
                <ClearAllIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <MenuItem
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 1.5,
                  px: 2,
                  borderBottom: index < notifications.length - 1 ? `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` : 'none',
                  backgroundColor: !notification.read ? (darkMode ? 'rgba(100, 181, 246, 0.1)' : 'rgba(33, 150, 243, 0.05)') : 'transparent',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1 }}>
                  <Box sx={{ color: `${notification.severity}.main`, mt: 0.5 }}>
                    {getIcon(notification.icon)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: !notification.read ? 600 : 400 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatTime(notification.timestamp)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>

      {/* Snackbar for new notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'left' }}
      >
        {currentSnackbar && (
          <Alert
            onClose={handleSnackbarClose}
            severity={currentSnackbar.severity}
            variant="filled"
            sx={{
              borderRadius: 2,
              boxShadow: darkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                : '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <AlertTitle>{currentSnackbar.title}</AlertTitle>
            {currentSnackbar.message}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default NotificationSystem;