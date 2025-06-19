import React from "react";
import { Box } from "@mui/material";

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#3f5930", // Green color
        height: "180px", // Adjust the height as needed
        position: "fixed", // Ensures it stays at the bottom
        bottom: 0,
        width: "100%", // Stretches across the entire screen
        zIndex: 0,
      }}
    />
  );
};

export default Footer;
