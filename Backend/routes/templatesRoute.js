// routes/templateRoutes.js

const express = require('express');
const router = express.Router();

const {
  createCustomTemplate,
  addMaterialToCategory,
  getTemplates,
  getTemplateById,
  deleteTemplate,
  updateTemplate,
  removeMaterialFromCategory
} = require('../controllers/templateController');

const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

// Get all templates
router.get('/', authMiddleware, getTemplates);

// Get specific template by ID
router.get('/:id', authMiddleware, getTemplateById);

// Create a new template
router.post('/', authMiddleware, createCustomTemplate);

// Add material to a category in a template
router.post('/:templateId/categories/:categoryName/materials', authMiddleware, addMaterialToCategory);

// Delete a template
router.delete('/:id', authMiddleware, deleteTemplate);

router.delete('/:templateId/categories/:categoryName/materials/:description', authMiddleware, removeMaterialFromCategory);

// Update a template
router.patch('/:id', authMiddleware, updateTemplate);

module.exports = router;
