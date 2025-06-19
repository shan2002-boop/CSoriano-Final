const mongoose = require('mongoose');
const schema = mongoose.Schema;

const materialSchema = new schema({
  item: { type: String, required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' }, // Add this line
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  cost: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  scaling: { 
    areaFactor: { type: Number, default: 1 },
    heightFactor: { type: Number, default: 1 },
    roomCountFactor: { type: Number, default: 0 }, 
    foundationDepthFactor: { type: Number, default: 0 } 
  }
});


const categorySchema = new schema({
  category: { type: String, required: true },
  materials: [materialSchema]
});

const bomSchema = new schema({
  totalArea: { type: Number, required: true },
  numFloors: { type: Number, required: true },
  avgFloorHeight: { type: Number, required: true },
  roomCount: { type: Number, required: true }, 
  foundationDepth: { type: Number, required: true }, 
  categories: [categorySchema],
  laborCost: { type: Number, required: true },
  totalProjectCost: { type: Number, required: true },
});

const templatesSchema = new schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["residential"], required: true },
  tier: { type: String, enum: ["economy", "standard", "premium"], required: true },
  bom: bomSchema,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',},
}, { timestamps: true });

module.exports = mongoose.model('Template', templatesSchema);
