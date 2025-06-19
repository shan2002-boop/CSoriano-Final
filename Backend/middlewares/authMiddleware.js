const jwt = require('jsonwebtoken');
const User = require('../models/usersModel');

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = await User.findOne({ _id: decoded._id }).select('_id role Username'); 
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

// General role-based authorization middleware
const authorizeRoles = (permissions) => {
  return (req, res, next) => {
    const userRole = req.user.role; 
    if (permissions.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
  };
};

module.exports = {
  authMiddleware,   // Protects routes by verifying token and fetching user
  authorizeRoles,   // Protects routes based on roles
};
