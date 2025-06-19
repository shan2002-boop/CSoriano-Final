const { default: mongoose } = require('mongoose');
const Material = require('../models/materialsModel');

// get all materials
const getMaterials = async(req, res) => {
  try {
    const materials = await Material.find({}).sort({createdAt: -1})
    res.status(200).json(materials)
  } catch (error) {
    res.status(404).json({error: error.message})
  }
}

// create a new material
const createMaterial = async(req, res) => {
  const {description, unit, cost} = req.body
  
  //add this to db
  try {
    const material = await Material.create({description, unit, cost})
    res.status(200).json(material)
  } catch (error) {
    res.status(404).json({error: error.message})
  }
}

// get single material
const getOneMaterial = async (req, res) => {
  const { id } = req.params

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'id does not exist'})
  }
  
  const material = await Material.findById(id)

  if(!material) {
    return res.status(404).json({error: 'Material does not exist'})
  }

  res.status(200).json(material)
}

// delete a material
const deleteMaterial = async (req, res) => {
  const {id} = req.params

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'id does not exist'})
  }


  try {
    const deletedMaterial = await Material.findOneAndDelete({_id: id})
    if(!deletedMaterial) {
      return res.status(404).json({error: 'Material does not exist'})
    }
    res.status(200).json(deletedMaterial + "is deleted")
  } catch (error) {
    res.status(500).json({error: 'error occured'})
  }
}

// update a material
const Template = require('../models/templatesModel'); // Import the Template model

const updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { cost } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'ID does not exist' });
  }

  try {
    // Update the material's data
    const updatedMaterial = await Material.findOneAndUpdate({ _id: id }, { cost }, { new: true });
    if (!updatedMaterial) {
      return res.status(404).json({ error: 'Material does not exist' });
    }

    // Find all templates containing this material
    const templates = await Template.find({ "bom.categories.materials.materialId": id });

    // Update the cost in each template
    for (const template of templates) {
      let updated = false;

      for (const category of template.bom.categories) {
        for (const material of category.materials) {
          if (material.materialId && material.materialId.toString() === id) {
            material.cost = cost;
            material.totalAmount = parseFloat((material.quantity * cost).toFixed(2));
            updated = true;
          }
        }
      }

      if (updated) {
        await template.save();
        console.log(`Updated template ${template.title} with new material cost.`);
      }
    }

    res.status(200).json({ success: true, updatedMaterial, message: 'Material and templates updated successfully' });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material and templates' });
  }
};


module.exports = {
  createMaterial,
  getMaterials,
  deleteMaterial,
  getOneMaterial,
  updateMaterial
}