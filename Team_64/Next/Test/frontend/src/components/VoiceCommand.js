import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Alert,
  Zoom,
  Pulse,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Divider,
} from '@mui/material';
import {
  MicOutlined as MicIcon,
  MicOffOutlined as MicOffIcon,
  CloseOutlined as CloseIcon,
  GraphicEqOutlined as SoundWaveIcon,
  WifiOutlined as NetworkIcon,
  SecurityOutlined as PermissionIcon,
  HelpOutlineOutlined as HelpIcon,
  RefreshOutlined as RefreshIcon,
} from '@mui/icons-material';

const VoiceCommand = ({ darkMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    try {
      setIsCheckingPermission(true);
      const permission = await navigator.permissions.query({ name: 'microphone' });
      
      if (permission.state === 'granted') {
        setHasPermission(true);
        return true;
      } else if (permission.state === 'prompt') {
        // Request permission by trying to access microphone
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
          setHasPermission(true);
          return true;
        } catch (err) {
          setHasPermission(false);
          setError('Microphone permission denied. Please allow microphone access and try again.');
          return false;
        }
      } else {
        setHasPermission(false);
        setError('Microphone permission denied. Please enable microphone access in your browser settings.');
        return false;
      }
    } catch (err) {
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      } catch (micErr) {
        setHasPermission(false);
        setError('Unable to access microphone. Please check your browser settings and permissions.');
        return false;
      }
    } finally {
      setIsCheckingPermission(false);
    }
  };

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript, event.results[0][0].confidence);
        }
      };

      recognition.onerror = (event) => {
        let errorMessage = '';
        switch (event.error) {
          case 'network':
            errorMessage = 'network';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check your microphone connection.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not available. Please try again later.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        setError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // Check microphone permission on component mount
      checkMicrophonePermission();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processVoiceCommand = (command, confidence) => {
    const lowerCommand = command.toLowerCase().trim();
    console.log('Processing command:', lowerCommand); // Debug log
    
    // Clean up common speech recognition artifacts
    const cleanCommand = lowerCommand
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[.,!?]/g, '') // Remove punctuation
      .trim();

    // Stock symbol patterns - more flexible
    const stockPatterns = [
      // Direct stock mentions
      /(?:show|display|open|get|find|search|view|check)\s+(?:stock|shares|price|chart|data|info|information)?\s*(?:for|of)?\s*([a-zA-Z]{2,10})/i,
      /(?:predict|forecast|prediction)\s+(?:stock|shares|price)?\s*(?:for|of)?\s*([a-zA-Z]{2,10})/i,
      /([a-zA-Z]{2,10})\s+(?:stock|shares|price|chart|prediction|forecast|analysis)/i,
      /(?:analyze|analysis|analyse)\s+([a-zA-Z]{2,10})/i,
      // Simple stock symbol mentions
      /^([a-zA-Z]{2,10})$/i,
      // Stock with action words
      /(?:stock|share|price)\s+([a-zA-Z]{2,10})/i,
      /([a-zA-Z]{2,10})\s+(?:price|value|data)/i,
    ];

    // Navigation patterns - more flexible
    const navigationPatterns = [
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?dashboard/i, route: '/dashboard' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?home(?:\s+page)?/i, route: '/' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?news/i, route: '/news' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?predictions?/i, route: '/predictions' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?portfolio/i, route: '/portfolio' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?compare/i, route: '/compare' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?about(?:\s+page)?/i, route: '/about' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?contact(?:\s+page)?/i, route: '/contact' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?sentiment/i, route: '/sentiment' },
      { pattern: /(?:go to|open|show|navigate to|visit)\s+(?:the\s+)?live/i, route: '/live' },
      // Simple navigation
      { pattern: /^dashboard$/i, route: '/dashboard' },
      { pattern: /^home$/i, route: '/' },
      { pattern: /^news$/i, route: '/news' },
      { pattern: /^predictions?$/i, route: '/predictions' },
      { pattern: /^portfolio$/i, route: '/portfolio' },
      { pattern: /^compare$/i, route: '/compare' },
      { pattern: /^about$/i, route: '/about' },
      { pattern: /^contact$/i, route: '/contact' },
      { pattern: /^sentiment$/i, route: '/sentiment' },
      { pattern: /^live$/i, route: '/live' },
    ];

    // Check for stock commands first
    for (const pattern of stockPatterns) {
      const match = cleanCommand.match(pattern);
      if (match && match[1]) {
        const symbol = match[1].toUpperCase();
        // Validate stock symbol (2-10 characters, letters only)
        if (/^[A-Z]{2,10}$/.test(symbol)) {
          if (cleanCommand.includes('predict') || cleanCommand.includes('forecast')) {
            navigate(`/predict/${symbol}`);
          } else {
            navigate(`/stock/${symbol}`);
          }
          setIsDialogOpen(false);
          return;
        }
      }
    }

    // Check for navigation commands
    for (const nav of navigationPatterns) {
      if (nav.pattern.test(cleanCommand)) {
        navigate(nav.route);
        setIsDialogOpen(false);
        return;
      }
    }

    // Special commands
    if (cleanCommand.includes('help') || cleanCommand.includes('what can you do')) {
      setError('Try commands like: "show stock TCS", "predict RELIANCE", "go to dashboard", "open news"');
      return;
    }

    // If no pattern matched, show error with suggestions
    setError('Command not recognized. Try saying "show stock TCS" or "predict RELIANCE"');
  };

  const startListening = async () => {
    if (recognitionRef.current && isSupported) {
      setIsDialogOpen(true);
      
      // Check permission before starting
      if (!hasPermission) {
        const permissionGranted = await checkMicrophonePermission();
        if (!permissionGranted) {
          return;
        }
      }
      
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('Failed to start speech recognition. Please try again.');
        console.error('Speech recognition start error:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const closeDialog = () => {
    stopListening();
    setIsDialogOpen(false);
    setTranscript('');
    setError('');
    setManualInput('');
    setShowManualInput(false);
  };

  const retryPermission = async () => {
    setError('');
    await checkMicrophonePermission();
  };

  const retryVoiceCommand = () => {
    setError('');
    setTranscript('');
    startListening();
  };

  const handleManualInput = () => {
    if (manualInput.trim()) {
      processVoiceCommand(manualInput.trim(), 1.0);
      setManualInput('');
      setShowManualInput(false);
    }
  };

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    setError('');
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <>
      <Fab
        color="primary"
        aria-label="voice command"
        onClick={startListening}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: darkMode 
            ? 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)'
            : 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: darkMode
              ? '0 8px 20px rgba(100, 181, 246, 0.4)'
              : '0 8px 20px rgba(33, 150, 243, 0.4)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <MicIcon />
      </Fab>

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SoundWaveIcon color="primary" />
            Voice Command
          </Typography>
          <IconButton onClick={closeDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {isListening ? (
              <Box>
                <Zoom in={isListening}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: darkMode
                        ? 'linear-gradient(45deg, #f44336 30%, #ff6b6b 90%)'
                        : 'linear-gradient(45deg, #e53e3e 30%, #fc8181 90%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.1)', opacity: 0.7 },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                      },
                    }}
                  >
                    <MicIcon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                </Zoom>
                <Typography variant="h6" color="primary" gutterBottom>
                  Listening...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Speak your command clearly
                </Typography>
                <IconButton
                  onClick={stopListening}
                  color="error"
                  size="large"
                  sx={{
                    background: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                    '&:hover': {
                      background: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
                    }
                  }}
                >
                  <MicOffIcon />
                </IconButton>
              </Box>
            ) : (
              <Box>
                <IconButton
                  onClick={startListening}
                  color="primary"
                  size="large"
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    background: darkMode ? 'rgba(100, 181, 246, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                    '&:hover': {
                      background: darkMode ? 'rgba(100, 181, 246, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                    }
                  }}
                >
                  <MicIcon sx={{ fontSize: 40 }} />
                </IconButton>
                <Typography variant="h6" gutterBottom>
                  Click to start voice command
                </Typography>
              </Box>
            )}

            {transcript && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Transcript:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  "{transcript}"
                </Typography>
                {confidence > 0 && (
                  <Chip
                    label={`Confidence: ${Math.round(confidence * 100)}%`}
                    size="small"
                    color={confidence > 0.7 ? 'success' : confidence > 0.5 ? 'warning' : 'error'}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            )}

            {error && (
              <Alert 
                severity="error" 
                sx={{ mt: 2, textAlign: 'left' }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={error === 'network' ? retryVoiceCommand : retryPermission}
                    startIcon={<RefreshIcon />}
                    disabled={isCheckingPermission}
                  >
                    {isCheckingPermission ? <CircularProgress size={16} /> : 'Retry'}
                  </Button>
                }
              >
                {error === 'network' 
                  ? 'Speech recognition requires an internet connection. The service may be temporarily unavailable. Please check your connection and try again.'
                  : error
                }
              </Alert>
            )}

            {/* Manual Input Fallback */}
            {(error === 'network' || showManualInput) && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Can't use voice? Type your command instead:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., TCS stock, RELIANCE prediction, dashboard"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleManualInput}
                    disabled={!manualInput.trim()}
                    sx={{ borderRadius: 2, minWidth: 80 }}
                  >
                    Go
                  </Button>
                </Box>
              </Box>
            )}

            {/* Toggle Manual Input Button */}
            {error !== 'network' && !showManualInput && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={toggleManualInput}
                  sx={{ borderRadius: 2 }}
                >
                  Type Command Instead
                </Button>
              </Box>
            )}

            {/* Troubleshooting Guide */}
            {error && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpIcon fontSize="small" />
                  Troubleshooting Tips:
                </Typography>
                <List dense>
                  {error.includes('network') && (
                    <ListItem>
                      <ListItemIcon>
                        <NetworkIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Check Internet Connection"
                        secondary="Voice recognition requires an active internet connection"
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  )}
                  {(error.includes('permission') || error.includes('microphone')) && (
                    <ListItem>
                      <ListItemIcon>
                        <PermissionIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Allow Microphone Access"
                        secondary="Click the microphone icon in your browser's address bar and allow access"
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon>
                      <MicIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Check Microphone"
                      secondary="Ensure your microphone is connected and working properly"
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.8rem' }}
                    />
                  </ListItem>
                </List>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Try saying:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {[
                  '"TCS stock"',
                  '"RELIANCE prediction"',
                  '"dashboard"',
                  '"news"',
                  '"INFY analysis"'
                ].map((example, index) => (
                  <Chip
                    key={index}
                    label={example}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCommand;