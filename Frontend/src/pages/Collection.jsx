import React, { useState, useEffect } from "react";
import { Box, Typography, ButtonBase } from "@mui/material";
import Image1 from "../assets/residential1.jpg";
import Image2 from "../assets/residential2.jpg";
import Image3 from "../assets/residential3.jpg";
import Image4 from "../assets/residential4.jpg";
import Image5 from "../assets/residential5.jpg";
import Image6 from "../assets/residential6.jpg";
import Header from "../components/Header";

const Collection = () => {
  const collections = [
    { title: "Residential 1", image: Image1 },
    { title: "Residential 2", image: Image2 },
    { title: "Residential 3", image: Image3 },
    { title: "Residential 4", image: Image4 },
    { title: "Residential 5", image: Image5 },
    { title: "Residential 6", image: Image6 },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % collections.length);
    }, 3000); // Carousel interval time

    return () => clearInterval(interval);
  }, [collections.length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", pb: 4 }}>
      {/* Header Component */}
      <Header />

      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          color: "#3f5930",
          mt: 1,
        }}
      >
        Our Collections
      </Typography>

      {/* Carousel Container */}
      <Box
        sx={{
          position: "relative",
          width: "90%",
          maxWidth: "1200px",
          mx: "auto",
          mt: 3,
          overflow: "hidden",
          borderRadius: "10px",
          boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Carousel Inner */}
        <Box
          sx={{
            display: "flex",
            transition: "transform 0.8s ease-in-out",
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {collections.map((collection, index) => (
            <Box
              key={index}
              sx={{
                flex: "0 0 100%",
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={collection.image}
                alt={collection.title}
                sx={{
                  width: "100%",
                  height: { xs: "300px", md: "600px" },
                  objectFit: "cover",
                }}
              />
              {/* Overlay with Title */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  textAlign: "center",
                  py: 2,
                  fontSize: { xs: "1rem", md: "1.5rem" },
                  fontWeight: "bold",
                }}
              >
                {collection.title}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Dots for Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 3,
        }}
      >
        {collections.map((_, index) => (
          <ButtonBase
            key={index}
            onClick={() => handleDotClick(index)}
            sx={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              bgcolor: currentIndex === index ? "#3f5930" : "#ccc",
              m: 0.5,
              transition: "background-color 0.3s ease",
              "&:hover": {
                bgcolor: "#3f5930",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Collection;
