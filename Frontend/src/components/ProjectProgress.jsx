import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Button,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuthContext } from '../hooks/useAuthContext';
import Navbar from './Navbar';
import styles from '../css/ProjectProgress.module.css';
import { jsPDF } from 'jspdf'; // Import jsPDF for PDF generation
import 'jspdf-autotable'; // Import autoTable plugin for jsPDF
import foxconrights from '../assets/foxconrights.jpg'; // Assuming you want to include a logo in the BOM PDF

const ProjectProgress = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`https://foxconstruction-final.onrender.com/api/project/${projectId}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        const fetchedProject = response.data.project || response.data;
        setProject(fetchedProject);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) {
      fetchProject();
    }
  }, [projectId, user?.token]);

  const handleFloorClick = (floorId) => {
    setSelectedFloor(selectedFloor === floorId ? null : floorId);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image); // Open modal with clicked image
  };

  const handleCloseModal = () => {
    setSelectedImage(null); // Close modal
  };

  // Function to generate and download the BOM PDF
  const handleDownloadBOM = () => {
    if (!project || !project.bom) {
      console.error('No BOM data available.');
      return;
    }

    const { bom, name } = project;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20; // Starting y position for details

    // Add the logo at the top
    const imgWidth = pageWidth - 40; // Adjust width to make it centered and smaller than page width
    const imgHeight = imgWidth * 0.2; // Maintain aspect ratio
    doc.addImage(foxconrights, 'JPEG', 20, 10, imgWidth, imgHeight);
    yPosition += imgHeight + 10; // Adjust y position below the logo

    // Add Title
    doc.setFontSize(18);
    doc.text(`Client BOM: ${name || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.setFontSize(12);
    yPosition += 10;

    // Project details
    doc.text(`Total Area: ${bom.projectDetails.totalArea || 'N/A'} sqm`, 10, yPosition);
    yPosition += 10;
    doc.text(`Number of Floors: ${bom.projectDetails.numFloors || 'N/A'}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Floor Height: ${bom.projectDetails.avgFloorHeight || 'N/A'} meters`, 10, yPosition);
    yPosition += 10;

    // BOM Grand Total
    const grandTotal = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
      bom.markedUpCosts.totalProjectCost || 0
    )}`;
    doc.setFontSize(14);
    doc.text(`Grand Total: ${grandTotal}`, 10, yPosition);
    yPosition += 15;

    // BOM Categories
    doc.autoTable({
      head: [['#', 'Category', 'Total Amount (PHP)']],
      body: bom.categories.map((category, index) => [
        index + 1,
        category.category.toUpperCase(),
        `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
          category.materials.reduce((sum, material) => sum + material.totalAmount, 0)
        )}`,
      ]),
      startY: yPosition,
      headStyles: { fillColor: [41, 128, 185] },
      bodyStyles: { textColor: [44, 62, 80] },
    });

    // Save the PDF
    doc.save(`Client_BOM_${name}.pdf`);
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading project details...
        </Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <Typography variant="h6">Project not found.</Typography>
      </Box>
    );
  }

  const startDate = new Date(project.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.container}>
      <Navbar />
      <Box p={3}>
        <Typography variant="h4" gutterBottom className={styles.title}>
          {project.name ? project.name.toUpperCase() : 'Untitled Project'}
        </Typography>
        <Typography className={styles.dateTitle} variant="body1" gutterBottom>
          Started on: {startDate}
        </Typography>
        <Typography variant="body1" gutterBottom className={styles.progressTitle}>
          STATUS: {project.status ? project.status.toUpperCase() : 'UNKNOWN'}
        </Typography>

        {/* Download BOM Button */}
        {project.bom && (
          <Box mt={2}>
            <Button variant="contained" color="secondary" onClick={handleDownloadBOM}>
              Download your BOM
            </Button>
          </Box>
        )}

        <Box mt={8}>
          {project.floors &&
            project.floors.map((floor) => (
              <Accordion
                key={floor._id}
                expanded={selectedFloor === floor._id}
                onChange={() => handleFloorClick(floor._id)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">{floor.name}</Typography>
                    <Box width="40%">
                      <LinearProgress
                        variant="determinate"
                        value={floor.progress || 0}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          [`& .MuiLinearProgress-bar`]: {
                            backgroundColor: '#a7b194',
                          },
                          backgroundColor: '#e0e0e0',
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" align="center">
                        {Math.round(floor.progress || 0)}%
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
  <Typography variant="h6">Tasks</Typography>

   {/* Floor Images */}
   {floor.images && floor.images.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                    {floor.images.map((image, index) => (
                      <Box key={index} textAlign="center" onClick={() => handleImageClick(image)}>
                        <img
                          src={image.path}
                          alt={`Floor ${floor.name} Image ${index + 1}`}
                          style={{
                            width: '150px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        />
                        <Typography variant="body2" mt={1}>
                          {image.remark || 'No remark'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
  )}

  {/* Task Images */}
{floor.tasks &&
  floor.tasks.map((task) => (
    <Box key={task._id} mb={4}>
      {/* Task Name and Progress Bar */}
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="body1" sx={{ flex: 1 }}>
          {task.name || 'Unnamed Task'}
        </Typography>
        <Typography variant="body2" sx={{ marginLeft: 2 }}>
          {Math.round(task.progress || 0)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={task.progress || 0}
        sx={{
          height: 10,
          borderRadius: 5,
          [`& .MuiLinearProgress-bar`]: {
            backgroundColor: '#a7b194',
          },
          backgroundColor: '#e0e0e0',
        }}
      />

      {/* Task Images */}
      {task.images && task.images.length > 0 && (
        <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
          {task.images.map((image, index) => (
            <Box key={index} textAlign="center" onClick={() => handleImageClick(image)}>
              <img
                src={image.path}
                alt={`Task ${task.name} Image ${index + 1}`}
                style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              />
              <Typography variant="body2" mt={1}>
                {image.remark || 'No remark'}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  ))}

              </AccordionDetails>
            </Accordion>
          ))}
      </Box>

      {/* Modal for Full-View Image */}
      <Dialog open={!!selectedImage} onClose={handleCloseModal} maxWidth="lg" fullWidth  PaperProps={{
        style: {
          backgroundColor: 'transparent', // Remove default white background
          boxShadow: 'none', // Remove shadow
        },
      }}>
        <DialogContent sx={{ position: 'relative' }}>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage.path}
              alt={selectedImage.remark || 'Full view'}
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
          )}
          {selectedImage?.remark && (
            <Typography variant="body1" align="center" mt={2}>
              {selectedImage.remark}
            </Typography>
          )}
        </DialogContent>
      </Dialog>

        <Typography variant="body2" color="textSecondary" mt={4}>
          LAST UPDATE:{' '}
          {project.updatedAt
            ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'No updates available'}
        </Typography>
      </Box>
    </div>
  );
};

export default ProjectProgress;
