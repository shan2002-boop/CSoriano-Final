const express = require('express');
const {
  getProjectsByContractor,
  createProject,
  getProject,
  getProjectById,
  updateProject,
  deleteProject,
  updateFloorProgress,
  getProjectForUser,
  updateProjectStatus,
  saveBOMToProject,
  postponeProject,
  resumeProject,
  endProject,
  startProject,
  resetFloorProgressToAutomatic,
  toggleProgressMode 
} = require('../controllers/projectController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload'); // Your Multer configuration for Cloudinary
const { uploadTaskImage, uploadFloorImage, deleteTaskImage,
  deleteFloorImage} = require('../controllers/imagesController');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Project-specific routes
router.get('/contractor', getProjectsByContractor); // Get all projects for contractor
router.get('/projectuser', getProjectForUser); // Get all projects for logged-in user
router.get('/:id', getProjectById); // Get specific project by ID
router.get('/', getProject); // Get all projects
router.post('/', createProject); // Create a new project
router.patch('/:id', updateProject); // Update a project
router.delete('/:id', deleteProject); // Delete a project
router.patch('/:id/status', updateProjectStatus); // Update project status

// Floor and task-related routes
router.patch('/:projectId/floors/:floorId', updateFloorProgress); // Update floor progress
router.post('/:projectId/floors/:floorId/reset', resetFloorProgressToAutomatic); // Reset floor progress to automatic

// Upload image for a specific task
router.post('/:projectId/floors/:floorId/tasks/:taskId/images', upload.single('image'), uploadTaskImage);

// Upload image for a specific floor
router.post('/:projectId/floors/:floorId/images', upload.single('image'), uploadFloorImage);



// Route to delete a task image
router.delete(
  '/:projectId/floors/:floorId/tasks/:taskId/images/:imageId',
  deleteTaskImage
);

// Route to delete a floor image
router.delete(
  '/:projectId/floors/:floorId/images/:imageId',
  deleteFloorImage
);

// BOM-related route
router.post('/:id/boms', saveBOMToProject); // Save BOM to project

// Project management action routes
router.patch('/:id/start', startProject); // Start project
router.patch('/:id/postpone', postponeProject); // Postpone project
router.patch('/:id/resume', resumeProject); // Resume project
router.patch('/:id/end', endProject); // End project

// Toggle progress mode (automatic/manual)
router.patch('/:id/progress-mode', toggleProgressMode);

module.exports = router;
