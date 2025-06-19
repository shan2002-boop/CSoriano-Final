const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new mongoose.Schema({
  path: String,
  public_id: String,
  remark: String,
}, { _id: true })

// Task Schema with isManual flag and complexityWeight
const taskSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isManual: {
    type: Boolean,
    default: false
  },
  complexityWeight: {
    type: Number,
    default: 1 // Set a default weight of 1 if not specified
  },
  images: [imageSchema]
}, { timestamps: true });

// Floor Schema with isManual flag, tasks, and complexityWeight
const floorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isManual: {
    type: Boolean,
    default: false
  },
  complexityWeight: {
    type: Number,
    default: 1 // Set a default weight of 1 if not specified
  }, images: [imageSchema],
  tasks: [taskSchema]
}, { timestamps: true });


// Project Schema with immutability and clarity in date fields
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contractor: { type: String, required: true },
  user: { type: String, required: true },
  floors: [floorSchema],
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  timeline: {
    duration: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['weeks', 'months'], default: 'months' }
  },
  location: { type: String, required: true },
  totalArea: { type: Number, required: true },
  avgFloorHeight: { type: Number, required: true },
  roomCount: { type: Number, default: 1 },
  foundationDepth: { type: Number, default: 1 },
  status: { type: String, enum: ['not started', 'ongoing', 'postponed', 'finished'], default: 'not started' },
  startDate: { type: Date, required: true, immutable: true, default: () => new Date() },
  isAutomaticProgress: { type: Boolean, default: true },
  progress: { type: Number, default: 0 }, // Make sure progress is defined here
  endDate: { type: Date },
  adjustedTimelineDuration: { type: Number },
  postponedDates: { type: [Date], default: [] },
  resumedDates: { type: [Date], default: [] },
  referenceDate: { type: Date, required: true, default: () => new Date() },
  bom: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Helper method to calculate and update project progress based on floor/task progress
projectSchema.methods.updateProgress = function() {
  if (this.isAutomaticProgress) {
    let totalProgress = 0;
    let floorCount = this.floors.length;

    this.floors.forEach(floor => {
      let taskProgress = 0;
      if (floor.tasks && floor.tasks.length > 0) {
        taskProgress = floor.tasks.reduce((acc, task) => acc + task.progress, 0) / floor.tasks.length;
      }
      floor.progress = taskProgress;
      totalProgress += floor.progress;
    });

    this.progress = totalProgress / floorCount;
  }
};

// Middleware to automatically update progress when floors/tasks are modified and isAutomaticProgress is true
projectSchema.pre('save', function(next) {
  if (this.isAutomaticProgress) {
    this.updateProgress();
  }
  next();
});

// Middleware to update referenceDate and resumedDates when project is resumed
projectSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'ongoing' && !this.isManualProgress) {
    this.referenceDate = new Date();
    this.resumedDates.push(new Date());
  }
  next();
});

projectSchema.methods.updateStatus = function(newStatus) {
  const validStatuses = ["not started", "ongoing", "postponed", "finished"];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status value. Must be one of ${validStatuses.join(", ")}.`);
  }

  const previousStatus = this.status;
  this.status = newStatus;

  const now = new Date();

  switch (newStatus) {
    case "ongoing":
      if (!this.startDate) {
        this.startDate = now;
        this.referenceDate = now;
      } else if (previousStatus === "postponed") {
        this.resumedDates.push(now);
        this.referenceDate = now;
      }
      this.isAutomaticProgress = !this.floors.some(floor => floor.isManual);
      break;
    case "postponed":
      this.postponedDates.push(now);
      break;
    case "finished":
      this.endDate = now;
      this.progress = 100;
      this.floors.forEach(floor => {
        floor.progress = 100;
        floor.isManual = false;
        floor.tasks.forEach(task => {
          task.progress = 100;
          task.isManual = false;
        });
      });
      break;
    // Handle other statuses if necessary
  }
};

projectSchema.virtual('calculatedProgress').get(function() {
  return this.calculateProgress();
});


// Calculate cumulative delay
projectSchema.methods.calculateCumulativeDelay = function() {
  let totalDelay = 0;
  for (let i = 0; i < this.postponedDates.length; i++) {
    const postponedDate = new Date(this.postponedDates[i]);
    const resumedDate = this.resumedDates[i] ? new Date(this.resumedDates[i]) : new Date();
    const delayInDays = Math.floor((resumedDate - postponedDate) / (1000 * 60 * 60 * 24));
    totalDelay += delayInDays;
  }
  return totalDelay;
};

// Calculate progress based on time and delays
projectSchema.methods.calculateProgress = function() {
  if (!this.isAutomaticProgress) return 0;

  const currentDate = new Date();
  const timelineInDays = this.timeline.unit === 'weeks' 
    ? this.timeline.duration * 7 
    : this.timeline.duration * 30;

  const cumulativeDelay = this.calculateCumulativeDelay();
  const adjustedTimelineInDays = timelineInDays + cumulativeDelay;

  const daysElapsed = Math.floor((currentDate - this.referenceDate) / (1000 * 60 * 60 * 24));
  console.log(`Project: ${this.name} | Reference Date: ${this.referenceDate} | Current Date: ${currentDate} | Days Elapsed: ${daysElapsed}`);

  const calculatedProgress = Math.min((daysElapsed / adjustedTimelineInDays) * 100, 100);
  console.log(`Calculated progress for project ${this.name}: ${Math.round(calculatedProgress)}`);
  return Math.round(calculatedProgress);
};




// Distribute floor progress based on weights
projectSchema.methods.distributeFloorProgress = function(totalProgress) {
  const automaticFloors = this.floors.filter(floor => !floor.isManual);
  
  const weights = automaticFloors.map(floor => floor.complexityWeight || 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  console.log("Floor Weights:", weights);
  console.log("Total Weight of Floors:", totalWeight);

  return automaticFloors.map((floor, index) => {
    const allocatedProgress = Math.round((weights[index] / totalWeight) * totalProgress);
    console.log(`Allocated Progress for Floor ${floor.name}: ${allocatedProgress}%`);
    return Math.min(allocatedProgress, 100);
  });
};

// Distribute task progress based on weights within a floor
projectSchema.methods.distributeTaskProgress = function(floorProgress, tasks) {
  const automaticTasks = tasks.filter(task => !task.isManual);

  const weights = automaticTasks.map(task => task.complexityWeight || 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  console.log("Task Weights:", weights);
  console.log("Total Weight of Tasks:", totalWeight);

  return automaticTasks.map((task, index) => {
    const allocatedProgress = Math.round((weights[index] / totalWeight) * floorProgress);
    console.log(`Allocated Progress for Task ${task.name}: ${allocatedProgress}%`);
    return Math.min(allocatedProgress, 100);
  });
};




// Apply hybrid progress to floors and tasks
projectSchema.methods.applyHybridProgress = function() {
  const totalProgress = this.calculateProgress();
  this.progress = totalProgress;
  this.markModified('progress');

  // Distribute progress across floors
  const floorsProgress = this.distributeFloorProgress(totalProgress);

  this.floors.forEach((floor, index) => {
    if (!floor.isManual) {
      floor.progress = floorsProgress[index] || 0;
      
      // Distribute task progress if tasks are available
      if (floor.tasks && floor.tasks.length > 0) {
        const taskProgresses = this.distributeTaskProgress(floor.progress, floor.tasks);
        floor.tasks.forEach((task, taskIndex) => {
          if (!task.isManual) {
            task.progress = taskProgresses[taskIndex];
          }
        });
      }
    }
  });

  this.markModified('floors');
};









projectSchema.pre('save', function(next) {
  // Set `referenceDate` only if the project is starting for the first time
  if (this.isModified('status') && this.status === 'ongoing' && !this.startDate) {
    this.startDate = new Date();
    this.referenceDate = this.startDate;
  } else if (this.isModified('status') && this.status === 'ongoing' && this.previousStatus === 'postponed') {
    // Reset `referenceDate` only if resuming from postponed status
    this.referenceDate = new Date();
    this.resumedDates.push(this.referenceDate);
  }
  next();
});

projectSchema.pre('save', function(next) {
  // Only apply progress updates if relevant fields have changed
  if (this.isModified('floors') || this.isModified('tasks') || this.isModified('status')) {
    this.applyHybridProgress();
  }
  next();
});





projectSchema.pre('save', function(next) {
  this.applyHybridProgress();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
