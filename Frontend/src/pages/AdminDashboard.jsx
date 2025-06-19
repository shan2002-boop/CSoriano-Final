// src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import styles from "../css/AdminDashboard.module.css"; 
import Picture from "../assets/IMAGE1.jpg";
import ChangePasswordModal from "../components/ChangePasswordModal"; 
import { useAuthContext } from "../hooks/useAuthContext";
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // To handle loading state
  const [isSubmitting, setIsSubmitting] = useState(false); // For submission state

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    checkDefaultPassword();
  }, [user]);

  const handlePasswordChange = async (newPassword) => {
    setIsSubmitting(true);
    try {
      await axios.patch(`https://foxconstruction-final.onrender.com/api/user/change-password`, { newPassword }, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      // Assuming onSubmit resolves without returning data
      setIsPasswordChanged(true);
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Error changing password:", error);
      // Throw error to be caught in ChangePasswordModal
      throw error.response?.data || new Error("Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // Prevent rendering dashboard content until loading is complete
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ChangePasswordModal 
        show={showPasswordModal} 
        onClose={() => {
          if (!isPasswordChanged) {
            // Do nothing to prevent closing
          } else {
            setShowPasswordModal(false);
          }
        }} 
        onSubmit={handlePasswordChange} 
        isSubmitting={isSubmitting} // Pass the submission state
      />
      <div className={styles.dashboardContainer}>
        {isPasswordChanged ? (
          <>
            <Link to="/Accounts" className={styles.dashboardCard}>
              <img
                src={Picture}
                alt="Account Management"
                className={styles.dashboardImage}
              />
              <div className={styles.dashboardOverlay}>
                <div className={styles.cardText}>ACCOUNT LIST</div>
              </div>
            </Link>
            <Link to="/Materials" className={styles.dashboardCard}>
              <img
                src={Picture}
                alt="Materials"
                className={styles.dashboardImage}
              />
              <div className={styles.dashboardOverlay}>
                <div className={styles.cardText}>MATERIALS</div>
              </div>
            </Link>
            <Link to="/Location" className={styles.dashboardCard}>
              <img
                src={Picture}
                alt="Locations"
                className={styles.dashboardImage}
              />
              <div className={styles.dashboardOverlay}>
                <div className={styles.cardText}>LOCATIONS</div>
              </div>
            </Link>
          </>
        ) : (
          <div className={styles.blockingOverlay}>
            <p>Please change your default password to access the dashboard.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
