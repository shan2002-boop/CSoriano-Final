// src/components/ChangePasswordModal.jsx
import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PropTypes from 'prop-types';

// Styles for the modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

const ChangePasswordModal = ({ show, onClose, onSubmit, isSubmitting }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State to manage password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for error and success messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&#]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  // Determine strength label and color
  const getStrengthLabel = (strength) => {
    switch (strength) {
      case 0:
      case 1:
      case 2:
        return { label: 'Weak', color: 'error' };
      case 3:
        return { label: 'Medium', color: 'warning' };
      case 4:
      case 5:
        return { label: 'Strong', color: 'success' };
      default:
        return { label: 'Weak', color: 'error' };
    }
  };

  const { label: strengthLabel, color: strengthColor } = getStrengthLabel(passwordStrength);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic frontend validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength < 3) {
      setError('Please choose a stronger password.');
      return;
    }

    // Call the onSubmit prop to handle password change
    try {
      await onSubmit(newPassword);
      setSuccess('Password changed successfully.');
      // Optionally, reset the form fields
      setNewPassword('');
      setConfirmPassword('');
    } catch (submissionError) {
      // Handle errors returned from the onSubmit function
      setError(submissionError.message || 'Failed to change password.');
    }
  };

  return (
    <Modal
      open={show}
      onClose={() => { /* Do nothing to prevent closing */ }}
      aria-labelledby="change-password-modal-title"
      aria-describedby="change-password-modal-description"
      disableEscapeKeyDown
      hideBackdrop={false} // Keep backdrop to prevent interaction with background
    >
      <Box sx={style}>
        <Typography id="change-password-modal-title" variant="h6" component="h2" gutterBottom>
          Change Your Password
        </Typography>

        {/* Display Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Display Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* New Password Field */}
          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {newPassword && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Password Strength: {strengthLabel}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength / 5) * 100}
                color={strengthColor}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}

          {/* Confirm Password Field */}
          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Change Password'
            )}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

// Define PropTypes for better type checking
ChangePasswordModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};

export default ChangePasswordModal;
