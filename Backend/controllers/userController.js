const User = require('../models/usersModel');
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '3d' });
};

// Login user
const loginUser = async (req, res) => {
  const { Username, password } = req.body;

  try {
    const USER = await User.findOne({ Username });
    if (!USER) {
      console.log('User not found:', Username);
      return res.status(400).json({ error: 'User not found' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcryptjs.compare(password, USER.password);
    if (!passwordMatch) {
      console.log('Password mismatch for user:', Username);
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Create token
    const token = createToken(USER._id);

    // Respond with user details and token
    return res.status(200).json({ Username, role: USER.role, token, id: USER._id });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server Error' });
  }
};

// Fetch users with role 'user'
const getsUsers = async (req, res) => {
  try {
    // Find only users with the role 'user'
    const users = await User.find({ role: 'user' });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Signup user
const signupUser = async (req, res) => {
  const { Username, role } = req.body;
  const defaultPassword = "12345678";

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  try {
    // Check if the Username already exists
    const existingUser = await User.findOne({ Username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the default password
    const hashedPassword = await bcryptjs.hash(defaultPassword, 10);

    // Create a new user with the default password
    const USER = await User.create({ Username, password: hashedPassword, role });

    // Create a token
    const token = createToken(USER._id);

    res.status(201).json({ message: 'User created successfully', Username, token });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Invalid user ID' });
  }

  try {
    const deletedUser = await User.findOneAndDelete({ _id: id });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User does not exist' });
    }
    res.status(200).json({ message: `User ${deletedUser.Username} is deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Error occurred while deleting user' });
  }
};

// Reset password to default
const resetPassword = async (req, res) => {
  const { id } = req.params;
  const defaultPassword = "12345678";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Invalid user ID' });
  }

  try {
    // Hash the default password
    const hashedPassword = await bcryptjs.hash(defaultPassword, 10);

    // Update the user's password and reset the forgotPassword field to false
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword, forgotPassword: false },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: `Password reset to default for user ${updatedUser.Username}` });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password in the database
    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Check if the current password is the default one
const isDefaultPassword = async (req, res) => {
  const DEFAULT_PASSWORD = '';  // Define the default password
  try {
    const USER = await User.findById(req.user._id);
    
    if (!USER) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isDefault = await bcryptjs.compare(DEFAULT_PASSWORD, USER.password);

    res.status(200).json({ isDefault });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Forgot password handler
const forgotPassword = async (req, res) => {
  const { Username } = req.params;

  try {
    // Check if the user exists
    const userExists = await User.findOne({ Username });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark the user as having forgotten their password
    await User.findByIdAndUpdate(userExists._id, { forgotPassword: true });

    res.status(200).json({ message: `Password reset request noted for user: ${Username}` });
  } catch (error) {
    console.error('Error updating forgot password status:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  loginUser,
  signupUser,
  deleteUser,
  getUsers,
  getsUsers,
  resetPassword,
  changePassword,
  isDefaultPassword,
  forgotPassword,
};
