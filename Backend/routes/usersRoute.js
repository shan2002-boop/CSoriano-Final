const express = require('express');
const {
  loginUser, signupUser, deleteUser, getUsers, getsUsers, resetPassword, changePassword, isDefaultPassword, forgotPassword
} = require('../controllers/userController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware'); 
const router = express.Router();

// get all users (for admin or roles allowed)
router.get('/', authMiddleware, authorizeRoles(['admin']), getUsers);

// login route (no authorization needed)
router.post('/login', loginUser);

// sign-up route (no authorization needed)
router.post('/signup', signupUser);

// delete user (authorized roles only)
router.delete('/:id', authMiddleware, authorizeRoles(['admin']), deleteUser);

// get users with role 'user' (for admin or roles allowed)
router.get('/get', authMiddleware, authorizeRoles(['admin','contractor']), getsUsers);

// reset password to default (authorized roles only)
router.patch('/reset-password/:id', authMiddleware, authorizeRoles(['admin']), resetPassword);

// change own password (authenticated user)
router.patch('/change-password', authMiddleware, changePassword);

// check if user is using the default password (authenticated user)
router.get('/is-default-password', authMiddleware, isDefaultPassword);

// forgot password route (public, no auth required)
router.patch('/forgot-password/:Username', forgotPassword);

module.exports = router;
