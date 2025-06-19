import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import image from "../assets/IMAGE1.jpg";
import styles from "../css/UserDashboard.module.css";
import { useAuthContext } from "../hooks/useAuthContext";
import Navbar from "../components/Navbar";
import ChangePasswordModal from "../components/ChangePasswordModal"; 
import axios from 'axios';
import AlertModal from '../components/AlertModal'; // Import AlertModal

const UserDashboard = () => {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // Alert Modal State
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info"); // Default alert type
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef(null);

  // Function to show alerts
  const showAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`https://foxconstruction-final.onrender.com/api/project/projectuser`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        const fetchedProjects = response.data.map(project => ({
          ...project,
        }));
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        showAlert("Error", "Failed to fetch projects. Please try again later.", "error");
      }
    };

    const checkDefaultPassword = async () => {
      try {
        const response = await axios.get(`https://foxconstruction-final.onrender.com/api/user/is-default-password`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.data.isDefault) {
          setShowPasswordModal(true);
        } else {
          setIsPasswordChanged(true);
        }
      } catch (error) {
        console.error('Error checking default password:', error);
        showAlert("Error", "Failed to verify password status.", "error");
      }
    };

    if (user && user.token) {
      fetchProjects();
      checkDefaultPassword();
    } else {
      showAlert("Authentication Error", "User is not authenticated. Please log in again.", "error");
    }
  }, [user]);

  const handlePasswordChange = async (newPassword) => {
    setIsSubmitting(true);
    try {
      await axios.patch(`https://foxconstruction-final.onrender.com/api/user/change-password`, { newPassword }, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      showAlert("Success", "Password changed successfully.", "success");
      setIsPasswordChanged(true);
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response && error.response.data && error.response.data.error) {
        showAlert("Error", error.response.data.error, "error");
      } else {
        showAlert("Error", "Failed to change password.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <ChangePasswordModal 
        show={showPasswordModal} 
        onClose={() => {
          if (!isPasswordChanged) {
            // Do nothing to prevent closing until password is changed
          } else {
            setShowPasswordModal(false);
          }
        }}
        onSubmit={handlePasswordChange}
        isSubmitting={isSubmitting} 
      />
      <div className={styles.NameBanner}>
        {user && <p>WELCOME BACK, {user.Username}!</p>}
      </div>
      
      <div className={styles.cardContainer} ref={containerRef}>
        {projects.length > 0 ? (
          projects.map(project => (
            <Link to={`/project/${project._id}`} key={project._id} className={styles.card}>
              <img src={image} alt={project.name} />
              <div className={styles.cardContent}>
                <h1>{project.name}</h1>
                <div className={styles.projectInfo}>
                  <p>{project.status}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p>No projects available for this user.</p>
        )}
      </div>

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

export default UserDashboard;
