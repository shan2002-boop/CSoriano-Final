const express = require('express')
const {createMaterial, getMaterials, deleteMaterial, getOneMaterial, updateMaterial} = require('../controllers/materialsController')

const router = express.Router();

// get all materials
router.get('/', getMaterials)

// get specific material
router.get('/:id', getOneMaterial)

// create a new material
router.post('/', createMaterial)

// delete a material
router.delete('/:id', deleteMaterial)

// update a material
router.patch('/:id', updateMaterial)

module.exports = router

