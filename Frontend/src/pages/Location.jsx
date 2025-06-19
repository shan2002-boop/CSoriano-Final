import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal,
  InputLabel,
  CircularProgress,
  FormControl,
} from '@mui/material';
import { useAuthContext } from "../hooks/useAuthContext";
import Navbar from "../components/Navbar";
import LocationDeleteModal from "../components/LocationDeleteModal";

const Location = () => {
  const [locations, setLocations] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editedLocation, setEditedLocation] = useState({ name: '', markup: '' });
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [newLocation, setNewLocation] = useState({ name: '', markup: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  useEffect(() => {
    if (!user || !user.token) return;

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://foxconstruction-final.onrender.com/api/locations`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setLocations(response.data);
      } catch (error) {
        console.error('Error fetching locations:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user]);

  const handleEdit = (location) => {
    setIsEditing(location._id);
    setEditedLocation({ name: location.name, markup: location.markup });
  };

  const handleSave = async (id) => {
    try {
      const updatedLocation = { ...editedLocation };
      await axios.patch(`https://foxconstruction-final.onrender.com/api/locations/${id}`, updatedLocation, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setLocations((prevLocations) =>
        prevLocations.map((location) =>
          location._id === id ? { ...location, ...updatedLocation } : location
        )
      );
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://foxconstruction-final.onrender.com/api/locations/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setLocations((prevLocations) => prevLocations.filter((location) => location._id !== id));
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filterLocations = () => {
    if (!searchTerm) return locations;
    return locations.filter(
      (location) =>
        location.name &&
        location.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleCreate = async () => {
    try {
      if (!newLocation.name || !newLocation.markup) {
        console.error('All fields are required.');
        return;
      }

      const response = await axios.post(`https://foxconstruction-final.onrender.com/api/locations`, newLocation, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setLocations((prevLocations) => [...prevLocations, response.data]);
      setNewLocation({ name: '', markup: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating location:', error.response?.data || error.message);
    }
  };

  const filteredLocations = filterLocations();

  const openConfirmDeleteModal = (location) => {
    setLocationToDelete(location);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (locationToDelete) {
      handleDelete(locationToDelete._id);
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Locations
        </Typography>
        <TextField
          label="Search locations..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Typography variant="body1" sx={{ mb: 2 }}>
          Total Locations: {filteredLocations.length}
        </Typography>

        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          sx={{ backgroundColor: "#3f5930", "&:hover": { backgroundColor: "#6b7c61" }, mb: 2 }}
        >
          + Create New Location
        </Button>

        {loading ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading locations...
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell>Markup %</TableCell>
                  <TableCell>Date Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location._id}>
                    <TableCell>
                      {isEditing === location._id ? (
                        <TextField
                          variant="outlined"
                          value={editedLocation.name}
                          onChange={(e) => setEditedLocation({ ...editedLocation, name: e.target.value })}
                          fullWidth
                        />
                      ) : (
                        location.name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === location._id ? (
                        <TextField
                          type="number"
                          variant="outlined"
                          value={editedLocation.markup}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value));
                            setEditedLocation({ ...editedLocation, markup: value });
                          }}
                          onBlur={() => {
                            const value = editedLocation.markup === '' ? 0 : parseFloat(editedLocation.markup);
                            setEditedLocation({ ...editedLocation, markup: value });
                          }}
                          fullWidth
                        />
                      ) : (
                        location.markup
                      )}
                    </TableCell>
                    <TableCell>{new Date(location.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {isEditing === location._id ? (
                        <Button onClick={() => handleSave(location._id)} variant="contained" color="primary">
                          Save
                        </Button>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(location)} variant="outlined" sx={{ mr: 1 }}>
                            Edit
                          </Button>
                          <Button onClick={() => openConfirmDeleteModal(location)} variant="contained" color="error">
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Location Modal */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              p: 4,
              boxShadow: 24,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Location
            </Typography>
            <TextField
              label="Location Name"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Markup %"
              type="number"
              value={newLocation.markup}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value));
                setNewLocation({ ...newLocation, markup: value });
              }}
              onBlur={() => {
                const value = newLocation.markup === '' ? 0 : parseFloat(newLocation.markup);
                setNewLocation({ ...newLocation, markup: value });
              }}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={handleCreate}
              sx={{ mt: 2, backgroundColor: "#3f5930", "&:hover": { backgroundColor: "#6b7c61" } }}
              fullWidth
            >
              Create Location
            </Button>
          </Box>
        </Modal>

        {/* Confirm Delete Location Modal */}
        <LocationDeleteModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={confirmDelete}
          locationName={locationToDelete?.name}
        />
      </Box>
    </>
  );
};

export default Location;
