require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const materialRoutes = require('./routes/materialsRoute');
const locationRoutes = require('./routes/locationsRoute');
const templatesRoutes = require('./routes/templatesRoute');
const bomRoutes = require('./routes/bomRoute');
const userRoutes = require('./routes/usersRoute');
const projectRoutes = require('./routes/projectRoute');
const preprojectRoutes = require('./routes/preprojectRoute');
const { authMiddleware, authorizeRoles } = require('./middlewares/authMiddleware');
const cors = require('cors');
const cron = require('node-cron');
const Project = require('./models/projectModel');

// express app
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// ✅ FIXED CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:5173',
  'https://foxconstruction.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed for this origin: ' + origin));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ✅ ROUTES
app.use('/api/user', userRoutes);
app.use('/api/materials', authMiddleware, authorizeRoles(['contractor', 'admin', 'user']), materialRoutes);
app.use('/api/locations', authMiddleware, authorizeRoles(['contractor', 'admin', 'user']), locationRoutes);
app.use('/api/templates', authMiddleware, authorizeRoles(['contractor', 'admin']), templatesRoutes);
app.use('/api/bom', authMiddleware, authorizeRoles(['contractor', 'admin']), bomRoutes);
app.use('/api/project', authMiddleware, authorizeRoles(['contractor', 'admin', 'user']), projectRoutes);
app.use('/api/preprojects', authMiddleware, authorizeRoles(['contractor', 'admin', 'user']), preprojectRoutes);

// ✅ DAILY PROGRESS UPDATER
const updateDailyProgress = async () => {
  try {
    const ongoingProjects = await Project.find({ status: 'ongoing' });
    console.log(`Found ${ongoingProjects.length} ongoing projects to update.`);

    for (const project of ongoingProjects) {
      console.log(`Updating progress for project: ${project.name}`);
      project.applyHybridProgress();
      await project.save();
      console.log(`Updated progress for project "${project.name}" to ${project.progress}%`);
    }

    console.log("All ongoing projects have been updated successfully.");
  } catch (error) {
    console.error("Error updating project progress:", error);
  }
};

// ✅ CONNECT TO MONGO & START SERVER
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log('Connected to DB and listening on ' + process.env.PORT);

      // Schedule the job to run every day at midnight
      cron.schedule('0 0 * * *', () => {
        console.log("Running daily project progress update...");
        updateDailyProgress();
      }, {
        timezone: "Asia/Manila"
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
