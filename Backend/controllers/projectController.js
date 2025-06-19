const { default: mongoose } = require('mongoose');
const Project = require('../models/projectModel');
const User = require('../models/usersModel');
const Template = require('../models/templatesModel');
const { DateTime } = require('luxon');

const calculateCumulativeDelay = (project) => {
  let totalDelay = 0;

  for (let i = 0; i < project.postponedDates.length; i++) {
    const postponedDate = new Date(project.postponedDates[i]);
    const resumedDate = project.resumedDates[i]
      ? new Date(project.resumedDates[i])
      : new Date(); // If no resumedDate, assume it's still postponed

    // Calculate the difference in days
    const delayInDays = Math.floor((resumedDate - postponedDate) / (1000 * 60 * 60 * 24));
    totalDelay += delayInDays;
  }

  return totalDelay;
};


const distributeTaskProgress = (floorProgress, tasks) => {
  if (tasks.length === 0) return [];
  
  // Define weights for tasks based on complexity, duration, etc.
  const weights = tasks.map(task => task.complexityWeight || 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  return tasks.map((task, index) => {
    if (task.isManual) return task.progress; // Keep manual progress as is
    const allocatedProgress = Math.round((weights[index] / totalWeight) * floorProgress);
    return Math.min(allocatedProgress, 100);
  });
};


const distributeFloorProgress = (totalProgress, numFloors, floors) => {
  // Define a weight for each floor; adjust these values as needed
  const weights = floors.map((floor, index) => floor.complexityWeight || 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  return floors.map((floor, index) => {
    if (floor.isManual) return floor.progress; // Keep manual progress as is
    const allocatedProgress = Math.round((weights[index] / totalWeight) * totalProgress);
    return Math.min(allocatedProgress, 100);
  });
};





const applyHybridProgress = (project) => {
  const totalProgress = calculateProgress(project) || 0;
  project.progress = totalProgress;

  // Distribute progress across floors
  const floorsProgress = distributeFloorProgress(totalProgress, project.floors.length, project.floors);

  project.floors.forEach((floor, index) => {
    if (!floor.isManual) {
      floor.progress = floorsProgress[index];
    }

    // Distribute progress for tasks within each floor
    const tasksProgress = distributeTaskProgress(floor.progress, floor.tasks);
    floor.tasks = floor.tasks.map((task, taskIndex) => {
      if (!task.isManual) {
        // Apply distributed progress directly to each task
        task.progress = tasksProgress[taskIndex];
      }
      return task;
    });
  });

  project.markModified('floors'); // Indicate floors array has been modified for Mongoose
  return project;
};






const calculateProgress = (project) => {
  if (!project.isAutomaticProgress) {
    console.log(`Project ID: ${project._id} is in manual mode. Returning default progress of 0.`);
    return 0;
  }

  const currentDate = new Date();
  const timelineInDays = project.timeline.unit === 'weeks' 
    ? project.timeline.duration * 7 
    : project.timeline.duration * 30;
  const cumulativeDelay = calculateCumulativeDelay(project);
  const adjustedTimelineInDays = timelineInDays + cumulativeDelay;
  const daysElapsed = Math.floor((currentDate - project.referenceDate) / (1000 * 60 * 60 * 24));

  // Debug logs to track calculation values
  console.log(`Project: ${project.name}`);
  console.log(`Reference Date: ${project.referenceDate}`);
  console.log(`Current Date: ${currentDate}`);
  console.log(`Days Elapsed: ${daysElapsed}`);
  console.log(`Timeline in Days: ${timelineInDays}`);
  console.log(`Cumulative Delay: ${cumulativeDelay}`);
  console.log(`Adjusted Timeline: ${adjustedTimelineInDays}`);

  const calculatedProgress = Math.min((daysElapsed / adjustedTimelineInDays) * 100, 100);
  console.log(`Calculated progress for project ${project.name}: ${Math.round(calculatedProgress)}`);
  
  return Math.round(calculatedProgress);
};







const getProjectsByContractor = async (req, res) => {
  const contractorUsername = req.user.Username;

  if (!contractorUsername) {
    return res.status(401).json({ error: "Contractor information missing in the request" });
  }

  try {
    const projects = await Project.find({ contractor: contractorUsername })
      .populate('location')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};





// Create a new project
const createProject = async (req, res) => {
  const { 
    name, 
    contractor: contractorUsername, 
    user: userUsername, 
    numFloors, // Input number of floors instead of detailed floor data
    template, 
    timeline, 
    status, 
    location, 
    totalArea, 
    avgFloorHeight, 
    roomCount, 
    foundationDepth 
  } = req.body;

  try {
    // Fetch contractor and user by username
    const contractorObject = await User.findOne({ Username: contractorUsername });
    const userObject = await User.findOne({ Username: userUsername });

    if (!contractorObject || contractorObject.role !== 'contractor') {
      return res.status(403).json({ error: "The provided contractor is invalid or not a contractor." });
    }
    if (!userObject) {
      return res.status(404).json({ error: "The provided user does not exist." });
    }

    const templateObject = await Template.findById(template);
    if (!templateObject) {
      return res.status(404).json({ error: "Template not found." });
    }

    // Validate required fields
    if (!location || !totalArea || totalArea <= 0 || !avgFloorHeight || avgFloorHeight <= 0 || !foundationDepth || foundationDepth <= 0 || !roomCount || roomCount <= 0) {
      return res.status(400).json({ error: "Required fields are missing or invalid." });
    }

    // Generate floors with decreasing weights based on floor order
    const formattedFloors = Array.from({ length: numFloors }, (_, index) => ({
      name: `FLOOR ${index + 1}`,
      progress: 0,
      isManual: false,
      complexityWeight: numFloors - index, // Highest weight for the first floor
      tasks: [] // Empty tasks initially
    }));

    // Set startDate and referenceDate
    const now = new Date();

    const project = await Project.create({
      name,
      contractor: contractorObject.Username,
      user: userObject.Username,
      floors: formattedFloors,
      template: templateObject._id,
      timeline,
      location,
      totalArea,
      avgFloorHeight,
      roomCount,
      foundationDepth,
      status: 'not started',
      startDate: now,
      referenceDate: now
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project.", details: error.message });
  }
};




// Get all projects
const getProject = async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all projects for the logged-in user
const getProjectForUser = async (req, res) => {
  try {
    const username = req.user.Username;
    if (!username) {
      return res.status(401).json({ error: "User information is missing" });
    }

    const projects = await Project.find({ user: username }).sort({ createdAt: -1 });

    if (!projects.length) {
      return res.status(404).json({ message: 'No projects found for this user.' });
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects for user:', error);
    res.status(500).json({ message: 'Server error. Please try again later.', details: error.message });
  }
};



// Update floor progress in a project
const updateFloorProgress = async (req, res) => {
  const { progress, isManual } = req.body;

  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const floor = project.floors.id(req.params.floorId);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    floor.progress = Math.round(progress);
    floor.isManual = isManual || false;

    // Check if all floors are now in automatic mode
    if (!project.floors.some(floor => floor.isManual)) {
      // Reset referenceDate if switching to automatic
      project.isManualProgress = false;
      project.referenceDate = new Date();
    }

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    console.error("Error updating floor progress:", error);
    res.status(500).json({ message: error.message });
  }
};




// Get project by ID and update progress
const getProjectById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid project ID format' });
  }

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project' });
  }
};




// Update project status to "ongoing" when started
// Update project status to "ongoing" when started
const startProject = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Only set startDate and referenceDate if the project is starting for the first time
    if (project.status === 'not started') {
      const now = new Date();
      project.startDate = now;              // Set startDate to now
      project.referenceDate = now;          // Set referenceDate to start from today
    }

    project.status = "ongoing";
    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Update project status to "finished" when ended
const endProject = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Update the end date and status
    project.status = "finished";
    project.endDate = new Date(); // Store the end date
    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resumeProject = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.status = "ongoing";
    const resumedDate = new Date();
    project.resumedDates.push(resumedDate);

    // Update referenceDate only when resuming from a postponed state
    project.referenceDate = resumedDate;

    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Postpone project and log the date
// Postpone project and log the date
const postponeProject = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.status = "postponed";
    project.postponedDates.push(new Date());

    // Do not modify referenceDate

    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Reset floor progress to automatic mode (additional endpoint)
const resetFloorProgressToAutomatic = async (req, res) => {
  try {
    const { projectId, floorId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const floor = project.floors.id(floorId);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    if (!floor.isManual) {
      return res.status(400).json({ message: 'Floor progress is already in automatic mode.' });
    }

    // Reset the manual flag
    floor.isManual = false;

    // Adjust the referenceDate to now for continuity
    project.referenceDate = new Date();

    // Mark the floors array as modified
    project.markModified('floors');

    // Save the updated project
    await project.save();

    res.status(200).json({ message: 'Floor progress reset to automatic mode.', project });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset floor progress.", details: error.message });
  }
};

const updateProjectStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.updateStatus(status);
    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ error: "Failed to update project status.", details: error.message });
  }
};

const saveBOMToProject = async (req, res) => {
  const { id } = req.params;
  const { bom } = req.body;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!bom || !bom.categories || !bom.categories.length) {
      return res.status(400).json({ message: 'BOM must include categories and materials data.' });
    }

    // Format the materials within each category
    const formattedCategories = bom.categories.map(category => ({
      category: category.category,
      materials: category.materials.map(material => ({
        item: material.item,
        description: material.description,
        quantity: material.quantity,
        unit: material.unit,
        cost: material.cost,
        totalAmount: material.totalAmount
      }))
    }));

    // Assign the formatted BOM to the project
    project.bom = {
      projectDetails: bom.projectDetails || {},
      categories: formattedCategories,
      originalCosts: bom.originalCosts || {},
      markedUpCosts: bom.markedUpCosts || {},
    };

    project.bom = bom; // This will now work with Schema.Types.Mixed

    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error saving BOM to project:", error);
    res.status(500).json({ error: 'Failed to save BOM to project.', details: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Apply the changes from req.body
    Object.assign(project, req.body);

    // Optionally update hybrid progress calculation if needed
    const updatedProject = applyHybridProgress(project);

    await updatedProject.save();
    res.status(200).json({ project: updatedProject });  // Ensure the response has a consistent structure
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project.", details: error.message });
  }
};

const toggleProgressMode = async (req, res) => {
  try {
    const { id } = req.params; // Project ID
    const { isAutomatic } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.isAutomaticProgress = isAutomatic;

    if (isAutomatic) {
      // Reset reference date when switching to automatic mode
      project.referenceDate = new Date();

      // Set all floors and tasks to automatic mode
      project.floors.forEach(floor => {
        floor.isManual = false;
        floor.tasks.forEach(task => {
          task.isManual = false;
        });
      });
    } else {
      // Set all floors and tasks to manual mode
      project.floors.forEach(floor => {
        floor.isManual = true;
        floor.tasks.forEach(task => {
          task.isManual = true;
        });
      });
    }

    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error('Error toggling progress mode:', error);
    res.status(500).json({ error: 'Failed to toggle progress mode', details: error.message });
  }
};







const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Optional: Handle cascade deletions for related data
    // For example, delete associated audit logs
    /*
    await AuditLog.deleteMany({ projectId: project._id });
    */

    res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project.", details: error.message });
  }
};


module.exports = {
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
  resetFloorProgressToAutomatic, // Export the new reset function
  toggleProgressMode
};
