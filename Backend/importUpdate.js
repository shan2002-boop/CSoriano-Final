const mongoose = require('mongoose');
const Template = require('./models/templatesModel'); 

// Connect to MongoDB
mongoose.connect('mongodb+srv://jhestineitsolution:Mhynemagno213@foxconstruction.jm1atcg.mongodb.net/?retryWrites=true&w=majority&appName=FoxConstruction', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const copyMaterialsFromEconomyToAllTemplates = async () => {
  try {
    // Find the "economy" template
    const economyTemplate = await Template.findOne({ tier: 'economy' });
    if (!economyTemplate) {
      console.log("Economy template not found.");
      return;
    }

    // Get materials from the economy template
    const economyMaterials = economyTemplate.bom.categories;

    // Find all other templates
    const otherTemplates = await Template.find({ tier: { $ne: 'economy' } });

    for (const template of otherTemplates) {
      // Update each category in the template with economy materials
      template.bom.categories = template.bom.categories.map(category => {
        const economyCategory = economyMaterials.find(cat => cat.category === category.category);
        
        if (economyCategory) {
          // If category exists, keep original materials and add any from economy not already present
          const newMaterials = economyCategory.materials.filter(
            economyMaterial => !category.materials.some(
              mat => mat._id.equals(economyMaterial._id)
            )
          );
          return {
            ...category,
            materials: [...category.materials, ...newMaterials],
          };
        }
        
        // If category doesn't exist in the template, add it entirely
        return {
          category: economyCategory.category,
          materials: economyCategory.materials,
        };
      });

      // Save the updated template
      await template.save();
      console.log(`Updated materials for template: ${template.title}`);
    }
    
    console.log("All templates updated with economy materials.");
  } catch (error) {
    console.error("Error updating templates:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the function
copyMaterialsFromEconomyToAllTemplates();
