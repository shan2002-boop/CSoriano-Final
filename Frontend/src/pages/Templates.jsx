import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ConfirmDeleteTemplate from "../components/ConfirmDeleteTemplate";
import AlertModal from '../components/AlertModal'; // Import AlertModal
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
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
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Autocomplete 
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Navbar from "../components/Navbar";

const theme = createTheme({
  palette: {
    primary: {
      main: '#a7b194',
    },
    secondary: {
      main: '#6f7d5e',
    },
  },
});
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <span className={styles.closeButton} onClick={onClose}>
          &times;
        </span>
        <div className={styles.modalScrollableContent}>{children}</div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className={styles.loadingSpinnerContainer}>
    <div className={styles.spinner}></div>
    <p>Please wait, fetching templates...</p>
  </div>
);

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    type: "",
    tier: "",
    totalArea: "",
    numFloors: "",
    avgFloorHeight: "",
    roomCount: "",
    foundationDepth: "",
  });
  const [materials, setMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newMaterial, setNewMaterial] = useState({
    materialId: "",
    description: "",
    quantity: "",
    unit: "",
    cost: "",
    scaling: {
      areaFactor: 1,
      heightFactor: 1,
      roomCountFactor: 1,
      foundationDepthFactor: 1,
    },
  });
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

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

  // Predefined units
  const units = ["pcs", "bags", "kg", "m", "sqm", "cu.m", "liters", "sets"];

  // Fetch all templates
  const fetchTemplates = async () => {
    if (!user || !user.token) return;
  
    try {
      setIsLoading(true);
      const response = await axios.get(`https://foxconstruction-final.onrender.com/api/templates`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
  
      // Define the desired order
      const desiredOrder = ['economy', 'standard', 'premium'];
  
      // Sort the templates based on 'tier' property
      const sortedTemplates = [...response.data.templates].sort((a, b) => {
        const tierA = (a.tier || '').toLowerCase();
        const tierB = (b.tier || '').toLowerCase();
        return desiredOrder.indexOf(tierA) - desiredOrder.indexOf(tierB);
      });
  
      setTemplates(sortedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      showAlert("Error", "Failed to fetch templates. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchTemplates();
    fetchMaterials();
  }, [user]);
  

  // Fetch details of a specific template
const fetchTemplateDetails = async (templateId) => {
  try {
    const response = await axios.get(`https://foxconstruction-final.onrender.com/api/templates/${templateId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setSelectedTemplate(response.data.template);
  } catch (error) {
    console.error("Error fetching template details:", error);
    showAlert("Error", "Failed to fetch template details. Please try again later.", "error");
  }
};


const handleRemoveMaterial = async (categoryName, description) => {
  try {
    const templateId = selectedTemplate._id;
    const encodedDescription = encodeURIComponent(description);

    await axios.delete(
      `https://foxconstruction-final.onrender.com/api/templates/${templateId}/categories/${categoryName}/materials/${encodedDescription}`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    // Update selectedTemplate in state by removing the material
    setSelectedTemplate((prevTemplate) => {
      const updatedCategories = prevTemplate.bom.categories.map((cat) => {
        if (cat.category === categoryName) {
          return {
            ...cat,
            materials: cat.materials.filter((material) => material.description !== description),
          };
        }
        return cat;
      });
      return { ...prevTemplate, bom: { ...prevTemplate.bom, categories: updatedCategories } };
    });

    showAlert("Success", "Material removed successfully.", "success");
  } catch (error) {
    console.error("Error removing material:", error);
    showAlert("Error", error.response?.data?.error || "Failed to remove material. Please try again later.", "error");
  }
};


  

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`https://foxconstruction-final.onrender.com/api/materials`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error("Error fetching materials:", error);
      showAlert("Error", "Failed to fetch materials. Please try again later.", "error");
    }
  };

  // Validate template fields
  const isValid = () => {
    const {
      title,
      type,
      tier,
      totalArea,
      numFloors,
      avgFloorHeight,
      roomCount,
      foundationDepth,
    } = newTemplate;

    const errors = [];

    if (title.trim() === "") errors.push("Title is required.");
    if (type.trim() === "") errors.push("Type is required.");
    if (tier.trim() === "") errors.push("Tier is required.");
    if (totalArea === "" || parseFloat(totalArea) <= 0) errors.push("Total Area must be greater than 0.");
    if (numFloors === "" || parseInt(numFloors, 10) <= 0) errors.push("Number of Floors must be greater than 0.");
    if (numFloors > 6) errors.push("Number of Floors cannot exceed 6.");
    if (avgFloorHeight === "" || parseFloat(avgFloorHeight) <= 0) errors.push("Average Floor Height must be greater than 0.");
    if (avgFloorHeight > 15) errors.push("Average Floor Height cannot exceed 15 meters.");
    if (roomCount === "" || parseInt(roomCount, 10) <= 0) errors.push("Room Count must be greater than 0.");
    if (foundationDepth === "" || parseFloat(foundationDepth) <= 0) errors.push("Foundation Depth must be greater than 0.");

    if (errors.length > 0) {
      showAlert("Validation Error", errors.join(" "), "error");
      return false;
    }

    return true;
  };

  // Handle creating a new template
  const handleCreateTemplate = async () => {
    // Validation is handled in isValid()
    if (!isValid()) {
      return;
    }
    try {
      const response = await axios.post(
        `https://foxconstruction-final.onrender.com/api/templates`,
        newTemplate,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setTemplates([...templates, response.data.template]);
      resetTemplateForm();
      setIsModalOpen(false);
      showAlert("Success", "Template created successfully.", "success");
    } catch (error) {
      console.error("Error creating template:", error);
      showAlert("Error", "Failed to create template. Please try again later.", "error");
    }
  };

  // Handle updating an existing template
  const handleUpdateTemplate = async () => {
    if (!isValid()) return;
    
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/templates/${editTemplateId}`,
        newTemplate,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      showAlert("Success", "Template updated successfully.", "success");
      setIsEditing(false);
      setIsModalOpen(false);
      resetTemplateForm();
      
      // Refresh templates to reflect the latest update
      fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      showAlert("Error", "Failed to update template. Please try again later.", "error");
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async () => {
    try {
      await axios.delete(`https://foxconstruction-final.onrender.com/api/templates/${selectedTemplate._id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setTemplates(templates.filter((template) => template._id !== selectedTemplate._id));
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      showAlert("Success", "Template deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting template:", error);
      showAlert("Error", "Failed to delete template. Please try again later.", "error");
    }
  };

  // Reset the template form
  const resetTemplateForm = () => {
    setNewTemplate({
      title: "",
      type: "",
      tier: "",
      totalArea: "",
      numFloors: "",
      avgFloorHeight: "",
      roomCount: "",
      foundationDepth: "",
    });
  };

  // Handle editing a template
  const handleEditTemplate = (template) => {
    setIsEditing(true);
    setEditTemplateId(template._id);
    setNewTemplate({
      title: template.title,
      type: template.type,
      tier: template.tier,
      totalArea: template.totalArea || "",
      numFloors: template.numFloors || "",
      avgFloorHeight: template.avgFloorHeight || "",
      roomCount: template.roomCount || "",
      foundationDepth: template.foundationDepth || "",
    });
    setIsModalOpen(true);
  };

  // View template details in the modal
  const handleViewTemplateDetails = (template) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (template) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedTemplate) {
      handleDeleteTemplate();
    } else {
      console.error("No template selected for deletion.");
      showAlert("Error", "No template selected for deletion.", "error");
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedTemplate(null);
  };

  // Filter templates based on search term
  const filterTemplates = () => {
    if (!searchTerm) return templates;
    return templates.filter(
      (template) =>
        template.title && template.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAddMaterialClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setShowAddMaterialModal(true);
    // Reset newMaterial
    setNewMaterial({
      materialId: "",
      description: "",
      quantity: "",
      unit: "",
      cost: "",
      scaling: {
        areaFactor: 1,
        heightFactor: 1,
        roomCountFactor: 1,
        foundationDepthFactor: 1,
      },
    });
  };

  const handleAddMaterial = async () => {
    const { materialId, description, quantity, unit, cost, scaling } = newMaterial;
    
    if (!materialId && description.trim() === "") {
      showAlert("Validation Error", "Description is required for new materials.", "error");
      return;
    }
    
    try {
      const templateId = selectedTemplate._id;
      const categoryName = selectedCategory;
      const data = {
        materialId: materialId || undefined,
        description: materialId ? undefined : description || undefined,
        unit: materialId ? undefined : unit || undefined,
        cost: materialId ? undefined : cost || undefined,
        quantity: parseFloat(quantity),
        scaling: {
          areaFactor: parseFloat(scaling.areaFactor || 1),
          heightFactor: parseFloat(scaling.heightFactor || 1),
          roomCountFactor: parseFloat(scaling.roomCountFactor || 1),
          foundationDepthFactor: parseFloat(scaling.foundationDepthFactor || 1),
        },
      };
  
      const response = await axios.post(
        `https://foxconstruction-final.onrender.com/api/templates/${templateId}/categories/${categoryName}/materials`,
        data,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      const addedMaterial = response.data.material;
  
      const updatedCategories = selectedTemplate.bom.categories.map((cat) => {
        if (cat.category === categoryName) {
          return {
            ...cat,
            materials: [...cat.materials, addedMaterial],
          };
        }
        return cat;
      });
  
      setSelectedTemplate((prevTemplate) => ({
        ...prevTemplate,
        bom: { ...prevTemplate.bom, categories: updatedCategories },
      }));
      setTemplates((prevTemplates) => 
        prevTemplates.map((template) =>
          template._id === templateId
            ? { ...template, bom: { ...template.bom, categories: updatedCategories } }
            : template
        )
      );
  
      showAlert("Success", "Material added successfully.", "success");
      setShowAddMaterialModal(false);
      setNewMaterial({
        materialId: "",
        description: "",
        quantity: "",
        unit: "",
        cost: "",
        scaling: {
          areaFactor: 1,
          heightFactor: 1,
          roomCountFactor: 1,
          foundationDepthFactor: 1,
        },
      });
    } catch (error) {
      console.error("Error adding material:", error);
      showAlert("Error", "Failed to add material. Please try again later.", "error");
    }
  };
  
  
  

  const closeAddMaterialModal = () => {
    setShowAddMaterialModal(false);
    setNewMaterial({
      materialId: "",
      description: "",
      quantity: "",
      unit: "",
      cost: "",
      scaling: {
        areaFactor: 1,
        heightFactor: 1,
        roomCountFactor: 1,
        foundationDepthFactor: 1,
      },
    });
  };

  const filteredTemplates = filterTemplates();

  // Prepare options for React Select
  const materialOptions = materials.map((material) => ({
    value: material._id,
    label: material.description,
    material, // Include the full material object for later use
  }));

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Templates
        </Typography>

        {isLoading ? (
          <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
            <CircularProgress />
            <Typography variant="body1" mt={2}>
              Please wait, fetching templates...
            </Typography>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <TextField
                variant="outlined"
                placeholder="Search templates"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  setIsEditing(false);
                  resetTemplateForm();
                  setIsModalOpen(true);
                }}
              >
                + Create Template
              </Button>
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Total Templates: {filteredTemplates.length}
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>Date Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template._id} hover>
                      <TableCell
                        onClick={() => handleViewTemplateDetails(template)}
                        style={{ cursor: 'pointer' }}
                      >
                        {template.title}
                      </TableCell>
                      <TableCell
                        onClick={() => handleViewTemplateDetails(template)}
                        style={{ cursor: 'pointer' }}
                      >
                        {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                      </TableCell>
                      <TableCell
                        onClick={() => handleViewTemplateDetails(template)}
                        style={{ cursor: 'pointer' }}
                      >
                        {template.tier.charAt(0).toUpperCase() + template.tier.slice(1)}
                      </TableCell>
                      <TableCell
                        onClick={() => handleViewTemplateDetails(template)}
                        style={{ cursor: 'pointer' }}
                      >
                        {new Date(template.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
  <Button
    variant="outlined"
    color="primary"
    size="small"
    onClick={() => handleEditTemplate(template)}
    style={{ marginRight: '8px' }}
  >
    Edit
  </Button>
  <Button
    variant="outlined"
    color="secondary"
    size="small"
    onClick={() => handleDeleteClick(template)}
  >
    Delete
  </Button>
</TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Template Details Modal */}
        {showDetailsModal && selectedTemplate && (
          <Dialog
            open={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              Template Details - {selectedTemplate.title}
              <IconButton
                aria-label="close"
                onClick={() => setShowDetailsModal(false)}
                style={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {/* Template Details */}
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong>{" "}
                {selectedTemplate.type.charAt(0).toUpperCase() +
                  selectedTemplate.type.slice(1)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Tier:</strong>{" "}
                {selectedTemplate.tier.charAt(0).toUpperCase() +
                  selectedTemplate.tier.slice(1)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date Created:</strong>{" "}
                {new Date(selectedTemplate.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Total Area:</strong> {selectedTemplate.bom.totalArea} sqm
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Number of Floors:</strong> {selectedTemplate.bom.numFloors}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Average Floor Height:</strong> {selectedTemplate.bom.avgFloorHeight} m
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Number of Rooms:</strong> {selectedTemplate.bom.roomCount}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Foundation Depth:</strong> {selectedTemplate.bom.foundationDepth} m
              </Typography>

              {/* Categories and Materials */}
              <Typography variant="h6" gutterBottom>
                Categories and Materials
              </Typography>
              {selectedTemplate.bom.categories.map((category) => (
                <Box key={category.category} mb={2}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1" style={{ flexGrow: 1 }}>
                      {category.category}
                    </Typography>
                   
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleAddMaterialClick(category.category)}
                      >
                        Add Material
                      </Button>
               
                  </Box>
                  {category.materials.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell>Cost</TableCell>
                         && <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                        {category.materials?.map((material, index) => (
  material ? ( // Check if material is defined
    <TableRow key={material._id || material.description}> {/* Use material._id if available */}
      <TableCell>{material.description || "N/A"}</TableCell> {/* Default to "N/A" if undefined */}
      <TableCell>{material.quantity || 0}</TableCell> {/* Default to 0 if undefined */}
      <TableCell>{material.unit || "unit"}</TableCell> {/* Default unit */}
      <TableCell>₱{material.cost || 0}</TableCell> {/* Default cost */}
      <TableCell>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() =>
            handleRemoveMaterial(category.category, material.description)
          }
        >
          Remove
        </Button>
      </TableCell>
    </TableRow>
  ) : null // If material is undefined, render nothing
))}

</TableBody>

                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography>No materials in this category.</Typography>
                  )}
                </Box>
              ))}
            </DialogContent>
          </Dialog>
        )}

        {/* Add Material Modal */}
        {showAddMaterialModal && (
          <Dialog
            open={showAddMaterialModal}
            onClose={closeAddMaterialModal}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              Add Material to {selectedCategory}
              <IconButton
                aria-label="close"
                onClick={closeAddMaterialModal}
                style={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {/* React Select for Existing Materials */}
              <Typography variant="subtitle1">Select Existing Material</Typography>
              <Autocomplete
                options={materials}
                getOptionLabel={(option) => option.description}
                onChange={(event, selectedOption) => {
                  if (selectedOption) {
                    const material = selectedOption;
                    setNewMaterial({
                      ...newMaterial,
                      materialId: material._id,
                      description: material.description,
                      unit: material.unit,
                      cost: material.cost,
                    });
                  } else {
                    // If selection is cleared
                    setNewMaterial({
                      ...newMaterial,
                      materialId: "",
                      description: "",
                      unit: "",
                      cost: "",
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and select material"
                    margin="dense"
                    fullWidth
                  />
                )}
              />

              {/* Option to input new material
              <Typography variant="subtitle1" mt={2}>
                Or Input New Material
              </Typography>
              {!newMaterial.materialId && (
                <>
                  <TextField
                    label="Description"
                    value={newMaterial.description}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        description: e.target.value,
                        materialId: "", // Clear materialId
                      })
                    }
                    fullWidth
                    margin="dense"
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={newMaterial.unit}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, unit: e.target.value })
                      }
                      label="Unit"
                    >
                      {units.map((unit, index) => (
                        <MenuItem key={index} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Cost"
                    type="number"
                    value={newMaterial.cost}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, cost: e.target.value })
                    }
                    fullWidth
                    margin="dense"
                    inputProps={{ min: 0 }}
                  />
                </>
              )} */}

              {/* Common Fields */}
              <Typography variant="subtitle1" mt={2}>
                Quantity
              </Typography>
              <TextField
                label="Quantity"
                type="number"
                value={newMaterial.quantity}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, quantity: e.target.value })
                }
                fullWidth
                margin="dense"
                inputProps={{ min: 0 }}
              />

              {/* Scaling Factors */}
              <Typography variant="subtitle1" mt={2}>
                Scaling Factors
              </Typography>
              {[
                { label: 'Area Factor', key: 'areaFactor' },
                { label: 'Height Factor', key: 'heightFactor' },
                { label: 'Room Count Factor', key: 'roomCountFactor' },
                { label: 'Foundation Depth Factor', key: 'foundationDepthFactor' },
              ].map((factor) => (
                <FormControlLabel
                  key={factor.key}
                  control={
                    <Checkbox
                      checked={newMaterial.scaling[factor.key] === 1}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          scaling: {
                            ...newMaterial.scaling,
                            [factor.key]: e.target.checked ? 1 : 0,
                          },
                        })
                      }
                    />
                  }
                  label={factor.label}
                />
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeAddMaterialModal}>Cancel</Button>
              <Button onClick={handleAddMaterial} variant="contained" color="secondary">
                Add Material
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Create/Edit Template Modal */}
        {isModalOpen && (
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              {isEditing ? "Edit Template" : "Create New Template"}
              <IconButton
                aria-label="close"
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <TextField
                label="Template Title"
                value={newTemplate.title}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, title: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Type</InputLabel>
                <Select
                  value={newTemplate.type}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, type: e.target.value })
                  }
                  label="Type"
                >
                  <MenuItem value="" disabled>
                    Select Type
                  </MenuItem>
                  <MenuItem value="residential">Residential</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Tier</InputLabel>
                <Select
                  value={newTemplate.tier}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, tier: e.target.value })
                  }
                  label="Tier"
                >
                  <MenuItem value="" disabled>
                    Select Tier
                  </MenuItem>
                  <MenuItem value="economy">Economy</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
              {/* New Fields */}
              <TextField
                label="Total Area (sqm)"
                type="number"
                value={newTemplate.totalArea}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, totalArea: e.target.value })
                }
                fullWidth
                margin="dense"
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Number of Floors"
                type="number"
                value={newTemplate.numFloors}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, numFloors: e.target.value })
                }
                fullWidth
                margin="dense"
                inputProps={{ min: 1, max: 6 }}
              />
              <TextField
                label="Average Floor Height (m)"
                type="number"
                value={newTemplate.avgFloorHeight}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, avgFloorHeight: e.target.value })
                }
                fullWidth
                margin="dense"
                inputProps={{ min: 0, max: 15 }}
              />
              <TextField
                label="Number of Rooms"
                type="number"
                value={newTemplate.roomCount}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, roomCount: e.target.value })
                }
                fullWidth
                margin="dense"
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Foundation Depth (m)"
                type="number"
                value={newTemplate.foundationDepth}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, foundationDepth: e.target.value })
                }
                fullWidth
                margin="dense"
                inputProps={{ min: 0 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button
                onClick={isEditing ? handleUpdateTemplate : handleCreateTemplate}
                variant="contained"
                color="secondary"
              >
                {isEditing ? "Update Template" : "Create Template"}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <ConfirmDeleteTemplate
          show={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={selectedTemplate?.title || "this template"}
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
  );
};

export default Templates;
