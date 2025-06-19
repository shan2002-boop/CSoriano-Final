require('dotenv').config();

const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Material = require('../models/materialsModel'); 


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); 
  }
};


const importMaterials = async () => {
  try {
   
    const workbook = xlsx.readFile('./data/CE-Price-List2.xlsx'); 
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

  
    const materials = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Raw Materials Data:', materials);


    let headerIndex = -1;
    for (let i = 0; i < materials.length; i++) {
      if (materials[i][0] && materials[i][0].trim() === 'DESCRIPTION') {
        headerIndex = i;
        break;
      }
    }

  
    if (headerIndex !== -1) {
      const headers = materials[headerIndex].map(header => header.trim());
      console.log('Headers:', headers);

      const dataRows = materials.slice(headerIndex + 1);

      const transformedMaterials = dataRows.map((item, index) => {
        try {
         
          if (item[0] && item[2] && item[1] !== undefined) {
            return {
              Description: item[0].trim(),
              unit: item[2].trim(),
              cost: parseFloat(item[1].toString().replace(',', '').trim()) 
            };
          }
          console.warn(`Skipping row ${index + headerIndex + 1} due to missing data:`, item);
          return null;
        } catch (error) {
          console.error(`Error processing row ${index + headerIndex + 1}:`, item, error);
          return null;
        }
      }).filter(item => item !== null);

     
      console.log('Transformed Materials:', transformedMaterials);

   
      await Material.insertMany(transformedMaterials);
      console.log('Materials imported successfully');
    } else {
      console.error('Headers not found in the Excel file');
    }
  } catch (error) {
    console.error('Failed to import materials', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the functions
const run = async () => {
  await connectDB();
  await importMaterials();
};

run();
