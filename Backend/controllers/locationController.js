const { default: mongoose } = require('mongoose');
const Location = require('../models/locationsModel');

// get all locations
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({}).sort({createdAt: -1})
    res.status(200).json(locations)
  } catch (error) {
    res.status(404).json({error: error.message})
  }
}

// get single location
const getOneLocation = async (req, res) => {
  const {id} = req.params

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'id does not exist'})
  }

  const location = await Location.findById(id)

  if(!location) {
    return res.status(404).json({error: 'Location does not exist'})
  }

  res.status(200).json(location)
}

// create a location 
const createLocation = async (req, res) => {
  const {name, markup} = req.body

  try{
  const createdLocation = await Location.create({name, markup})
  res.status(200).json(createdLocation)
  } catch (error) {
    res.status(404).json({error: error.message})
  }
}

// delete a location
const deleteLocation = async (req, res) => {
  const {id} = req.params

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'id does not exist'})
  }


  try {
    const deletedLocation = await Location.findOneAndDelete({_id: id})
    if(!deletedLocation) {
      return res.status(404).json({error: 'Location does not exist'})
    }
    res.status(200).json(deletedLocation + "is deleted")
  } catch (error) {
    res.status(500).json({error: 'error occured'})
  }
}

// update a location
const updateLocation = async (req, res) => {
  const {id} = req.params

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'id does not exist'})
  }

  try {
    const updatedLocation = await Location.findOneAndUpdate({_id: id}, {
      ...req.body
    })
    if(!updatedLocation) {
      return res.status(404).json({error: 'Material does not exist'})
    }
    res.status(200).json(updatedLocation)
  } catch (error) {
    res.status(500).json({error: 'error occured'})
  }
}

module.exports = {
  getLocations,
  getOneLocation,
  createLocation,
  deleteLocation,
  updateLocation
}