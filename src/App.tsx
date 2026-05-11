import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
      />
      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - 280px)` } }}>
        <ChatArea onDrawerToggle={handleDrawerToggle} />
      </Box>
    </Box>
  );
}

export default App;
