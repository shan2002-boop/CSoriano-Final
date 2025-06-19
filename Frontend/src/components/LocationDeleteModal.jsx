import React from 'react';
import styles from '../css/LocationDeleteModal.module.css';

const LocationDeleteModal = ({ isOpen, onClose, onConfirm, locationName }) => {
  return isOpen ? (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <span className={styles.closeButton} onClick={onClose}>&times;</span>
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete the location "{locationName}"?</p>
        <div className={styles.modalActions}>
          <button onClick={onConfirm} className={styles.deleteButton}>Confirm</button>
          <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
        </div>
      </div>
    </div>
  ) : null;
};

export default LocationDeleteModal;
