const mongoose = require('mongoose');
const Project = require('./models/projectModel'); // Adjust the path as necessary

async function updateProjectsWithComplexityWeights() {
  try {
    // Connect to the MongoDB database
    await mongoose.connect('mongodb+srv://jhestineitsolution:Mhynemagno213@foxconstruction.jm1atcg.mongodb.net/?retryWrites=true&w=majority&appName=FoxConstruction', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");

    // Fetch all projects
    const projects = await Project.find({});

    // Iterate over each project
    for (let project of projects) {
      // Check if floors exist
      if (project.floors && project.floors.length > 0) {
        // Update each floor's complexity weight based on its position
        project.floors.forEach((floor, index) => {
          floor.complexityWeight = project.floors.length - index;
        });

        // Mark floors as modified so that Mongoose updates the database
        project.markModified('floors');

        // Save the updated project
        await project.save();
        console.log(`Updated project ${project.name} with complexity weights`);
      }
    }

    console.log("All projects updated successfully");

  } catch (error) {
    console.error("Error updating projects:", error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log("Disconnected from the database");
  }
}

// Run the update script
updateProjectsWithComplexityWeights();
