import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  FormControl,
  Paper,
  Modal,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from "@mui/material";
import Navbar from "../components/Navbar";
import axios from 'axios';
import { useSignup } from "../hooks/useSignup";
import ConfirmModal from '../components/ConfirmModal';
import { useAuthContext } from '../hooks/useAuthContext';
import AlertModal from '../components/AlertModal';
import CloseIcon from "@mui/icons-material/Close";

const Accounts = () => {
  const [formData, setFormData] = useState({ Username: '', role: '' });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { signup, isLoading, error, success } = useSignup();
  const [filterRole, setFilterRole] = useState("All");
  const [filterResetPassword, setFilterResetPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  // Alert Modal States
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");

  // Function to show alerts
  const showAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !user.token) return;
      setLoading(true);
      try {
        const response = await axios.get(`https://foxconstruction-final.onrender.com/api/user`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        showAlert("Error", "Failed to fetch users. Please try again later.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user]);

  // Handle search and filters
  useEffect(() => {
    let tempUsers = [...users];

    // Filter by search query
    if (searchQuery) {
      tempUsers = tempUsers.filter(user =>
        user.Username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== 'All') {
      tempUsers = tempUsers.filter(user => user.role === filterRole);
    }

    // Filter by password reset request
    if (filterResetPassword) {
      tempUsers = tempUsers.filter(user => user.forgotPassword);
    }

    setFilteredUsers(tempUsers);
  }, [searchQuery, filterRole, filterResetPassword, users]);

  // Handle form submission for creating a new user
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await signup(formData.Username, "12345678", formData.role);

      if (result && result.user) {
        setShowCreateModal(false);
        setFormData({ Username: '', role: '' });

        await fetchUsers();
        showAlert("Success", "User account created successfully.", "success");
      }
    } catch (err) {
      console.error("Error creating user: ", err);
      showAlert("Error", "Failed to create user account. Please try again.", "error");
    }
  };

  const handleResetPasswordClick = (userId) => {
    setSelectedUserId(userId);
    setShowConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    if (!user || !user.token) {
      console.error("Authorization token is missing.");
      showAlert("Error", "Authorization token is missing. Please log in again.", "error");
      return;
    }

    try {
      await axios.patch(
        `https://foxconstruction-final.onrender.com/api/user/reset-password/${selectedUserId}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === selectedUserId ? { ...user, forgotPassword: false } : user
        )
      );
      setShowConfirmModal(false);
      setSelectedUserId(null);
      showAlert("Success", "Password has been reset to the default value.", "success");
    } catch (error) {
      console.error("Error resetting password:", error);
      showAlert("Error", "Failed to reset password. Please try again.", "error");
    }
  };

  const handleCancelReset = () => {
    setShowConfirmModal(false);
    setSelectedUserId(null);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Accounts Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search by Username"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={() => setShowCreateModal(true)}
            sx={{ backgroundColor: "#3f5930", "&:hover": { backgroundColor: "#6b7c61" } }}
          >
            Create Account
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {['admin', 'user', 'contractor', 'All'].map((role) => (
            <Button
              key={role}
              variant={filterRole === role ? "contained" : "outlined"}
              onClick={() => setFilterRole(role)}
              sx={{ textTransform: 'capitalize' }}
            >
              Show {role !== 'All' ? role : 'All'}
            </Button>
          ))}
          <Button
            variant={filterResetPassword ? "contained" : "outlined"}
            onClick={() => setFilterResetPassword(!filterResetPassword)}
          >
            {filterResetPassword ? 'Hide Password Resets' : 'Show Password Resets'}
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading accounts...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Forgot Password</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.Username}</TableCell>
                    <TableCell>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}</TableCell>
                    <TableCell>
                      {user.forgotPassword ? (
                        <Typography color="error">Requested</Typography>
                      ) : (
                        'No'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color={user.forgotPassword ? "primary" : "inherit"}
                        onClick={() => handleResetPasswordClick(user._id)}
                        disabled={!user.forgotPassword}
                      >
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Create Account Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Create Account</Typography>
            <IconButton onClick={() => setShowCreateModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              value={formData.Username}
              onChange={(e) => setFormData({ ...formData, Username: e.target.value })}
              required
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">Client</MenuItem>
                <MenuItem value="contractor">Contractor</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3, width: '100%', backgroundColor: "#3f5930", "&:hover": { backgroundColor: "#6b7c61" } }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Confirm Reset Password Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
        user={users.find(user => user._id === selectedUserId)}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
      />
    </>
  );
};

export default Accounts;
