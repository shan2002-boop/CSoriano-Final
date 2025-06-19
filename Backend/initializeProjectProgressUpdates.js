const mongoose = require('mongoose');
const Project = require('./models/projectModel');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://jhestineitsolution:Mhynemagno213@foxconstruction.jm1atcg.mongodb.net/?retryWrites=true&w=majority&appName=FoxConstruction", { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); 
  }
};

// Function to update progress for all projects in automatic mode
const updateAllProjectsProgress = async (filter = {}) => {
  try {
    const projects = await Project.find(filter);

    for (const project of projects) {
      if (project.isAutomaticProgress) {
        // Manually adjust referenceDate for testing (e.g., 10 days in the past)
        project.referenceDate = new Date(new Date().setDate(new Date().getDate() - 10));
        project.applyHybridProgress();
        await project.save();
        console.log(`Saved progress for project ${project.name}: ${project.progress}`);
      }
    }
    console.log("All projects updated successfully.");
  } catch (error) {
    console.error("Error updating project progress:", error);
  }
};




const testUpdateProgress = async () => {
  await updateAllProjectsProgress();

  const projects = await Project.find({});
  projects.forEach(project => {
    console.log(`Final saved progress for project ${project.name}: ${project.progress}`);
  });
};



// Function to initialize automatic progress updates at server startup
const initializeProjectProgressUpdates = async () => {
  await connectDB();
  await updateAllProjectsProgress();
  await testUpdateProgress();
  mongoose.disconnect();
};

// Call this function at server startup, or expose it as an API endpoint for manual triggering
initializeProjectProgressUpdates();
