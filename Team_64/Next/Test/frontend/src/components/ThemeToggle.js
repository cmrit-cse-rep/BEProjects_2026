import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledToggle = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'rotate(10deg)',
  },
}));

const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
      <StyledToggle color="inherit" onClick={toggleDarkMode} size="large">
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </StyledToggle>
    </Tooltip>
  );
};

export default ThemeToggle; 