import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const FooterBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3, 0),
  marginTop: 'auto',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Footer = () => {
  return (
    <FooterBox component="footer">
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Stock Market Analysis
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
            }}
          >
            <Link href="/about" color="inherit" underline="hover">
              About
            </Link>
            <Link href="/privacy" color="inherit" underline="hover">
              Privacy
            </Link>
            <Link href="/terms" color="inherit" underline="hover">
              Terms
            </Link>
          </Box>
        </Box>
      </Container>
    </FooterBox>
  );
};

export default Footer; 