const { default: mongoose } = require('mongoose');
const Project = require('../models/projectModel');
const upload = require("../middlewares/upload");
const cloudinary = require('cloudinary').v2;

/**
 * Upload image and remark for a specific task.
 */
const uploadTaskImage = async (req, res) => {
    try {
      const { projectId, floorId, taskId } = req.params;
      const { remark } = req.body;
  
      // Debugging: Log req.file
      console.log('req.file:', req.file);
  
      // Validate uploaded file
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }
  
      // Ensure the buffer is not empty
      if (!req.file.buffer || !req.file.buffer.length) {
        return res.status(400).json({ error: 'Uploaded file is empty' });
      }
  
      // Upload to Cloudinary using the buffer
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
  
        // Pass the buffer to the stream
        stream.end(req.file.buffer);
      });
  
      // Validate Cloudinary response
      if (!result || !result.secure_url || !result.public_id) {
        return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
      }
  
      // Find project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
  
      // Find floor
      const floor = project.floors.id(floorId);
      if (!floor) {
        return res.status(404).json({ error: 'Floor not found' });
      }
  
      // Find task
      const task = floor.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      // Add image and remark to the task
      task.images.push({
        path: result.secure_url,
        public_id: result.public_id,
        remark: remark || '',
      });
  
      await project.save();
  
      res.status(200).json({
        success: true,
        message: 'Image and remark added to task successfully.',
        image: {
          path: result.secure_url,
          public_id: result.public_id,
          remark: remark || '',
        },
      });
    } catch (error) {
      console.error('Error uploading task image:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
  
  
  
  
  /**
   * Upload image and remark for a specific floor.
   */
  const uploadFloorImage = async (req, res) => {
    try {
      const { projectId, floorId } = req.params;
      const { remark } = req.body;
  
      // Debugging: Log req.file
      console.log('req.file:', req.file);
  
      // Validate uploaded file
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }
  
      // Ensure the buffer is not empty
      if (!req.file.buffer || !req.file.buffer.length) {
        return res.status(400).json({ error: 'Uploaded file is empty' });
      }
  
      // Upload to Cloudinary using the buffer
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
  
        // Pass the buffer to the stream
        stream.end(req.file.buffer);
      });
  
      // Validate Cloudinary response
      if (!result || !result.secure_url || !result.public_id) {
        return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
      }
  
      // Find project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
  
      // Find floor
      const floor = project.floors.id(floorId);
      if (!floor) {
        return res.status(404).json({ error: 'Floor not found' });
      }
  
      // Add image and remark to the floor
      floor.images.push({
        path: result.secure_url,
        public_id: result.public_id,
        remark: remark || '',
      });
  
      await project.save();
  
      res.status(200).json({
        success: true,
        message: 'Image and remark added to floor successfully.',
        image: {
          path: result.secure_url,
          public_id: result.public_id,
          remark: remark || '',
        },
      });
    } catch (error) {
      console.error('Error uploading floor image:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
  
  

  
  const deleteTaskImage = async (req, res) => {
    try {
      const { projectId, floorId, taskId, imageId } = req.params;
  
      // Find project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
  
      // Find floor
      const floor = project.floors.id(floorId);
      if (!floor) {
        return res.status(404).json({ error: 'Floor not found' });
      }
  
      // Find task
      const task = floor.tasks.id(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      // Find image
      const image = task.images.id(imageId);
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
  
      // Delete image from Cloudinary using public_id
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      } else {
        console.warn('No public_id found for image:', imageId);
      }
  
      // Remove image from task images array
      image.deleteOne();
  
      // Save the project
      await project.save();
  
      res.status(200).json({
        success: true,
        message: 'Task image deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting task image:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
  
  

  const deleteFloorImage = async (req, res) => {
    try {
      const { projectId, floorId, imageId } = req.params;
  
      console.log(`Attempting to delete image ID: ${imageId} from floor ID: ${floorId} in project ID: ${projectId}`);
  
      // Validate ObjectId formats
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }
      if (!mongoose.Types.ObjectId.isValid(floorId)) {
        return res.status(400).json({ error: 'Invalid floor ID.' });
      }
      if (!mongoose.Types.ObjectId.isValid(imageId)) {
        return res.status(400).json({ error: 'Invalid image ID.' });
      }
  
      // Find project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
  
      // Find floor
      const floor = project.floors.id(floorId);
      if (!floor) {
        return res.status(404).json({ error: 'Floor not found.' });
      }
  
      // Debug: Log floor images
      console.log('Current floor images:', floor.images);
  
      // Find image
      const image = floor.images.id(imageId);
      console.log('Found image:', image);
  
      if (!image) {
        return res.status(404).json({ error: 'Image not found.' });
      }
  
      // Check if image has the remove method
      
  
      // Delete image from Cloudinary using public_id
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
        console.log(`Image with public_id ${image.public_id} deleted from Cloudinary.`);
      } else {
        console.warn('No public_id found for image:', imageId);
      }
  
      // Remove image from floor images array
      image.deleteOne();
      console.log(`Image ID ${imageId} removed from floor images.`);
  
      // Save the project
      await project.save();
      console.log('Project saved successfully after image removal.');
  
      res.status(200).json({
        success: true,
        message: 'Floor image deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting floor image:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
  

    
  
  
  module.exports = { uploadTaskImage, uploadFloorImage, deleteTaskImage,
    deleteFloorImage };