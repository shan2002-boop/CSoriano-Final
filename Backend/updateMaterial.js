const mongoose = require('mongoose');
const Template = require('./models/templatesModel');
const Material = require('./models/materialsModel');

const syncMaterialIdsInTemplates = async () => {
  try {
    await mongoose.connect('mongodb+srv://jhestineitsolution:Mhynemagno213@foxconstruction.jm1atcg.mongodb.net/?retryWrites=true&w=majority&appName=FoxConstruction', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const templates = await Template.find();

    for (const template of templates) {
      let updated = false;
      for (const category of template.bom.categories) {
        for (const material of category.materials) {
          if (!material.materialId) {
            const existingMaterial = await Material.findOne({ description: material.description });
            if (existingMaterial) {
              material.materialId = existingMaterial._id;
              updated = true;
            } else {
              console.log(`No match found for material description: ${material.description}`);
            }
          }
        }
      }
      if (updated) {
        await template.save();
        console.log(`Updated template ${template.title} with material IDs.`);
      }
    }
    console.log("All templates updated with material IDs.");
  } catch (error) {
    console.error("Error updating templates with material IDs:", error);
  } finally {
    mongoose.disconnect();
  }
};

syncMaterialIdsInTemplates();
