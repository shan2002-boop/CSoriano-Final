// src/components/Generator.jsx
import React, { useState, useContext, useEffect } from 'react';
import Axios from 'axios';
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import foxconrights from '../assets/foxconrights.jpg';
import AlertModal from '../components/AlertModal';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Close, SwapHoriz  } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const MaterialSearchModal = ({ isOpen, onClose, onMaterialSelect, materialToReplace, user }) => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen && user && user.token) {
      Axios.get('https://foxconstruction-final.onrender.com/api/materials', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          setMaterials(response.data);
          setFilteredMaterials(response.data);
        })
        .catch((error) => {
          console.error('Error fetching materials:', error);
        });
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter((material) =>
        (material.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaterials(filtered);
    }
  }, [searchTerm, materials]);

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Replace Material: {materialToReplace?.description || ''}
        <IconButton onClick={onClose} style={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          variant="outlined"
          label="Search materials"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          margin="dense"
        />
        {filteredMaterials.length > 0 ? (
          <TableContainer style={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Cost (₱)</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material._id} hover>
                    <TableCell>{material.description || 'No Description Available'}</TableCell>
                    <TableCell>{material.cost.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => onMaterialSelect(material)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No materials found</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const GeneratorModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  handleChange,
  errors,
  projects,
  handleProjectSelect,
  selectedProject,
  isProjectBased,
  locations,
  handleLocationSelect,
  selectedLocation,
  isLoadingProjects,
  isLoadingBOM,
  templates,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isProjectBased ? "Enter Base Template Details for Project" : "Enter Base Template Details"}
        <IconButton onClick={onClose} style={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isProjectBased && (
          <Box mb={2}>
            <FormControl fullWidth margin="dense">
              <InputLabel id="project-select-label">Select Project</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProject?._id || ''}
                onChange={(e) => handleProjectSelect(e.target.value)}
                label="Select Project"
              >
                <MenuItem value="" disabled>
                  Select a project
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {isLoadingProjects && (
              <Box display="flex" alignItems="center" mt={1}>
                <CircularProgress size={24} />
                <Typography ml={2}>Fetching projects...</Typography>
              </Box>
            )}
            {projects.length === 0 && !isLoadingProjects && (
              <Typography>No projects available</Typography>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          margin="dense"
          label="Total Area (sqm)"
          name="totalArea"
          type="number"
          value={formData.totalArea}
          onChange={handleChange}
          error={!!errors.totalArea}
          helperText={errors.totalArea}
          inputProps={{ min: 0 }}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Floor Height (meters)"
          name="avgFloorHeight"
          type="number"
          value={formData.avgFloorHeight}
          onChange={handleChange}
          error={!!errors.avgFloorHeight}
          helperText={errors.avgFloorHeight}
          inputProps={{ min: 0, max: 15 }}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Room Count"
          name="roomCount"
          type="number"
          value={formData.roomCount}
          onChange={handleChange}
          error={!!errors.roomCount}
          helperText={errors.roomCount}
          inputProps={{ min: 1 }}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Foundation Depth (meters)"
          name="foundationDepth"
          type="number"
          value={formData.foundationDepth}
          onChange={handleChange}
          error={!!errors.foundationDepth}
          helperText={errors.foundationDepth}
          inputProps={{ min: 0, step: 0.1 }}
        />

        {/* Select Location */}
        <FormControl fullWidth margin="dense">
          <InputLabel id="location-select-label">Select Location</InputLabel>
          <Select
            labelId="location-select-label"
            value={selectedLocation}
            onChange={(e) => handleLocationSelect(e.target.value)}
            label="Select Location"
          >
            <MenuItem value="" disabled>
              Select a location
            </MenuItem>
            {locations.map((location) => (
              <MenuItem key={location._id} value={location.name}>
                {location.name} - {location.markup}% markup
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {errors.location && <Typography color="error">{errors.location}</Typography>}

        {isProjectBased ? (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Number of Floors (from project)"
              name="numFloors"
              type="number"
              value={formData.numFloors || ''}
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Template (from project)"
              name="selectedTemplateId"
              value={
                templates.find((t) => t._id === formData.selectedTemplateId)?.title || ''
              }
              InputProps={{ readOnly: true }}
            />
          </>
        ) : (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Number of Floors"
              name="numFloors"
              type="number"
              value={formData.numFloors}
              onChange={handleChange}
              error={!!errors.numFloors}
              helperText={errors.numFloors}
              inputProps={{ min: 1, max: 5 }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="template-select-label">Select Template</InputLabel>
              <Select
                labelId="template-select-label"
                name="selectedTemplateId"
                value={formData.selectedTemplateId}
                onChange={handleChange}
                label="Select Template"
              >
                <MenuItem value="" disabled>
                  Select a template
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template._id} value={template._id}>
                    {template.title} (
                    {template.tier.charAt(0).toUpperCase() + template.tier.slice(1)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.selectedTemplateId && (
              <Typography color="error">{errors.selectedTemplateId}</Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="secondary"
          disabled={isLoadingBOM}
        >
          {isLoadingBOM ? 'Generating BOM...' : 'Generate BOM'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Generator = () => {
  const [formData, setFormData] = useState({
    totalArea: '',
    avgFloorHeight: '',
    selectedTemplateId: '',
    numFloors: '',
    roomCount: '',
    foundationDepth: '',
  });
  const [errors, setErrors] = useState({});
  const [bom, setBom] = useState(null);
  const [serverError, setServerError] = useState(null);
  const { user } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectBased, setIsProjectBased] = useState(false);
  const [materialToReplace, setMaterialToReplace] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingBOM, setIsLoadingBOM] = useState(false);

  // Alert Modal States
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info"); // Default type

  // Function to show alerts
  const showAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };


  useEffect(() => {
    if (user && user.token) {
      setIsLoadingProjects(true);

      // Fetch projects for the contractor
      Axios.get(`https://foxconstruction-final.onrender.com/api/project/contractor`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          setProjects(response.data);
        })
        .catch((error) => {
          console.error("Error fetching projects:", error);
          showAlert("Error", "Failed to fetch projects. Please try again later.", "error");
        })
        .finally(() => {
          setIsLoadingProjects(false);
        });

      // Fetch locations
      Axios.get('https://foxconstruction-final.onrender.com/api/locations', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          setLocations(response.data);
        })
        .catch((error) => {
          console.error("Error fetching locations:", error);
          showAlert("Error", "Failed to fetch locations. Please try again later.", "error");
        });

      // Fetch templates
      Axios.get('https://foxconstruction-final.onrender.com/api/templates', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          // Define the desired order
      const desiredOrder = ['economy', 'standard', 'premium'];

      // Sort the templates based on 'tier' property
      const sortedTemplates = [...response.data.templates].sort((a, b) => {
        const tierA = (a.tier || '').toLowerCase();
        const tierB = (b.tier || '').toLowerCase();
        return desiredOrder.indexOf(tierA) - desiredOrder.indexOf(tierB);
      });
          setTemplates(sortedTemplates);
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
          showAlert("Error", "Failed to fetch templates. Please try again later.", "error");
        });
    } else {
      console.error("User is not authenticated or token is missing");
      showAlert("Authentication Error", "User is not authenticated. Please log in again.", "error");
    }
  }, [user]);

  const handleProjectSelect = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    if (project) {
      setSelectedProject(project);
      setFormData({
        totalArea: project.totalArea || '',
        avgFloorHeight: project.avgFloorHeight || '',
        selectedTemplateId: project.template || '',
        numFloors: project.floors.length.toString(),
        roomCount: project.roomCount || '',
        foundationDepth: project.foundationDepth || ''
      });
      setSelectedLocation(project.location);
    }
  };

  const handleGenerateBOMPDF = (version = 'client') => {
    if (!bom) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Add the logo at the top
    const imgWidth = pageWidth - 40;
    const imgHeight = imgWidth * 0.2;
    doc.addImage(foxconrights, 'JPEG', 20, 10, imgWidth, imgHeight);
    yPosition += imgHeight + 10;

    doc.setFontSize(18);
    doc.text("Generated BOM: Custom Generation", pageWidth / 2, yPosition, { align: 'center' });
    doc.setFontSize(12);
    yPosition += 10;

    // Project details
    doc.text(`Total Area: ${bom.projectDetails.totalArea} sqm`, 10, yPosition);
    yPosition += 10;
    doc.text(`Number of Floors: ${bom.projectDetails.numFloors}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Floor Height: ${bom.projectDetails.avgFloorHeight} meters`, 10, yPosition);
    yPosition += 10;

    if (version === 'client') {
      const formattedGrandTotal = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}`;
      doc.setFontSize(14);
      doc.text(`Grand Total: ${formattedGrandTotal}`, 10, yPosition);
      yPosition += 15;

      // Add the summary table for high-level categories
      doc.autoTable({
        head: [['#', 'Category', 'Total Amount (PHP)']],
        body: bom.categories.map((category, index) => [
          index + 1,
          category.category.toUpperCase(),
          `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
            category.materials.reduce((sum, material) => sum + material.totalAmount, 0)
          )}`
        ]),
        startY: yPosition,
        headStyles: { fillColor: [41, 128, 185] },
        bodyStyles: { textColor: [44, 62, 80] },
      });
    } else if (version === 'contractor') {
      // Contractor-specific details
      const originalProjectCost = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(bom.originalCosts.totalProjectCost || 0)}`;
      const originalLaborCost = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(bom.originalCosts.laborCost || 0)}`;
      const markup = bom.projectDetails.location.markup;
      const markedUpProjectCost = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}`;
      const markedUpLaborCost = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(bom.markedUpCosts.laborCost || 0)}`;

      doc.setFontSize(14);
      doc.text("Contractor Cost Breakdown", 10, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text(`Original Project Cost (without markup): ${originalProjectCost}`, 10, yPosition);
      yPosition += 10;
      doc.text(`Original Labor Cost (without markup): ${originalLaborCost}`, 10, yPosition);
      yPosition += 10;
      doc.text(`Location: ${bom.projectDetails.location.name} (Markup: ${markup}%)`, 10, yPosition);
      yPosition += 10;
      doc.text(`Marked-Up Project Cost: ${markedUpProjectCost}`, 10, yPosition);
      yPosition += 10;
      doc.text(`Marked-Up Labor Cost: ${markedUpLaborCost}`, 10, yPosition);
      yPosition += 20;

      // Detailed table with totals for each category
      bom.categories.forEach((category, categoryIndex) => {
        doc.setFontSize(12);
        doc.text(category.category.toUpperCase(), 10, yPosition);
        yPosition += 5;

        doc.autoTable({
          head: [['Item', 'Description', 'Quantity', 'Unit', 'Unit Cost (PHP)','Total Amount (PHP)']],
          body: category.materials.map((material, index) => [
            `${categoryIndex + 1}.${index + 1}`,
            material.description || 'N/A',
            material.quantity ? material.quantity.toFixed(2) : 'N/A',
            material.unit || 'N/A',
            `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.cost)}`,
            `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.totalAmount)}`
          ]),
          startY: yPosition,
          headStyles: { fillColor: [41, 128, 185] },
          bodyStyles: { textColor: [44, 62, 80] },
        });

        yPosition = doc.lastAutoTable.finalY + 5;

        // Add total for each category
        const categoryTotal = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
          category.materials.reduce((sum, material) => sum + material.totalAmount, 0)
        )}`;
        doc.text(`Total for ${category.category.toUpperCase()}: ${categoryTotal}`, 10, yPosition);
        yPosition += 15;
      });
    }

    // Save the PDF with the selected version
    doc.save(`BOM_${version}.pdf`);
  };

  const handleLocationSelect = (locationName) => {
    setSelectedLocation(locationName);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedFormData = { ...formData };

    if (name === 'numFloors') {
      if (value > 5) {
        updatedFormData[name] = 5;
        setErrors({ ...errors, numFloors: 'Maximum allowed floors is 5. Resetting to 5.' });
        showAlert("Validation Error", "Maximum allowed floors is 5. Resetting to 5.", "error");
      } else {
        updatedFormData[name] = value;
        setErrors({ ...errors, numFloors: '' });
      }
    } else if (name === 'avgFloorHeight') {
      if (value > 15) {
        updatedFormData[name] = 15;
        setErrors({ ...errors, avgFloorHeight: 'Maximum floor height is 15 meters. Resetting to 15.' });
        showAlert("Validation Error", "Maximum floor height is 15 meters. Resetting to 15.", "error");
      } else if (value < 0) {
        updatedFormData[name] = 0;
        setErrors({ ...errors, avgFloorHeight: 'Floor height cannot be negative. Resetting to 0.' });
        showAlert("Validation Error", "Floor height cannot be negative. Resetting to 0.", "error");
      } else {
        updatedFormData[name] = value;
        setErrors({ ...errors, avgFloorHeight: '' });
      }
    } else {
      updatedFormData[name] = value;
    }

    setFormData(updatedFormData);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['totalArea', 'avgFloorHeight', 'roomCount', 'foundationDepth'];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    if (!selectedLocation) {
      newErrors.location = 'Please select a location';
      showAlert("Validation Error", "Please select a location.", "error");
    }

    if (isProjectBased) {
      if (!selectedProject || !formData.numFloors || !formData.selectedTemplateId) {
        newErrors.project = 'Please select a project and ensure it has the necessary details.';
        showAlert("Validation Error", "Please select a project and ensure it has the necessary details.", "error");
      }
    } else {
      if (!formData.numFloors) {
        newErrors.numFloors = 'This field is required';
        showAlert("Validation Error", "Number of floors is required.", "error");
      }
      if (!formData.selectedTemplateId) {
        newErrors.selectedTemplateId = 'Please select a template';
        showAlert("Validation Error", "Please select a template.", "error");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError(null);

    if (validateForm()) {
      setIsLoadingBOM(true);
      const payload = {
        totalArea: parseFloat(formData.totalArea),
        numFloors: parseInt(formData.numFloors, 10),
        avgFloorHeight: parseFloat(formData.avgFloorHeight),
        templateId: formData.selectedTemplateId,
        locationName: selectedLocation,
        roomCount: parseInt(formData.roomCount, 10),
        foundationDepth: parseFloat(formData.foundationDepth)
      };

      Axios.post(`https://foxconstruction-final.onrender.com/api/bom/generate`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          setBom(response.data.bom);
          setModalOpen(false);
          showAlert("Success", "BOM generated successfully.", "success");
        })
        .catch((error) => {
          console.error('Error generating BOM:', error);
          if (error.response && error.response.data && error.response.data.error) {
            setServerError(error.response.data.error);
            showAlert("Error", error.response.data.error, "error");
          } else {
            setServerError('An unexpected error occurred.');
            showAlert("Error", "An unexpected error occurred.", "error");
          }
        })
        .finally(() => {
          setIsLoadingBOM(false);
        });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setBom(null);
    setFormData({
      totalArea: '',
      avgFloorHeight: '',
      selectedTemplateId: '',
      numFloors: '',
      roomCount: '',
      foundationDepth: '',
    });
    setSelectedProject(null);
    setSelectedLocation("");
    setErrors({});
  };

  const handleReplaceClick = (material) => {
    setMaterialToReplace(material);
    setMaterialModalOpen(true);
  };

  const handleMaterialSelect = (newMaterial) => {
    if (materialToReplace && bom) {
      // Update the materials with the selected replacement material and recalculate total amounts
      const updatedCategories = bom.categories.map((category) => {
        const updatedMaterials = category.materials.map((material) => {
          if (material._id === materialToReplace._id) {
            return {
              ...material,
              description: newMaterial.description,
              cost: parseFloat(newMaterial.cost),
              totalAmount: parseFloat((parseFloat(material.quantity) * parseFloat(newMaterial.cost)).toFixed(2)),

            };
          }
          return material;
        });
      
        const categoryTotal = updatedMaterials.reduce((sum, material) => sum + (parseFloat(material.totalAmount) || 0), 0);
      
        return { ...category, materials: updatedMaterials, categoryTotal: parseFloat(categoryTotal.toFixed(2)) };
      });
      
  
      // Recalculate the project cost and marked-up cost
      const { originalTotalProjectCost, markedUpTotalProjectCost } = calculateUpdatedCosts({
        ...bom,
        categories: updatedCategories,
      });
  
      // Update BOM state to trigger re-render
      setBom({
        ...bom,
        categories: updatedCategories,
        originalCosts: {
          ...bom.originalCosts,
          totalProjectCost: originalTotalProjectCost,
        },
        markedUpCosts: {
          ...bom.markedUpCosts,
          totalProjectCost: markedUpTotalProjectCost,
        },
      });
  
      // Close the material replacement modal and show success alert
      setMaterialModalOpen(false);
      showAlert("Success", "Material replaced successfully.", "success");
    }
  };
  

  const calculateUpdatedCosts = (bom) => {
    const totalMaterialsCost = bom.categories.reduce((sum, category) => {
      const categoryTotal = category.materials.reduce((subSum, material) => {
        const materialTotal = parseFloat(material.totalAmount) || 0;
        return subSum + materialTotal;
      }, 0);
      return sum + categoryTotal;
    }, 0);
  
    const originalLaborCost = parseFloat(bom.originalCosts.laborCost) || 0;
    const originalTotalProjectCost = totalMaterialsCost + originalLaborCost;
  
    const markupPercentage = parseFloat(bom.projectDetails.location.markup) / 100 || 0;
    const markedUpTotalProjectCost = originalTotalProjectCost + (originalTotalProjectCost * markupPercentage);
  
    return {
      originalTotalProjectCost,
      markedUpTotalProjectCost,
    };
  };
  
  

  const handleSaveBOM = () => {
    if (!selectedProject || !selectedProject._id) {
      showAlert("Error", "No project selected. Please select a project before saving.", "error");
      return;
    }
  
    const payload = {
      bom: {
        projectDetails: bom.projectDetails,
        categories: bom.categories,
        originalCosts: bom.originalCosts,
        markedUpCosts: bom.markedUpCosts,
      },
    };
    console.log('Selected Project ID:', selectedProject._id);

    Axios.post(`https://foxconstruction-final.onrender.com/api/project/${selectedProject._id}/boms`, payload, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(() => {
        showAlert("Success", "BOM saved to the project!", "success");
      })
      .catch((error) => {
        console.error('Failed to save BOM to project:', error.response || error.message || error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save BOM to the project.';
        showAlert("Error", errorMessage, "error");
      });
  };
  

  const theme = createTheme({
    palette: {
      primary: {
        main: '#a7b194', // Set your desired color here
      },
      secondary: {
        main: '#6f7d5e', // Optional: Set a complementary secondary color
      },
    },
  });

  return (
    <>
     <ThemeProvider theme={theme}>
      <Navbar />
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Generate BOM</Typography>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => { setIsProjectBased(true); setModalOpen(true); }}
              sx={{ mr: 2 }}
            >
              Generate BOM with Project
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => { setIsProjectBased(false); setModalOpen(true); }}
            >
              Custom Generate BOM 
            </Button>
          </Box>
        </Box>

        <GeneratorModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          errors={errors}
          projects={projects}
          handleProjectSelect={handleProjectSelect}
          selectedProject={selectedProject}
          isProjectBased={isProjectBased}
          locations={locations}
          handleLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          isLoadingProjects={isLoadingProjects}
          isLoadingBOM={isLoadingBOM}
          templates={templates}
        />

        {bom && (
          <>
            <Box mt={4}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h5">Project Details</Typography>
                {isProjectBased && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSaveBOM}
                  >
                    Save BOM to Project
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table>
                  <TableBody>
                    {isProjectBased && selectedProject && (
                      <>
                        <TableRow>
                          <TableCell><strong>Project Name</strong></TableCell>
                          <TableCell>{selectedProject.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Project Owner</strong></TableCell>
                          <TableCell>{selectedProject.user}</TableCell>
                        </TableRow>
                      </>
                    )}
                    <TableRow>
                      <TableCell><strong>Total Area</strong></TableCell>
                      <TableCell>{bom.projectDetails.totalArea} sqm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Number of Floors</strong></TableCell>
                      <TableCell>{bom.projectDetails.numFloors}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Room Count</strong></TableCell>
                      <TableCell>{bom.projectDetails.roomCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Floor Height</strong></TableCell>
                      <TableCell>{bom.projectDetails.avgFloorHeight} meters</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Foundation Depth</strong></TableCell>
                      <TableCell>{bom.projectDetails.foundationDepth} meters</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Location</strong></TableCell>
                      <TableCell>{bom.projectDetails.location.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Markup</strong></TableCell>
                      <TableCell>{bom.projectDetails.location.markup}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={4}>
                <Typography variant="h5">Cost Details</Typography>
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Original Labor Cost</strong></TableCell>
                        <TableCell>
                          {bom.originalCosts.laborCost ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(bom.originalCosts.laborCost) : 'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Original Total Project Cost</strong></TableCell>
                        <TableCell>
                          {bom.originalCosts.totalProjectCost ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(bom.originalCosts.totalProjectCost) : 'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Marked-Up Labor Cost</strong></TableCell>
                        <TableCell>
                          {bom.markedUpCosts.laborCost ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(bom.markedUpCosts.laborCost) : 'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Marked-Up Total Project Cost</strong></TableCell>
                        <TableCell>
                          {bom.markedUpCosts.totalProjectCost ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(bom.markedUpCosts.totalProjectCost) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box mt={4}>
                <Typography variant="h5">Materials</Typography>
                {bom && bom.categories && bom.categories.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell>Item</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Unit Cost (₱)</TableCell>
                          <TableCell>Total Amount (₱)</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bom.categories.map((categoryData, categoryIndex) => (
                          <React.Fragment key={categoryIndex}>
                            {categoryData.materials.map((material, index) => (
                              <TableRow key={`${categoryData.category}-${material._id || index}`}>
                                <TableCell>{categoryData.category ? categoryData.category.toUpperCase() : 'UNCATEGORIZED'}</TableCell>
                                <TableCell>{material.item || 'N/A'}</TableCell>
                                <TableCell>{material.description || 'N/A'}</TableCell>
                                <TableCell>{material.quantity ? Math.round(material.quantity) : 'N/A'}</TableCell>
                                <TableCell>{material.unit || 'N/A'}</TableCell>
                                <TableCell>
                                  {material.cost ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(material.cost) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {typeof material.totalAmount === 'number' ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(material.totalAmount) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    onClick={() => handleReplaceClick(material)}
                                    startIcon={<SwapHoriz />}
                                  >
                                    Replace
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={6} align="right">
                                <strong>Total for {categoryData.category ? categoryData.category.toUpperCase() : 'UNCATEGORIZED'}:</strong>
                              </TableCell>
                              <TableCell colSpan={2}>
                                <strong>
                                  {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(categoryData.categoryTotal)}
                                </strong>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography>No materials found</Typography>
                )}
              </Box>

              <Box mt={4} display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleGenerateBOMPDF('client')}
                  sx={{ mr: 2 }}
                >
                  Download BOM for Client
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleGenerateBOMPDF('contractor')}
                >
                  Download BOM for Contractor
                </Button>
              </Box>
            </Box>
          </>
        )}

        <MaterialSearchModal
          isOpen={materialModalOpen}
          onClose={() => setMaterialModalOpen(false)}
          onMaterialSelect={handleMaterialSelect}
          materialToReplace={materialToReplace}
          user={user}
        />

        {/* Alert Modal */}
        <AlertModal
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
        />
      </Box>
      </ThemeProvider>
    </>
  );
};

export default Generator;
