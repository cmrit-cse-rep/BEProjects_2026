import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  Snackbar,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const ContactCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const ContactForm = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
  },
}));

const ContactIconBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
}));

const Contact = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // In a real application, you would send this data to your backend
      console.log('Form submitted:', formData);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Your message has been sent successfully! We will get back to you soon.',
        severity: 'success',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <GradientText variant="h2" component="h1" gutterBottom>
            Contact Us
          </GradientText>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ maxWidth: 700, mx: 'auto' }}
          >
            Have questions about our platform or need assistance? We're here to help!
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {/* Contact Information */}
          <Grid item xs={12} md={5}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h2" fontWeight="700" gutterBottom>
                Get In Touch
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Our team is ready to answer your questions and help you get the most out of our platform.
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ContactCard elevation={2}>
                  <CardContent>
                    <ContactIconBox>
                      <IconWrapper>
                        <EmailIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="h6" fontWeight="600">
                          Email Us
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          bibh22cs@cmrit.ac.in
                        </Typography>
                      </Box>
                    </ContactIconBox>
                  </CardContent>
                </ContactCard>
              </Grid>
              
              <Grid item xs={12}>
                <ContactCard elevation={2}>
                  <CardContent>
                    <ContactIconBox>
                      <IconWrapper>
                        <PhoneIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="h6" fontWeight="600">
                          Call Us
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          7843087955
                        </Typography>
                      </Box>
                    </ContactIconBox>
                  </CardContent>
                </ContactCard>
              </Grid>
              
              <Grid item xs={12}>
                <ContactCard elevation={2}>
                  <CardContent>
                    <ContactIconBox>
                      <IconWrapper>
                        <LocationIcon />
                      </IconWrapper>
                      <Box>
                        <Typography variant="h6" fontWeight="600">
                          Visit Us
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          CMRIT bangalore
                        </Typography>
                      </Box>
                    </ContactIconBox>
                  </CardContent>
                </ContactCard>
              </Grid>
            </Grid>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <ContactForm elevation={3}>
              <Typography variant="h4" component="h2" fontWeight="700" gutterBottom>
                Send Us A Message
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                Fill out the form below and we'll get back to you as soon as possible.
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      error={!!errors.subject}
                      helperText={errors.subject}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Your Message"
                      name="message"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      error={!!errors.message}
                      helperText={errors.message}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <SubmitButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      endIcon={<SendIcon />}
                      fullWidth
                    >
                      Send Message
                    </SubmitButton>
                  </Grid>
                </Grid>
              </form>
            </ContactForm>
          </Grid>
        </Grid>
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Contact; 