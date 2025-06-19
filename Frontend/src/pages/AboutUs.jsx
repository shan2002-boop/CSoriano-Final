import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Fade,
} from '@mui/material';
import personImage from '../assets/csoriano.jpg';
import Header from '../components/Header';
import Footer from "../components/Footer";

const AboutUs = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        {/* Header Component */}
        <Header />

        {/* About Us Section */}
        <Box sx={{ textAlign: "center", pt: 10, pb: 6  }}>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start", // Align items to the top
            justifyContent: "center",
            gap: { xs: 2, md: 11 }, // Adjust the gap between text and image
            px: 2,
          }}
        >
          {/* Text Container */}
          <Fade in={isVisible} timeout={1000}>
            <Box
              sx={{
                flex: 1,
                textAlign: { xs: "center", md: "justify" },
                maxWidth: "600px",
                px: 2,
              }}
            >
              <Typography
                variant="h4"
                sx={{ color: "#3f5930", fontWeight: "bold", mb: 2, textAlign: "start" }}
              >
                About Us
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#3f5930",
                  lineHeight: 1.8,
                  textAlign: "justify",
                }}
              >
                C. Soriano Construction & Supply is a proudly homegrown construction company based in Iloilo City, Philippines. Founded on a commitment to quality, integrity, and innovation, we specialize in residential design-and-build solutions tailored to the unique needs of every client. From initial concept to final build, our team ensures that every project is delivered on time, on budget, and above expectation.
With years of experience in the local construction industry, we’ve earned a reputation for reliable craftsmanship and personalized service. Whether it's a family home in Jaro or a rest house in the hills of Leon, we approach every project with the same dedication—as if it were our own. At C. Soriano Construction, we don’t just build structures—we build trust, lasting relationships, and homes where families thrive.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#3f5930",
                    fontStyle: "italic",
                    textAlign: "start",
                  }}
                >
                  C. Soriano Construction & Supply
                </Typography>
              </Box>
            </Box>
          </Fade>

          {/* Image Container */}
          <Fade in={isVisible} timeout={1000}>
            <Box
              component="img"
              src={personImage}
              alt="C. Soriano Construction & Supply"
              sx={{
                zIndex: 1,
                flex: 1,
                width: { xs: "80%", sm: "60%", md: "300px", lg: "300px", xl: "300px" },
                maxHeight: "550px", // Ensure the image doesn't grow too large
                maxWidth: "550px",
                boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)",
                mx: { xs: "auto", md: 0 },
              }}
            />
          </Fade>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default AboutUs;
