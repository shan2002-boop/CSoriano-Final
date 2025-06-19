const Location = require('../models/locationsModel');
const Template = require('../models/templatesModel');

const generateBOM = async (req, res) => {
  let { totalArea, numFloors, avgFloorHeight, templateId, roomCount, foundationDepth, locationName } = req.body;

  try {
    totalArea = parseFloat(totalArea);
    numFloors = parseInt(numFloors, 10);
    avgFloorHeight = parseFloat(avgFloorHeight);
    roomCount = roomCount ? parseInt(roomCount, 10) : 6; 
    foundationDepth = foundationDepth ? parseFloat(foundationDepth) : 1.5; 

  
    const baseTemplate = await Template.findById(templateId).lean();
    if (!baseTemplate) {
      return res.status(404).json({ error: "Template not found." });
    }

    // Calculate scale factors
    const areaFactor = totalArea / baseTemplate.bom.totalArea;
    const floorFactor = numFloors / baseTemplate.bom.numFloors;
    const heightFactor = avgFloorHeight / baseTemplate.bom.avgFloorHeight;
    const roomFactor = roomCount / baseTemplate.bom.roomCount;
    const foundationFactor = foundationDepth / baseTemplate.bom.foundationDepth;
    const scaleFactor = areaFactor * floorFactor * heightFactor;

    // Scale the materials based on the category and scaling factors
    const scaledCategories = baseTemplate.bom.categories.map((category) => {
      const scaledMaterials = category.materials.map((material) => {
        let scaledQuantity;

        // Category-specific scaling logic with additional factors if needed
        switch (category.category.toLowerCase().trim()) {
          case 'earthwork':
            scaledQuantity = material.quantity * areaFactor * heightFactor;
            break;
          case 'concrete':
          case 'rebars':
            scaledQuantity = material.quantity * areaFactor * floorFactor * heightFactor;
            break;
          case 'formworks':
          case 'scaffoldings':
            scaledQuantity = material.quantity * areaFactor * floorFactor;
            break;
          case 'masonry':
            scaledQuantity = material.quantity * areaFactor * floorFactor;
            break;
          case 'architectural - tiles':
          case 'architectural - painting':
            scaledQuantity = material.quantity * areaFactor * floorFactor;
            break;
          case 'roofing':
            scaledQuantity = material.quantity * areaFactor;
            break;
          case 'doors and windows':
            scaledQuantity = material.quantity * roomFactor;
            break;
          case 'electrical':
          case 'plumbing':
            scaledQuantity = material.quantity * areaFactor * floorFactor * roomFactor;
            break;
          case 'septic tank and catch basins':
            scaledQuantity = material.quantity * foundationFactor;
            break;
          default:
            scaledQuantity = material.quantity * scaleFactor; 
        }

        // Apply additional scaling based on material-specific factors
        scaledQuantity *= material.scaling.roomCountFactor ? roomFactor : 1;
        scaledQuantity *= material.scaling.foundationDepthFactor ? foundationFactor : 1;

        const unitsToRound = ['bags', 'pieces', 'units','gals','gal', 'pcs', 'shts', 'set', 'lot','cu.m',
  'set', 'm', 'L-m', 'sheets', 'pieces', 'meters', 'bar', 'tin', 'tubes','boxes'];
        if (unitsToRound.includes(material.unit.toLowerCase())) {
          scaledQuantity = Math.ceil(scaledQuantity);
        }

  
        const scaledTotalAmount = material.cost * scaledQuantity;

        return {
          ...material,
          quantity: scaledQuantity,
          totalAmount: scaledTotalAmount,
        };
      });

      // Calculate total for each category
      const categoryTotal = scaledMaterials.reduce((sum, material) => sum + material.totalAmount, 0);

      return { ...category, materials: scaledMaterials, categoryTotal };
    });

    // Recalculate labor and project costs
    const totalMaterialsCost = scaledCategories.reduce((sum, category) => sum + category.categoryTotal, 0);

    let originalLaborCost = totalMaterialsCost * 0.35;
    let originalTotalProjectCost = totalMaterialsCost + originalLaborCost;

    // Apply location markup if selected
    let markedUpLaborCost = originalLaborCost;
    let markedUpTotalProjectCost = originalTotalProjectCost;
    let locationMarkup = 0;

    if (locationName) {
      const location = await Location.findOne({ name: locationName });
      if (!location) {
        return res.status(404).json({ error: "Location not found." });
      }

      locationMarkup = location.markup;
      const markupPercentage = locationMarkup / 100;
      markedUpLaborCost += originalLaborCost * markupPercentage;
      markedUpTotalProjectCost += originalTotalProjectCost * markupPercentage;
    }

    const bom = {
      projectDetails: {
        totalArea,
        numFloors,
        avgFloorHeight,
        roomCount,
        foundationDepth,
        location: { name: locationName, markup: locationMarkup },
      },
      categories: scaledCategories,
      originalCosts: {
        laborCost: originalLaborCost,
        totalProjectCost: originalTotalProjectCost,
      },
      markedUpCosts: {
        laborCost: markedUpLaborCost,
        totalProjectCost: markedUpTotalProjectCost,
      },
    };

    if (!bom || !bom.categories || !bom.categories.length || bom.categories.some(c => !c.materials || !c.materials.length)) {
      return res.status(400).json({ message: 'BOM must include categories and materials data' });
    }

    res.status(200).json({ success: true, bom });

  } catch (error) {
    console.error("Error generating BOM:", error.message);
    res.status(500).json({ error: "Failed to generate BOM.", details: error.message });
  }
};

module.exports = { generateBOM };
