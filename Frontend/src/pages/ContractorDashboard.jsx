import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from "../components/Navbar";
import styles from "../css/ContractorDashboard.module.css";
import Picture from "../assets/IMAGE1.jpg";
import ChangePasswordModal from "../components/ChangePasswordModal"; 
import { useAuthContext } from "../hooks/useAuthContext";
import axios from 'axios';

const ContractorDashboard = () => {
  const { user } = useAuthContext();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setIsPasswordChanged(true);
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Error changing password:", error);
      throw new Error("Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        isSubmitting={isSubmitting}
      />
      <div className={styles.dashboardContainer}>
        {isPasswordChanged ? (
          <>
            <Link to="/ProjectList" className={styles.dashboardCard}>
              <img src={Picture} alt="Project List" className={styles.dashboardImage} />
              <div className={styles.cardText}>PROJECT LISTS</div>
            </Link>
            <Link to="/HouseSliders" className={styles.dashboardCard}>
              <img src={Picture} alt="House Sliders" className={styles.dashboardImage} />
              <div className={styles.cardText}>HOUSE SLIDERS</div>
            </Link>
            <Link to="/Templates" className={styles.dashboardCard}>
              <img src={Picture} alt="Templates" className={styles.dashboardImage} />
              <div className={styles.cardText}>TEMPLATES</div>
            </Link>
            <Link to="/Generator" className={styles.dashboardCard}>
              <img src={Picture} alt="Generate BOM" className={styles.dashboardImage} />
              <div className={styles.cardText}>GENERATE A BOM</div>
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

export default ContractorDashboard;
