// src/components/ProjectList.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Typography,
  InputLabel,
  FormControl,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  Redo as RedoIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';



const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
    <p>Please wait, fetching projects...</p>
  </div>
);

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    user: "",
    contractor: "",
    numFloors: 1,
    floors: [],
    template: "",
    timeline: { duration: 0, unit: "months" },
    location: "",
    totalArea: 0,
    avgFloorHeight: 0,
    roomCount: 1,
    foundationDepth: 0,
  });
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info"); // Default type
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [heightError, setHeightError] = useState("");
  const [floorError, setFloorError] = useState("");
  const [roomCountError, setRoomCountError] = useState("");
  const [foundationDepthError, setFoundationDepthError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [totalAreaError, setTotalAreaError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    timeline: false,
    projectDates: false,
    postponedDates: false,
    resumedDates: false,
    floorsAndTasks: false,
    floors: {},
  });
  const [localImages, setLocalImages] = useState({}); // To store images by floor and task
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
const [imageToDelete, setImageToDelete] = useState(null);



  const toggleDetails = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const toggleFloor = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      floors: {
        ...prev.floors,
        [index]: !prev.floors[index],
      },
    }));
  };
  
  

  const showAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };

  const togggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };
  

  const toggleFloorExpansion = (index) => {
    if (expandedFloors.includes(index)) {
      setExpandedFloors(expandedFloors.filter((i) => i !== index));
    } else {
      setExpandedFloors([...expandedFloors, index]);
    }
  };
  
  // Fetch project details for the modal
  const fetchProjectDetails = async (projectId) => {
    const response = await axios.get(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
  
    const project = response.data;
    setNewProject({
      ...project,
      floors: project.floors.map((floor) => ({
        ...floor,
        _id: floor._id, // Ensure floor ID is included
      })),
    });
  };
  

  // Fetch all projects, locations, and templates
  useEffect(() => {
    if (!user || !user.token) return;
  
    const fetchData = async () => {
      try {
        setIsLoading(true);
  
        const [projectsResponse, locationsResponse, templatesResponse, usersResponse] = await Promise.all([
          axios.get(`https://foxconstruction-final.onrender.com/api/project/contractor`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`https://foxconstruction-final.onrender.com/api/locations`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`https://foxconstruction-final.onrender.com/api/templates`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`https://foxconstruction-final.onrender.com/api/user/get`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);
  
        setProjects(projectsResponse.data);
        setLocations(locationsResponse.data);
        setUsers(usersResponse.data);
  
        // Sort templates based on 'tier' property
        const desiredOrder = ['economy', 'standard', 'premium'];
        const sortedTemplates = [...templatesResponse.data.templates].sort((a, b) => {
          const tierA = (a.tier || '').toLowerCase();
          const tierB = (b.tier || '').toLowerCase();
          return desiredOrder.indexOf(tierA) - desiredOrder.indexOf(tierB);
        });
        setTemplates(sortedTemplates);
  
        // Debugging Logs
        console.log("Fetched Templates:", sortedTemplates);
        console.log("Fetched Locations:", locationsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        showAlert("Error", "Failed to fetch projects, locations, or templates. Please try again later.", "error");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [user]);
  
  
  const handleUpdateTaskImageRemark = (floorIndex, taskIndex, imageIndex, newRemark) => {
    setNewProject((prevProject) => {
      const updatedFloors = [...prevProject.floors];
      const updatedTasks = [...updatedFloors[floorIndex].tasks];
      const updatedTaskImages = [...updatedTasks[taskIndex].images];
      updatedTaskImages[imageIndex].remark = newRemark; // Update the remark
      updatedTasks[taskIndex].images = updatedTaskImages; // Update images for the task
      updatedFloors[floorIndex].tasks = updatedTasks; // Update tasks for the floor
      return { ...prevProject, floors: updatedFloors };
    });
  };
  
  const handleFloorHeightChange = (e) => {
    const inputValue = e.target.value;
  
    // Update the state with the raw input value
    setNewProject({ ...newProject, avgFloorHeight: inputValue });
  
    // If the input is empty, clear the error and return
    if (inputValue === '') {
      setHeightError('');
      return;
    }
  
    const value = parseFloat(inputValue);
  
    if (isNaN(value)) {
      setHeightError("Please enter a valid number.");
      showAlert("Validation Error", "Please enter a valid number for floor height.", "error");
    } else if (value < 0) {
      setHeightError("The floor height cannot be negative.");
      showAlert("Validation Error", "The floor height cannot be negative.", "error");
    } else if (value > 15) {
      setHeightError("The floor height cannot exceed 15 meters.");
      showAlert("Validation Error", "The floor height cannot exceed 15 meters.", "error");
    } else {
      setHeightError("");
      setNewProject({ ...newProject, avgFloorHeight: value });
    }
  };
  
  const handleImageUpload = (e, floorIndex, taskIndex = null) => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      showAlert("Error", "No files selected. Please select images to upload.", "error");
      return;
    }
  
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = {
          preview: reader.result,
          file,
          isLocal: true,
          remark: "",
        };
  
        setLocalImages((prev) => {
          const updatedImages = { ...prev };
  
          // Initialize floor if not present
          if (!updatedImages[floorIndex]) {
            updatedImages[floorIndex] = { images: [], tasks: {} };
          }
  
          // Add image to task or floor, avoiding duplicates
          if (taskIndex !== null) {
            // Task image handling
            if (!updatedImages[floorIndex].tasks[taskIndex]) {
              updatedImages[floorIndex].tasks[taskIndex] = { images: [] };
            }
  
            // Add image only if it does not exist already (check by file name)
            if (!updatedImages[floorIndex].tasks[taskIndex].images.some(img => img.file.name === file.name)) {
              updatedImages[floorIndex].tasks[taskIndex].images.push(newImage);
            }
          } else {
            // Floor image handling
  
            // Add image only if it does not exist already (check by file name)
            if (!updatedImages[floorIndex].images.some(img => img.file.name === file.name)) {
              updatedImages[floorIndex].images.push(newImage);
            }
          }
          return updatedImages;
        });
      };
      reader.readAsDataURL(file);
    });
  };
  
  
  
  const handleRemoveImage = (floorIndex, imageIndex, taskIndex = null) => {
    setLocalImages((prev) => {
      const updated = { ...prev };
      if (taskIndex !== null) {
        // Remove task image
        updated[floorIndex].tasks[taskIndex].images.splice(imageIndex, 1);
        if (updated[floorIndex].tasks[taskIndex].images.length === 0) {
          delete updated[floorIndex].tasks[taskIndex];
        }
      } else {
        // Remove floor image
        updated[floorIndex].images.splice(imageIndex, 1);
      }
      return updated;
    });
  };
  
  
  
  
  
  
  
  
  
  
  
  
   

  const handleTotalAreaChange = (e) => {
    const inputValue = e.target.value;
  
    // Update the state with the raw input value
    setNewProject({ ...newProject, totalArea: inputValue });
  
    // If the input is empty, clear the error and return
    if (inputValue === '') {
      setTotalAreaError('');
      return;
    }
  
    const value = parseFloat(inputValue);
  
    if (isNaN(value)) {
      setTotalAreaError("Please enter a valid number.");
      showAlert("Validation Error", "Please enter a valid number for total area.", "error");
    } else if (value <= 0) {
      setTotalAreaError("Total area must be greater than 0.");
      showAlert("Validation Error", "Total area must be greater than 0.", "error");
    } else {
      setTotalAreaError("");
      setNewProject({ ...newProject, totalArea: value });
    }
  };
  
  
  const handleToggleProgressMode = async (projectId, isAutomatic) => {
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/progress-mode`,
        { isAutomatic },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      // Log the entire response.data to examine its structure
      console.log("Response Data:", response.data);
  
      // Attempt to access the project data, with more fallback and error handling
      const updatedProject = response.data?.project || response.data;
  
      if (updatedProject && updatedProject._id) {
        // Update the projects list with the newly retrieved project
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project._id === updatedProject._id ? updatedProject : project
          )
        );
        showAlert("Success", `Progress mode set to ${isAutomatic ? 'Automatic' : 'Manual'}.`, "success");
      } else {
        console.error("Error: Updated project data is undefined or missing _id in the response:", response.data);
        showAlert("Error", "Failed to retrieve updated project data.", "error");
      }
    } catch (error) {
      console.error("Error toggling progress mode:", error);
      showAlert("Error", "Failed to toggle progress mode. Please try again.", "error");
    }
  };
  
  
  
  
  
  
  
  
  // Handle input change for numFloors with validation
  const handleNumFloorsChange = (e) => {
    const inputValue = e.target.value;
  
    // Update the state with the raw input value
    setNewProject({ ...newProject, numFloors: inputValue });
  
    // If the input is empty, clear the error and return
    if (inputValue === '') {
      setFloorError('');
      return;
    }
  
    const value = parseInt(inputValue, 10);
  
    if (isNaN(value)) {
      setFloorError("Please enter a valid number.");
      showAlert("Validation Error", "Please enter a valid number for the number of floors.", "error");
    } else if (value < 1) {
      setFloorError("The number of floors cannot be less than 1.");
      showAlert("Validation Error", "The number of floors cannot be less than 1.", "error");
    } else if (value > 5) {
      setFloorError("The number of floors cannot exceed 5.");
      showAlert("Validation Error", "The number of floors cannot exceed 5.", "error");
    } else {
      setFloorError("");
      setNewProject({ ...newProject, numFloors: value });
    }
  };
  

  // Function to handle project deletion after confirmation
  const handleConfirmDelete = () => {
    if (selectedProject) {
      handleDeleteProject();
    } else {
      console.error("No project selected for deletion.");
      showAlert("Error","No project selected for deletion.", "error");
    }
  };

  // Function to handle when the user cancels the delete operation
  const handleCancelDelete = () => {
    setShowDeleteModal(false); 
    setSelectedProject(null);  
  };

  // Handle creating a new project
  const handleCreateProject = async () => {
    try {
      if (!newProject.template) {
        showAlert("Error", "Please select a template.", "error");
        return;
      }
      if (newProject.totalArea <= 0) {
        showAlert("Error", "Total area must be greater than 0.", "error");
        return;
      }
  
      const defaultFloors = Array.from({ length: newProject.numFloors }, (_, i) => ({
        name: `FLOOR ${i + 1}`,
        progress: 0,
        tasks: [],
      }));
  
      const processedProject = {
        ...newProject,
        contractor: user.Username,
        floors: defaultFloors,
      };
  
      const response = await axios.post(
        `https://foxconstruction-final.onrender.com/api/project`,
        processedProject,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      setProjects([...projects, response.data.data]);
      resetProjectForm();
      setIsModalOpen(false);
      showAlert("Success", "Project created successfully!", "success");
    } catch (error) {
      if (error.response && error.response.status === 404) {
        showAlert("Error", "The selected template was not found. Please select a valid template.", "error");
      } else {
        console.error("Error creating project:", error);
        showAlert("Error", "Failed to create project. Please try again.", "error");
      }
    }
  };
  
  // Handle updating an existing project
  const handleUpdateProject = async () => {
    try {
      const projectId = newProject._id;
      const updatedFloors = await Promise.all(
        newProject.floors.map(async (floor, floorIndex) => {
          const floorId = floor._id;
          let uploadedFloorImages = [];
  
          // Upload new floor images
          if (localImages[floorIndex]?.images?.length) {
            uploadedFloorImages = await Promise.all(
              localImages[floorIndex].images.map(async (img) => {
                const formData = new FormData();
                formData.append("image", img.file);
                formData.append("remark", img.remark || "");
            
                const response = await axios.post(
                  `https://foxconstruction-final.onrender.com/api/project/${projectId}/floors/${floorId}/images`,
                  formData,
                  {
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                      "Content-Type": "multipart/form-data",
                    },
                  }
                );
            
                return response.data.image; // Use the image data returned from the server
              })
            );
            
          }
  
          // Handle tasks
          const updatedTasks = await Promise.all(
            floor.tasks.map(async (task, taskIndex) => {
              const taskId = task._id;
              let uploadedTaskImages = [];
  
              // Upload new task images
              if (localImages[floorIndex]?.tasks?.[taskIndex]?.images?.length) {
                uploadedTaskImages = await Promise.all(
                  localImages[floorIndex].tasks[taskIndex].images.map(async (img) => {
                    const formData = new FormData();
                    formData.append("image", img.file);
                    formData.append("remark", img.remark || "");
  
                    const response = await axios.post(
                      `https://foxconstruction-final.onrender.com/api/project/${projectId}/floors/${floorId}/tasks/${taskId}/images`,
                      formData,
                      {
                        headers: {
                          Authorization: `Bearer ${user.token}`,
                          "Content-Type": "multipart/form-data",
                        },
                      }
                    );
  
                    return response.data.image; // Assuming the API returns the uploaded image data
                  })
                );
              }
  
              // Merge existing and new images
              const allTaskImages = [
                ...(task.images || []),
                ...uploadedTaskImages,
              ];
  
              return {
                ...task,
                images: allTaskImages,
              };
            })
          );
  
          // Merge existing and new floor images
          const allFloorImages = [
            ...(floor.images || []),
            ...uploadedFloorImages,
          ];
  
          return {
            ...floor,
            images: allFloorImages,
            tasks: updatedTasks,
          };
        })
      );
  
      const processedProject = {
        ...newProject,
        floors: updatedFloors,
      };

       // Remove __v field to prevent versioning errors
    delete processedProject.__v;

    // Also, remove __v from nested subdocuments (floors and tasks)
    processedProject.floors = processedProject.floors.map(floor => {
      delete floor.__v;
      floor.tasks = floor.tasks.map(task => {
        delete task.__v;
        return task;
      });
      return floor;
    });
  
      // Send the updated project to the server
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${editProjectId}`,
        processedProject,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      // Update the projects in the state with the updated project
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === editProjectId ? response.data.project : project
        )
      );
  
      // Reset local images
      setLocalImages({});
  
      // Reset form and close modal
      resetProjectForm();
      setIsEditing(false);
      setIsModalOpen(false);
      showAlert("Success", "Project updated successfully!", "success");
    } catch (error) {
      console.error("Error updating project:", error);
      showAlert("Error", "Failed to update project. Please try again.", "error");
    }
  };
  




  
  // Handle deleting a project
  const handleDeleteProject = async () => {
    try {
      await axios.delete(`https://foxconstruction-final.onrender.com/api/project/${selectedProject._id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setProjects(projects.filter((project) => project._id !== selectedProject._id));
      setShowDeleteModal(false);
      setSelectedProject(null);
      showAlert("Success","Project deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting project:", error);
      showAlert("Error","Failed to delete project. Please try again.", "error");
    }
  };

  // Reset the project form
  const resetProjectForm = () => {
    setNewProject({
      name: "",
      contractor: "",
      user: "",
      numFloors: "",
      template: "",
      floors: [],
      timeline: {
        duration: "",
        unit: "months",
      },
      location: "", 
      totalArea: "",
      avgFloorHeight: "",
      roomCount: "",
      foundationDepth: "",
    });
    // Reset validation errors
    setHeightError("");
    setFloorError("");
    setRoomCountError("");
    setFoundationDepthError("");
  };
  
  const handleStartProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/start`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const updatedProject = response.data.project;
  
      // Update the projects state with the updated project
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success","Project started successfully!", "success");
    } catch (error) {
      console.error("Error starting project:", error);
      showAlert("Error","Failed to start project. Please try again.", "error");
    }
  };

  const handlePostponeProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/postpone`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedProject = response.data.project;

      // Update projects state directly with the new status
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success","Project postponed successfully!", "success");
    } catch (error) {
      console.error("Error postponing project:", error);
      showAlert("Error","Failed to postpone project. Please try again.", "error");
    }
  };

  const handleResumeProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/resume`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedProject = response.data.project;

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success","Project resumed successfully!", "success");
    } catch (error) {
      console.error("Error resuming project:", error);
      showAlert("Error","Failed to resume project. Please try again.", "error");
    }
  };

  const handleEndProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/end`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedProject = response.data.project;

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success","Project ended successfully!", "success");
    } catch (error) {
      console.error("Error ending project:", error);
      showAlert("Error","Failed to end project. Please try again.", "error");
    }
  };
  const handleDeleteExistingImage = (floorIndex, imageIndex) => {
    setImageToDelete({ type: 'floor', floorIndex, imageIndex });
    setShowImageDeleteModal(true);
  };

  const handleDeleteExistingTaskImage = (floorIndex, taskIndex, imageIndex) => {
    setImageToDelete({ type: 'task', floorIndex, taskIndex, imageIndex });
    setShowImageDeleteModal(true);
  };


  const handleUpdateImageRemark = (floorIndex, imageIndex, newRemark) => {
    setNewProject((prevProject) => {
      const updatedFloors = [...prevProject.floors];
      updatedFloors[floorIndex].images[imageIndex].remark = newRemark; // Update the remark
      return { ...prevProject, floors: updatedFloors };
    });
  };
  
  const handleConfirmDeleteImage = async () => {
    const { type, floorIndex, taskIndex, imageIndex } = imageToDelete;
  
    try {
      const projectId = newProject._id; // Get the project ID
  
      if (type === 'floor') {
        const floor = newProject.floors[floorIndex];
        const floorId = floor._id; // Get the floor ID
        const image = floor.images[imageIndex];
        const imageId = image._id; // Get the image ID

         // Ensure IDs are valid before making the API call
      if (!projectId || !floorId || !imageId) {
        showAlert('Error', 'Invalid IDs for deleting floor image.', 'error');
        return;
      }
  
        // Send delete request to the server
        await axios.delete(
          `https://foxconstruction-final.onrender.com/api/project/${projectId}/floors/${floorId}/images/${imageId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
  
        // Remove the image from the state
// Remove the image from the state
const updatedFloors = [...newProject.floors];
if (type === 'floor') {
  updatedFloors[floorIndex].images = updatedFloors[floorIndex].images.filter(
    (_, idx) => idx !== imageIndex
  );
} else if (type === 'task') {
  updatedFloors[floorIndex].tasks[taskIndex].images = updatedFloors[floorIndex].tasks[taskIndex].images.filter(
    (_, idx) => idx !== imageIndex
  );
}
setNewProject({ ...newProject, floors: updatedFloors });


      } else if (type === 'task') {
        const floor = newProject.floors[floorIndex];
        const floorId = floor._id; // Get the floor ID
        const task = floor.tasks[taskIndex];
        const taskId = task._id; // Get the task ID
        const image = task.images[imageIndex];
        const imageId = image._id; // Get the image ID
  
        // Send delete request to the server
        await axios.delete(
          `https://foxconstruction-final.onrender.com/api/project/${projectId}/floors/${floorId}/tasks/${taskId}/images/${imageId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
  
        // Remove the image from the state
// Remove the image from the state
const updatedFloors = [...newProject.floors];
if (type === 'floor') {
  updatedFloors[floorIndex].images = updatedFloors[floorIndex].images.filter(
    (_, idx) => idx !== imageIndex
  );
} else if (type === 'task') {
  updatedFloors[floorIndex].tasks[taskIndex].images = updatedFloors[floorIndex].tasks[taskIndex].images.filter(
    (_, idx) => idx !== imageIndex
  );
}
setNewProject({ ...newProject, floors: updatedFloors });


      }
  
      showAlert('Success', 'Image deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert('Error', 'Failed to delete image. Please try again.', 'error');
    } finally {
      setShowImageDeleteModal(false);
      setImageToDelete(null);
    }
  };
  

  const handleCancelDeleteImage = () => {
    setShowImageDeleteModal(false);
    setImageToDelete(null);
  };


  // Handle editing a project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setIsEditing(true);
    setEditProjectId(project._id);
  
    const floorsWithProgress = project.floors.map((floor) => ({
      ...floor,
      progress: floor.progress || 0,
      images: (floor.images || []).filter(Boolean), // Filter out nulls
      tasks: floor.tasks.map((task) => ({
        ...task,
        progress: task.progress || 0,
        images: (task.images || []).filter(Boolean), // Filter out nulls
      })),
    }));
    
  
    // Check if project.template is a valid ObjectId
    const isValidTemplateId = /^[0-9a-fA-F]{24}$/.test(project.template);
  
    setNewProject({
      ...project,
      floors: floorsWithProgress,
      location: project.location || "",
      totalArea: project.totalArea || 0,
      avgFloorHeight: project.avgFloorHeight || 0,
      template: isValidTemplateId ? project.template : "",
    });
  
    setIsModalOpen(true);
  };
  
  

  // Handle updating project status
  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      const response = await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const updatedProject = response.data.project;
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success","Project status updated successfully!", "success");
    } catch (error) {
      console.error("Error updating project status:", error);
      showAlert("Error","Failed to update project status. Please try again.", "error");
    }
  };

  // Helper functions for floors and tasks
  const handleFloorChange = (floorIndex, key, value) => {
    const updatedFloors = newProject.floors.map((floor, index) => {
      if (index === floorIndex) {
        return { ...floor, [key]: value };
      }
      return floor;
    });
    setNewProject({ ...newProject, floors: updatedFloors });
  };
  

  const handleTaskChange = (floorIndex, taskIndex, key, value) => {
    const updatedTasks = newProject.floors[floorIndex].tasks.map((task, index) => {
      if (index === taskIndex) {
        return { ...task, [key]: value };
      }
      return task;
    });
    const updatedFloors = newProject.floors.map((floor, index) => {
      if (index === floorIndex) {
        return { ...floor, tasks: updatedTasks };
      }
      return floor;
    });
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const addTaskToFloor = (floorIndex) => {
    const updatedFloors = newProject.floors.map((floor, i) =>
      i === floorIndex
        ? {
            ...floor,
            tasks: [
              ...floor.tasks,
              { name: "", progress: 0, isManual: false, images: [] }, // Initialize images
            ],
          }
        : floor
    );
    setNewProject({ ...newProject, floors: updatedFloors });
  };
  

  const addFloor = () => {
    if (newProject.floors.length >= 5) {
      showAlert("Error", "Cannot add more than 5 floors.", "error");
      return;
    }
  
    const newFloorIndex = newProject.floors.length + 1;
    const updatedFloors = [
      ...newProject.floors,
      {
        name: `FLOOR ${newFloorIndex}`,
        progress: 0,
        tasks: [],
        isManual: false,
        images: [], // Initialize images as an empty array
      },
    ];
    setNewProject({ ...newProject, floors: updatedFloors });
  };
  

  const deleteFloor = (index) => {
    const updatedFloors = newProject.floors.filter((_, i) => i !== index);
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const deleteTask = (floorIndex, taskIndex) => {
    const updatedTasks = newProject.floors[floorIndex].tasks.filter((_, i) => i !== taskIndex);
    const updatedFloors = newProject.floors.map((floor, i) =>
      i === floorIndex ? { ...floor, tasks: updatedTasks } : floor
    );
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  // View project details in the modal
  const handleViewProjectDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };
  

  // Generate BOM PDF
  const handleGenerateBOMPDF = (version = 'client') => {
    if (!selectedProject || !selectedProject.bom) {
      showAlert("Error", "BOM data is not available for this project.", "error");
      return;
    }
  
    const { bom, name, user: ownerName } = selectedProject;
  
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20; // Starting y position for details
  
    // Add the logo at the top
    const imgWidth = pageWidth - 40; // Adjust width to make it centered and smaller than page width
    const imgHeight = imgWidth * 0.2; // Maintain aspect ratio
    doc.addImage(foxconrights, 'JPEG', 20, 10, imgWidth, imgHeight);
    yPosition += imgHeight + 10; // Adjust y position below the logo
  
    // Determine BOM Type (Project or Custom)
    const bomType = bom.projectGenerated ? "Project-Generated BOM" : "Custom-Generated BOM";
  
    // Add Title
    doc.setFontSize(18);
    doc.text(`${bomType}: ${name || "N/A"}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.setFontSize(12);
    yPosition += 10;
  
    // Project details
    doc.text(`Owner: ${ownerName || "N/A"}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Total Area: ${bom.projectDetails.totalArea || "N/A"} sqm`, 10, yPosition);
    yPosition += 10;
    doc.text(`Number of Floors: ${bom.projectDetails.numFloors || "N/A"}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Floor Height: ${bom.projectDetails.avgFloorHeight || "N/A"} meters`, 10, yPosition);
    yPosition += 10;
  
    // Handle client vs. contractor-specific details
    if (version === 'client') {
      const formattedGrandTotal = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}`;
      doc.setFontSize(14);
      doc.text(`Grand Total: ${formattedGrandTotal}`, 10, yPosition);
      yPosition += 15;
  
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
      const markup = bom.projectDetails.location.markup || 0;
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
      doc.text(`Location: ${bom.projectDetails.location.name || "N/A"} (Markup: ${markup}%)`, 10, yPosition);
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
          head: [['Item', 'Description', 'Quantity', 'Unit', 'Unit Cost (PHP)', 'Total Amount (PHP)']],
          body: category.materials.map((material, index) => [
            `${categoryIndex + 1}.${index + 1}`,
            material.description || "N/A",
            material.quantity ? material.quantity.toFixed(2) : "N/A",
            material.unit || "N/A",
            `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.cost || 0)}`,
            `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.totalAmount || 0)}`
          ]),
          startY: yPosition,
          headStyles: { fillColor: [41, 128, 185] },
          bodyStyles: { textColor: [44, 62, 80] },
        });
  
        yPosition = doc.lastAutoTable.finalY + 5;
  
        const categoryTotal = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
          category.materials.reduce((sum, material) => sum + material.totalAmount, 0)
        )}`;
        doc.text(`Total for ${category.category.toUpperCase()}: ${categoryTotal}`, 10, yPosition);
        yPosition += 15;
      });
    }
  
    // Save the PDF
    doc.save(`BOM_${name}_${bomType}.pdf`);
  };
  
  

  const saveImageRemarkToServer = async (floorIndex, imageIndex, imageId, newRemark) => {
    try {
      const projectId = newProject._id;
      const floorId = newProject.floors[floorIndex]._id;
  
      await axios.patch(
        `https://foxconstruction-final.onrender.com/api/project/${projectId}/floors/${floorId}/images/${imageId}`,
        { remark: newRemark },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      showAlert("Success", "Image remark updated successfully!", "success");
    } catch (error) {
      console.error("Error updating image remark:", error);
      showAlert("Error", "Failed to update image remark. Please try again.", "error");
    }
  };
  

  // Handle changes and validation for roomCount
  const handleRoomCountChange = (e) => {
    const inputValue = e.target.value;
  
    // Update the state with the raw input value
    setNewProject({ ...newProject, roomCount: inputValue });
  
    // If the input is empty, clear the error and return
    if (inputValue === '') {
      setRoomCountError('');
      return;
    }
  
    const value = parseInt(inputValue, 10);
  
    if (isNaN(value)) {
      setRoomCountError("Please enter a valid number.");
      showAlert("Validation Error", "Please enter a valid number for room count.", "error");
    } else if (value < 1) {
      setRoomCountError("Room count must be at least 1.");
      showAlert("Validation Error", "Room count must be at least 1.", "error");
    } else {
      setRoomCountError("");
      setNewProject({ ...newProject, roomCount: value });
    }
  };
  

  // Handle changes and validation for foundationDepth
  const handleFoundationDepthChange = (e) => {
    const inputValue = e.target.value;
  
    // Update the state with the raw input value
    setNewProject({ ...newProject, foundationDepth: inputValue });
  
    // If the input is empty, clear the error and return
    if (inputValue === '') {
      setFoundationDepthError('');
      return;
    }
  
    const value = parseFloat(inputValue);
  
    if (isNaN(value)) {
      setFoundationDepthError("Please enter a valid number.");
      showAlert("Validation Error", "Please enter a valid number for foundation depth.", "error");
    } else if (value <= 0) {
      setFoundationDepthError("Foundation depth must be greater than 0.");
      showAlert("Validation Error", "Foundation depth must be greater than 0.", "error");
    } else {
      setFoundationDepthError("");
      setNewProject({ ...newProject, foundationDepth: value });
    }
  };
  
  

  // Define handleDeleteClick function
  const handleDeleteClick = (project) => {
    setSelectedProject(project); 
    setShowDeleteModal(true); 
  };

  // Filter projects based on search term
  const filterProjects = () => {
    if (!searchTerm) return projects;
    return projects.filter(
      (project) =>
        project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredProjects = filterProjects();
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
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
            <Typography ml={2}>Please wait, fetching projects...</Typography>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <TextField
                label="Search project list"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                sx={{ mr: 2 }}
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  setIsEditing(false);
                  resetProjectForm();
                  setIsModalOpen(true);
                }}
              >
                + Create Project
              </Button>
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Total Projects: {filteredProjects.length}
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Project Owner</TableCell>
                    <TableCell>Project Contractor</TableCell>
                    <TableCell>Date Created</TableCell>
                    <TableCell>Cost Tier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id} hover>
                      <TableCell onClick={() => handleViewProjectDetails(project)} style={{ cursor: 'pointer' }}>
                        {project.name || 'N/A'}
                      </TableCell>
                      <TableCell onClick={() => handleViewProjectDetails(project)} style={{ cursor: 'pointer' }}>
                        {project.user || 'N/A'}
                      </TableCell>
                      <TableCell onClick={() => handleViewProjectDetails(project)} style={{ cursor: 'pointer' }}>
                        {project.contractor || 'N/A'}
                      </TableCell>
                      <TableCell onClick={() => handleViewProjectDetails(project)} style={{ cursor: 'pointer' }}>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {templates.find((template) => template._id === project.template)?.title || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={project.status === 'finished' ? 'green' : 'orange'}
                        >
                          {project.status || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {project.status === "not started" || project.status === "finished" ? (
                          <Tooltip title="Start Project">
                            <IconButton onClick={() => handleStartProject(project._id)} color="secondary">
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        ) : project.status === "ongoing" ? (
                          <>
                            <Tooltip title="Postpone Project">
                              <IconButton onClick={() => handlePostponeProject(project._id)} color="secondary">
                                <PauseIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="End Project">
                              <IconButton onClick={() => handleEndProject(project._id)} color="secondary">
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : project.status === "postponed" && (
                          <Tooltip title="Resume Project">
                            <IconButton onClick={() => handleResumeProject(project._id)} color="secondary">
                              <RedoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit Project">
                          <IconButton onClick={() => handleEditProject(project)} color="secondary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={project.isAutomaticProgress ? "Switch to Manual Mode" : "Switch to Automatic Mode"}
                        >
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => handleToggleProgressMode(project._id, !project.isAutomaticProgress)}
                            sx={{ ml: 1 }}
                          >
                            {project.isAutomaticProgress ? "Automatic" : "Manual"}
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete Project">
                          <IconButton onClick={() => handleDeleteClick(project)} color="secondary">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Create/Edit Project Modal */}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>
            {isEditing ? "Edit Project" : "Create New Project"}
            <IconButton
              aria-label="close"
              onClick={() => setIsModalOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {/* Project Name */}
            <TextField
              fullWidth
              margin="dense"
              label="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />

            {/* Project Owner */}
            <FormControl fullWidth margin="dense">
  <InputLabel>Select Project Owner (User)</InputLabel>
  <Select
    value={newProject.user}
    onChange={(e) => setNewProject({ ...newProject, user: e.target.value })}
    label="Select Project Owner (User)"
  >
    {users.length > 0 ? (
      users.map((userOption) => (
        <MenuItem key={userOption._id} value={userOption.Username}>
          {userOption.Username}
        </MenuItem>
      ))
    ) : (
      <MenuItem value="" disabled>
        No Users Available
      </MenuItem>
    )}
  </Select>
</FormControl>


            {/* Template */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Select Template</InputLabel>
              <Select
                value={newProject.template}
                onChange={(e) => setNewProject({ ...newProject, template: e.target.value })}
                label="Select Template"
              >
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <MenuItem key={template._id} value={template._id}>
                      {template.title}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No Templates Available
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Location */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Select Project Location</InputLabel>
              <Select
                value={newProject.location}
                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                label="Select Project Location"
              >
                {locations && locations.length > 0 ? (
                  locations.map((locationOption) => (
                    <MenuItem key={locationOption._id} value={locationOption.name}>
                      {locationOption.name} - {locationOption.markup}% markup
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No Locations Available
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Total Area */}
            <TextField
              fullWidth
              margin="dense"
              label="Total Area (sqm)"
              type="number"
              value={newProject.totalArea}
              onChange={handleTotalAreaChange}
              error={!!totalAreaError}
              helperText={totalAreaError}
              InputProps={{
                inputProps: { min: 0 },
              }}
            />

            {/* Floor Height */}
            <TextField
              fullWidth
              margin="dense"
              label="Floor Height (meters)"
              type="number"
              value={newProject.avgFloorHeight}
              onChange={handleFloorHeightChange}
              error={!!heightError}
              helperText={heightError}
              InputProps={{
                inputProps: { min: 0 },
              }}
            />

            {/* Room Count */}
            <TextField
              fullWidth
              margin="dense"
              label="Number of Rooms"
              type="number"
              value={newProject.roomCount}
              onChange={handleRoomCountChange}
              error={!!roomCountError}
              helperText={roomCountError}
              InputProps={{
                inputProps: { min: 0 },
              }}
            />

            {/* Foundation Depth */}
            <TextField
              fullWidth
              margin="dense"
              label="Foundation Depth (meters)"
              type="number"
              value={newProject.foundationDepth}
              onChange={handleFoundationDepthChange}
              error={!!foundationDepthError}
              helperText={foundationDepthError}
              InputProps={{
                inputProps: { min: 0 },
              }}
            />

            {/* Number of Floors */}
            {!isEditing && (
              <TextField
                fullWidth
                margin="dense"
                label="Number of Floors"
                type="number"
                value={newProject.numFloors}
                onChange={handleNumFloorsChange}
                error={!!floorError}
                helperText={floorError}
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />
            )}

            {/* Project Timeline */}
            <Box display="flex" alignItems="center" mt={2}>
              <TextField
                label="Duration"
                type="number"
                value={newProject.timeline.duration}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value, 10));
                  setNewProject({
                    ...newProject,
                    timeline: { ...newProject.timeline, duration: value },
                  });
                }}
                sx={{ mr: 2 }}
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />
              <FormControl>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={newProject.timeline.unit}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      timeline: { ...newProject.timeline, unit: e.target.value },
                    })
                  }
                  label="Unit"
                >
                  <MenuItem value="weeks">Weeks</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Floors and Tasks */}
{newProject.floors.map((floor, floorIndex) => (
  <Accordion key={floorIndex}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>{floor.name}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {/* Floor Progress */}
      <TextField
        fullWidth
        margin="dense"
        label="Progress"
        type="number"
        value={floor.progress}
        onChange={(e) =>
          handleFloorChange(floorIndex, "progress", parseInt(e.target.value, 10))
        }
      />

<Box mt={2} mb={2}>
  <Button variant="contained" component="label" sx={{ mt: 1 }}>
    Upload Floor Image
    <input
      type="file"
      accept="image/*"
      hidden
      multiple
      onChange={(e) => handleImageUpload(e, floorIndex)}
    />
  </Button>

  <Box mt={2} mb={2}>
  <Typography variant="subtitle2">Existing Floor Images</Typography>
  <Box display="flex" flexWrap="wrap" gap={2}>
    {(newProject.floors[floorIndex]?.images || []).filter(Boolean).map((img, imageIndex) => (
      <Box key={imageIndex} position="relative" display="flex" flexDirection="column" alignItems="center">
        {/* Image Display */}
        <img
          src={img.isLocal ? img.preview : img.path}
          alt={`Floor Image ${imageIndex + 1}`}
          style={{
            width: "150px",
            height: "150px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        />

        {/* Remark Field */}
        <TextField
          fullWidth
          margin="dense"
          label="Remark"
          value={img.remark || ""}
          onChange={(e) =>
            handleUpdateImageRemark(floorIndex, imageIndex, e.target.value)
          }
          sx={{ mt: 1 }}
        />

        {/* Delete Button */}
        <IconButton
          size="small"
          onClick={() => handleDeleteExistingImage(floorIndex, imageIndex)}
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    ))}
  </Box>
</Box>

{/* Floor Images */}
{localImages[floorIndex]?.images?.map((img, imageIndex) => (
  <Box key={imageIndex} mt={2} position="relative" display="inline-block">
    <img
      src={img.preview}
      alt={`Floor Image ${imageIndex + 1}`}
      style={{
        width: "150px",
        height: "150px",
        objectFit: "cover",
        borderRadius: "8px",
      }}
    />
    <IconButton
      size="small"
      onClick={() => handleRemoveImage(floorIndex, imageIndex)}
      style={{
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </Box>
))}






</Box>


      {/* Tasks */}
      {floor.tasks.map((task, taskIndex) => (
        <Box key={taskIndex} mt={2} mb={2} p={2} border={1} borderRadius={1}>
          {/* Task Name */}
          <TextField
            fullWidth
            margin="dense"
            label="Task Name"
            value={task.name}
            onChange={(e) => handleTaskChange(floorIndex, taskIndex, "name", e.target.value)}
          />

          {/* Task Progress */}
          <TextField
            fullWidth
            margin="dense"
            label="Task Progress"
            type="number"
            value={task.progress}
            onChange={(e) =>
              handleTaskChange(floorIndex, taskIndex, "progress", parseInt(e.target.value, 10))
            }
          />
      
          {/* Task Image and Remark */}
          <Box mt={2} mb={2}>
             <Button variant="contained" component="label" sx={{ mt: 1 }}>
    Upload Task Image
    <input
      type="file"
      accept="image/*"
      hidden
      multiple
      onChange={(e) => handleImageUpload(e, floorIndex, taskIndex)}
    />
  </Button>
          </Box>


          <Box mt={2} mb={2}>
  <Typography variant="subtitle2">Existing Tasks Images</Typography>
  <Box display="flex" flexWrap="wrap" gap={2}>
    {(task.images || []).filter(Boolean).map((img, imageIndex) => (
      <Box key={imageIndex} position="relative" display="flex" flexDirection="column" alignItems="center">
        {/* Image Display */}
        <img
          src={img.path}
          alt={`Floor Image ${imageIndex + 1}`}
          style={{
            width: "150px",
            height: "150px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        />

<TextField
  fullWidth
  margin="dense"
  label="Remark"
  value={img.remark || ""} // Display the current remark for task images
  onChange={(e) =>
    handleUpdateTaskImageRemark(floorIndex, taskIndex, imageIndex, e.target.value) // Handle remark changes for task images
  }
  sx={{ mt: 1 }}
/>

        {/* Delete Button */}
        <IconButton
          size="small"
          onClick={() => handleDeleteExistingTaskImage(floorIndex, taskIndex, imageIndex)}
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    ))}
  </Box>
</Box>
        
          {/* Task Images */}
{localImages[floorIndex]?.tasks[taskIndex]?.images?.map((img, imageIndex) => (
  <Box key={imageIndex} mt={2} position="relative" display="inline-block">
    <img
      src={img.preview}
      alt="Task Preview"
      style={{
        width: "150px",
        height: "150px",
        objectFit: "cover",
        borderRadius: "8px",
      }}
    />
    <IconButton
      size="small"
      onClick={() => handleRemoveImage(floorIndex, imageIndex, taskIndex)}
      style={{
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </Box>
))}


{isEditing && (
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => deleteTask(floorIndex, taskIndex)}
        sx={{ mt: 1 }}
      >
        Delete Task
      </Button>
    )}
        </Box>
      ))}
      {/* Add Task and Delete Floor Buttons */}
{isEditing && (
  <>
    <Button variant="contained" onClick={() => addTaskToFloor(floorIndex)} sx={{ mt: 1 }}>
      Add Task
    </Button>
    <Button
      variant="outlined"
      color="secondary"
      onClick={() => deleteFloor(floorIndex)}
      sx={{ mt: 1, ml: 2 }}
    >
      Delete Floor
    </Button>
  </>
)}

    </AccordionDetails>
  </Accordion>
))}


            {isEditing && (
              <Button variant="contained" onClick={addFloor} sx={{ mt: 2 }}>
                Add Floor
              </Button>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              onClick={isEditing ? handleUpdateProject : handleCreateProject}
              variant="contained"
              color="secondary"
            >
              {isEditing ? "Update Project" : "Create Project"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Project Details Modal */}
        {showDetailsModal && selectedProject && (
          <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} fullWidth maxWidth="md">
            <DialogTitle>
              Project Details - {selectedProject.name}
              <IconButton
                aria-label="close"
                onClick={() => setShowDetailsModal(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {/* Basic Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography><strong>Project Owner:</strong> {selectedProject.user || 'N/A'}</Typography>
                  <Typography><strong>Project Contractor:</strong> {selectedProject.contractor || 'N/A'}</Typography>
                  <Typography>
                    <strong>Template:</strong>{" "}
                    {templates.find((template) => template._id === selectedProject.template)?.title || "N/A"}
                  </Typography>
                  <Typography><strong>Status:</strong> {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}</Typography>
                </AccordionDetails>
              </Accordion>

              {/* Location */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Location</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography><strong>Location Name:</strong> {selectedProject.location || 'N/A'}</Typography>
                  <Typography><strong>Markup:</strong> {locations.find(loc => loc.name === selectedProject.location)?.markup || 'N/A'}%</Typography>
                </AccordionDetails>
              </Accordion>

              {/* Specifications */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Specifications</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography><strong>Total Area:</strong> {selectedProject.totalArea} sqm</Typography>
                  <Typography><strong>Floor Height:</strong> {selectedProject.avgFloorHeight} meters</Typography>
                  <Typography><strong>Number of Rooms:</strong> {selectedProject.roomCount}</Typography>
                  <Typography><strong>Foundation Depth:</strong> {selectedProject.foundationDepth} meters</Typography>
                </AccordionDetails>
              </Accordion>

              {/* Timeline */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Timeline</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    <strong>Duration:</strong> {selectedProject.timeline.duration} {selectedProject.timeline.unit}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Project Dates */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Project Dates</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography><strong>Start Date:</strong> {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'N/A'}</Typography>
                  <Typography><strong>End Date:</strong> {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'N/A'}</Typography>
                  {/* Postponed Dates */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Postponed Dates</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {selectedProject.postponedDates.length > 0 ? (
                        selectedProject.postponedDates.map((date, index) => (
                          <Typography key={index}>{new Date(date).toLocaleDateString()}</Typography>
                        ))
                      ) : (
                        <Typography>No postponed dates</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                  {/* Resumed Dates */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Resumed Dates</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {selectedProject.resumedDates.length > 0 ? (
                        selectedProject.resumedDates.map((date, index) => (
                          <Typography key={index}>{new Date(date).toLocaleDateString()}</Typography>
                        ))
                      ) : (
                        <Typography>No resumed dates</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </AccordionDetails>
              </Accordion>

              {/* Floors and Tasks */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Floors and Tasks</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedProject.floors.map((floor, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{floor.name} - Progress: {floor.progress}%</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {floor.tasks.length > 0 ? (
                          floor.tasks.map((task, taskIndex) => (
                            <Box key={taskIndex} mb={2}>
                              <Typography><strong>Task Name:</strong> {task.name}</Typography>
                              <Typography><strong>Task Progress:</strong> {task.progress}%</Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography>No tasks available</Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>

              {/* BOM Section */}
              {selectedProject.bom && selectedProject.bom.categories.length > 0 ? (
                <>
                  <Typography variant="h6" mt={2}>Bill of Materials (BOM)</Typography>
                  <Typography>
                    <strong>Total Project Cost:</strong> ₱{selectedProject.bom.markedUpCosts?.totalProjectCost?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography>
                    <strong>Labor Cost:</strong> ₱{selectedProject.bom.markedUpCosts?.laborCost?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Button variant="contained" color="secondary" onClick={() => handleGenerateBOMPDF('client')} sx={{ mt: 2, mr: 2 }}>
                    Download BOM for Client
                  </Button>
                  <Button variant="contained" color="secondary" onClick={() => handleGenerateBOMPDF('contractor')} sx={{ mt: 2 }}>
                    Download BOM for Contractor
                  </Button>
                </>
              ) : (
                <Typography mt={2}><strong>BOM data is not available for this project.</strong></Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Confirm Delete Image Dialog */}
<Dialog
  open={showImageDeleteModal}
  onClose={handleCancelDeleteImage}
  aria-labelledby="confirm-delete-image-title"
>
  <DialogTitle id="confirm-delete-image-title">Confirm Delete</DialogTitle>
  <DialogContent>
    <Typography>Are you sure you want to delete this image?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCancelDeleteImage}>Cancel</Button>
    <Button onClick={handleConfirmDeleteImage} color="secondary" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>


        {/* Confirm Delete Dialog */}
        <Dialog
          open={showDeleteModal}
          onClose={handleCancelDelete}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
          <DialogContent>
            <Typography id="alert-dialog-description">
              Are you sure you want to delete the project "{selectedProject?.name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="secondary" variant="contained" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

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

export default ProjectList;