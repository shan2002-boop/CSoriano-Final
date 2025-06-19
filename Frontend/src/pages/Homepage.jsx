import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import HeroImage from "../assets/bgCons.png"; // Replace with your image path
import Header from '../components/Header';

const Homepage = () => {
  const [isTextLoaded, setIsTextLoaded] = useState(false);

  useEffect(() => {
    // Set isTextLoaded to true after a slight delay to trigger the fade-in effect
    const textLoadTimeout = setTimeout(() => {
      setIsTextLoaded(true);
    }, 300); // Adjust delay as needed

    return () => {
      clearTimeout(textLoadTimeout); // Clean up the timeout
    };
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Header Component */}
      <Header />

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 64px)', // Adjust height to fit below the header
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          mt: '64px', // Margin top to account for fixed header
        }}
      >
        <img
          src={HeroImage}
          alt="Hero"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center bottom', // Adjust this to focus on the lower section
            zIndex: -1,
          }}
        />
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            opacity: isTextLoaded ? 1 : 0,
            transition: 'opacity 2s ease-in-out',
            zIndex: 1,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            BUILDING YOUR DREAMS.
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            CREATING REALITY.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Homepage;
