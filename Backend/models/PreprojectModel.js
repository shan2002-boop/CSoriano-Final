const mongoose = require('mongoose');
const schema = mongoose.Schema;

const materialSchema = new schema({
  item: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  cost: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
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
  materialTotalCost: { type: Number, required: true },
  tax: { type: Number, required: true },
  totalProjectCost: { type: Number, required: true },
});

const imageSchema = new mongoose.Schema({
    path: String,
    public_id: String,
  }, { _id: true })

const PreprojectSchema = new schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["residential"], required: true },
  image: [imageSchema],
  bom: bomSchema,
}, { timestamps: true });

module.exports = mongoose.model('Preproject', PreprojectSchema);
